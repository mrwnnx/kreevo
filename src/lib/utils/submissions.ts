import { anthropic } from '@/lib/anthropic/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify, notifyAllAdmins } from './notifications'

const AUTO_VALIDATE_LEAGUES = ['Stone', '7ajra', 'Bronze', 'Silver']

interface ChallengeForValidation {
  id: string
  brief: string | null
  specialty: string | null
  challenge_type: string | null
  xp_reward: number | null
  league_name?: string | null
}

interface SubmissionForValidation {
  id: string
  user_id: string
  cover_url: string
  challenge_id: string
}

export async function validateSubmissionWithAI(
  submission: SubmissionForValidation,
  challenge: ChallengeForValidation
): Promise<{ valid: boolean; reason?: string }> {
  const prompt = `Tu es un expert en design. Analyse cette soumission pour un challenge design.

Brief du challenge : ${challenge.brief ?? '—'}
Spécialité : ${challenge.specialty ?? '—'}
Type de défi : ${challenge.challenge_type ?? '—'}

L'utilisateur a soumis une image.
URL de la soumission : ${submission.cover_url}

Détermine si cette soumission est valide :
1. Est-ce clairement un travail de design ? (pas une photo random, pas un screenshot non pertinent, pas une image vide)
2. Le travail semble-t-il correspondre au brief ?

Réponds UNIQUEMENT en JSON valide, sans texte autour :
{"valid": true | false, "reason": "explication courte si rejeté"}`

  try {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'url', url: submission.cover_url },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    })

    const text = res.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim()

    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) {
      return { valid: false, reason: 'Validation IA indisponible' }
    }
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1))
    return {
      valid: !!parsed.valid,
      reason: parsed.reason || undefined,
    }
  } catch {
    // On AI failure, default to pending (treat as needing manual review)
    return { valid: false, reason: 'Validation automatique impossible — un admin va examiner.' }
  }
}

export function shouldAutoValidate(leagueName: string | null | undefined): boolean {
  if (!leagueName) return false
  return AUTO_VALIDATE_LEAGUES.includes(leagueName)
}

/**
 * Approve a submission: set status, attribute XP, update league.
 * Used by both AI auto-approval and admin approval.
 */
export async function approveSubmission(
  submissionId: string,
  validatedBy: string | null
): Promise<{ xpAwarded: number }> {
  const { data: sub } = await (supabaseAdmin as any)
    .from('submissions')
    .select('id, user_id, challenge_id, xp_attributed, validation_status, challenges(xp_reward)')
    .eq('id', submissionId)
    .single()

  if (!sub) return { xpAwarded: 0 }

  const xpReward = sub.challenges?.xp_reward ?? 150
  const wasAttributed = !!sub.xp_attributed

  await (supabaseAdmin as any)
    .from('submissions')
    .update({
      validation_status: 'approved',
      validated_at: new Date().toISOString(),
      validated_by: validatedBy,
      xp_attributed: true,
      rejection_reason: null,
    })
    .eq('id', submissionId)

  if (!wasAttributed) {
    const { data: prof } = await (supabaseAdmin as any)
      .from('profiles')
      .select('xp, referred_by')
      .eq('id', sub.user_id)
      .single()
    const newXP = (prof?.xp ?? 0) + xpReward
    await (supabaseAdmin as any).from('profiles').update({ xp: newXP }).eq('id', sub.user_id)
    const { checkAndUpdateLeague } = await import('@/lib/utils/leagues')
    await checkAndUpdateLeague(sub.user_id)

    // Reward referrer +50 XP on referred user's first approved submission
    if (prof?.referred_by) {
      const { data: pendingReferral } = await (supabaseAdmin as any)
        .from('referrals')
        .select('id')
        .eq('referrer_id', prof.referred_by)
        .eq('referred_id', sub.user_id)
        .eq('status', 'pending')
        .maybeSingle()

      if (pendingReferral?.id) {
        const REFERRAL_XP = 50
        const { data: referrer } = await (supabaseAdmin as any)
          .from('profiles')
          .select('xp')
          .eq('id', prof.referred_by)
          .single()
        const newReferrerXP = (referrer?.xp ?? 0) + REFERRAL_XP
        await (supabaseAdmin as any)
          .from('profiles')
          .update({ xp: newReferrerXP })
          .eq('id', prof.referred_by)
        await (supabaseAdmin as any)
          .from('referrals')
          .update({ status: 'completed', xp_awarded: REFERRAL_XP })
          .eq('id', pendingReferral.id)
        await checkAndUpdateLeague(prof.referred_by)
        await notify(prof.referred_by, 'referral_completed', {
          referred_id: sub.user_id,
          xp: REFERRAL_XP,
        })
      }
    }
  }

  await notify(sub.user_id, 'submission_approved', {
    submission_id: submissionId,
    challenge_id: sub.challenge_id,
    xp: xpReward,
  })

  return { xpAwarded: wasAttributed ? 0 : xpReward }
}

export async function rejectSubmission(
  submissionId: string,
  reason: string,
  validatedBy: string | null
): Promise<void> {
  const { data: sub } = await (supabaseAdmin as any)
    .from('submissions')
    .select('id, user_id, challenge_id, xp_attributed, challenges(xp_reward)')
    .eq('id', submissionId)
    .single()

  if (!sub) return

  // Revoke XP if previously attributed
  if (sub.xp_attributed) {
    const xpReward = sub.challenges?.xp_reward ?? 150
    const { data: prof } = await (supabaseAdmin as any)
      .from('profiles')
      .select('xp')
      .eq('id', sub.user_id)
      .single()
    const newXP = Math.max(0, (prof?.xp ?? 0) - xpReward)
    await (supabaseAdmin as any).from('profiles').update({ xp: newXP }).eq('id', sub.user_id)
  }

  await (supabaseAdmin as any)
    .from('submissions')
    .update({
      validation_status: 'rejected',
      rejection_reason: reason,
      validated_at: new Date().toISOString(),
      validated_by: validatedBy,
      xp_attributed: false,
    })
    .eq('id', submissionId)

  await notify(sub.user_id, 'submission_rejected', {
    submission_id: submissionId,
    challenge_id: sub.challenge_id,
    reason,
  })
}

/**
 * Trigger validation flow on a freshly published submission.
 * Decides AI auto-validation vs pending admin review based on league.
 */
export async function triggerValidationFlow(submissionId: string): Promise<void> {
  const { data: sub } = await (supabaseAdmin as any)
    .from('submissions')
    .select(`
      id, user_id, challenge_id, cover_url,
      challenges (
        id, brief, specialty, challenge_type, xp_reward,
        leagues ( name )
      )
    `)
    .eq('id', submissionId)
    .single()

  if (!sub) return

  const challenge = sub.challenges
  const leagueName = challenge?.leagues?.name ?? null

  if (shouldAutoValidate(leagueName)) {
    const result = await validateSubmissionWithAI(
      { id: sub.id, user_id: sub.user_id, cover_url: sub.cover_url, challenge_id: sub.challenge_id },
      { id: challenge.id, brief: challenge.brief, specialty: challenge.specialty, challenge_type: challenge.challenge_type, xp_reward: challenge.xp_reward, league_name: leagueName }
    )

    if (result.valid) {
      await approveSubmission(submissionId, null)
    } else {
      await rejectSubmission(submissionId, result.reason ?? 'Soumission rejetée par la validation automatique', null)
    }
  } else {
    // Higher leagues: pending admin review
    await (supabaseAdmin as any)
      .from('submissions')
      .update({ validation_status: 'pending' })
      .eq('id', submissionId)

    await notify(sub.user_id, 'submission_received', {
      submission_id: submissionId,
      challenge_id: sub.challenge_id,
    })
    await notifyAllAdmins('submission_pending_review', {
      submission_id: submissionId,
      challenge_id: sub.challenge_id,
      user_id: sub.user_id,
    })
  }
}
