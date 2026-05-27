import { anthropic } from '@/lib/anthropic/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify, notifyAllAdmins } from './notifications'
import {
  HUMAN_REVIEW_THRESHOLD,
  MAX_PUBLISH_IMAGES,
  DESCRIPTION_BONUS_MULT,
} from './submission-constants'

const AUTO_VALIDATE_LEAGUES = ['Stone', 'Bronze', 'Silver']
const ANALYZE_MODEL = 'claude-sonnet-4-6'
const MAX_IMAGES = MAX_PUBLISH_IMAGES
export { DESCRIPTION_BONUS_MULT }

export interface ImageInput {
  url: string
  is_cover: boolean
}

export interface ImageVerdict {
  index: number
  is_cover: boolean
  valid: boolean
  reason: string | null
}

export interface AnalyzeForPublishResult {
  global_valid: boolean
  rejected_count: number
  images: ImageVerdict[]
  description_bonus_eligible: boolean
  description_bonus_reason: string | null
  model: string
  duration_ms: number
  error?: string
}

export interface ChallengeForAnalysis {
  id: string
  brief: string | null
  context?: string | null
  deliverable?: string | null
  constraints?: string | null
  criteria?: string | null
  specialty: string | null
  challenge_type: string | null
  industry?: string | null
}

function buildAnalysisPrompt(c: ChallengeForAnalysis, n: number, hasDescription: boolean): string {
  return `Tu es un expert en design qui valide STRICTEMENT des soumissions à un challenge créatif. Ton rôle est de protéger la qualité de la plateforme : rejeter tout ce qui n'a pas un rapport clair avec le brief.

Challenge :
- Brief : ${c.brief ?? '—'}
- Contraintes : ${c.constraints || 'Aucune contrainte spécifique'}
- Livrables attendus : ${c.deliverable || 'Non spécifié'}
- Critères d'évaluation : ${c.criteria || 'Non spécifié'}
- Spécialité : ${c.specialty ?? '—'}
- Type de défi : ${c.challenge_type ?? '—'}

Ta tâche :
1. Analyse chacune des ${n} images (image n°1 = cover, suivantes = additionnelles).
   REJETER (valid=false) si N'IMPORTE LEQUEL de ces critères s'applique :
   - L'image n'est pas un travail de design (photo random, screenshot non pertinent, capture d'écran d'app inconnue, image vide, image de test, photo personnelle, meme, illustration générique, etc.)
   - L'image n'a aucun lien identifiable avec le brief (sujet hors-thème)
   - L'image ne correspond pas à la spécialité (ex: graphic design soumis à un challenge UX screen)
   - L'image ne correspond pas aux livrables attendus (ex: photo de produit là où on attend un mockup d'écran)
   - L'image n'est PAS clairement créée pour ce challenge précis (donc une image générique ou recyclée d'un autre projet doit être rejetée si on ne voit pas le lien avec le brief)

   ACCEPTER (valid=true) UNIQUEMENT si :
   - C'est clairement un design original conçu pour ce brief
   - Le sujet, la palette, la composition, le format évoquent visiblement le brief
   - Le travail correspond à la spécialité demandée

   En cas de doute SÉRIEUX (image de design crédible mais lien au brief ambigu) → valid=false avec une raison qui demande à l'user de clarifier ou de soumettre une image plus alignée. Ne pas tomber dans le piège du "bénéfice du doute" — préfère un rejet justifié à un faux positif.

2. ${hasDescription
   ? 'Évalue la description fournie par l\'user. Est-elle pertinente, factuelle, et MATCH-T-ELLE les images visibles ? Une description vide, vague ("c\'est un design", "voilà"), ou hors sujet n\'est PAS éligible. Une description qui décrit concrètement le travail visible et explique des choix design EST éligible.'
   : 'Pas de description fournie : description_bonus_eligible doit être false.'}

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans texte avant ou après :
{
  "images": [
    { "index": 0, "is_cover": true, "valid": true, "reason": null },
    { "index": 1, "is_cover": false, "valid": false, "reason": "Hors brief : photo de paysage sans lien avec le challenge UX dashboard fitness." }
  ],
  "description_bonus_eligible": true,
  "description_bonus_reason": "Description claire qui décrit le travail visible"
}

Les "reason" doivent être : courtes (max 25 mots), en français, factuelles, actionnables. null si valide. JAMAIS de raison vide pour une image rejetée.`
}

/**
 * Analyze submission images + title + description for publish.
 * Single multimodal Anthropic call. Max 4 images. Returns full verdict + description bonus eligibility.
 */
export async function analyzeSubmissionForPublish(
  challenge: ChallengeForAnalysis,
  images: ImageInput[],
  title: string,
  description: string,
): Promise<AnalyzeForPublishResult> {
  const start = Date.now()
  const sliced = images.slice(0, MAX_IMAGES)
  const n = sliced.length
  const hasDescription = description.trim().length > 0

  if (n === 0) {
    return {
      global_valid: false,
      rejected_count: 0,
      images: [],
      description_bonus_eligible: false,
      description_bonus_reason: null,
      model: ANALYZE_MODEL,
      duration_ms: 0,
      error: 'No images provided',
    }
  }

  const content: Array<{ type: 'image'; source: { type: 'url'; url: string } } | { type: 'text'; text: string }> = []
  for (const img of sliced) {
    content.push({ type: 'image', source: { type: 'url', url: img.url } })
  }
  const textPayload = `${buildAnalysisPrompt(challenge, n, hasDescription)}

Titre fourni par l'user : ${title.trim() || '(vide)'}
Description fournie par l'user : ${hasDescription ? description.trim() : '(vide)'}`
  content.push({ type: 'text', text: textPayload })

  try {
    const res = await anthropic.messages.create({
      model: ANALYZE_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: content as any }],
    })

    const text = res.content.map((b: any) => (b.type === 'text' ? b.text : '')).join('').trim()
    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) throw new Error('AI did not return JSON')

    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
      images: Array<{ index: number; is_cover: boolean; valid: boolean; reason: string | null }>
      description_bonus_eligible: boolean
      description_bonus_reason: string | null
    }
    const arr = Array.isArray(parsed.images) ? parsed.images : []

    const verdicts: ImageVerdict[] = sliced.map((img, i) => {
      const m = arr.find((r) => r.index === i)
      // If AI didn't return a verdict for this image, treat as rejected (don't silently pass).
      return {
        index: i,
        is_cover: img.is_cover,
        valid: m ? !!m.valid : false,
        reason: m?.reason ?? (m && !m.valid ? 'Image hors brief.' : (m ? null : 'Analyse IA incomplète, réessaye.')),
      }
    })
    const rejectedCount = verdicts.filter((v) => !v.valid).length

    return {
      global_valid: rejectedCount === 0,
      rejected_count: rejectedCount,
      images: verdicts,
      description_bonus_eligible: hasDescription && !!parsed.description_bonus_eligible,
      description_bonus_reason: parsed.description_bonus_reason ?? null,
      model: ANALYZE_MODEL,
      duration_ms: Date.now() - start,
    }
  } catch (err) {
    // On AI failure, default to all-valid + no bonus (don't block the user, don't reward unfairly)
    return {
      global_valid: true,
      rejected_count: 0,
      images: sliced.map((img, i) => ({ index: i, is_cover: img.is_cover, valid: true, reason: null })),
      description_bonus_eligible: false,
      description_bonus_reason: null,
      model: ANALYZE_MODEL,
      duration_ms: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

// HUMAN_REVIEW_THRESHOLD + MAX_PUBLISH_IMAGES are re-exported from ./submission-constants
// for callers that import them via submissions.ts. New consumers should import directly
// from ./submission-constants to avoid pulling the Anthropic SDK into client bundles.
export { HUMAN_REVIEW_THRESHOLD, MAX_PUBLISH_IMAGES }

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
  validatedBy: string | null,
  options: { applyDescriptionBonus?: boolean } = {},
): Promise<{ xpAwarded: number; bonusApplied: boolean; bonusXp: number }> {
  const { data: sub } = await supabaseAdmin
    .from('submissions')
    .select('id, user_id, challenge_id, xp_attributed, validation_status, challenges(xp_reward)')
    .eq('id', submissionId)
    .single()

  if (!sub || !sub.user_id || !sub.challenge_id) {
    return { xpAwarded: 0, bonusApplied: false, bonusXp: 0 }
  }

  const baseXp = sub.challenges?.xp_reward ?? 150
  const bonusApplied = !!options.applyDescriptionBonus
  const bonusXp = bonusApplied ? Math.round(baseXp * DESCRIPTION_BONUS_MULT) : 0
  const xpReward = baseXp + bonusXp
  const wasAttributed = !!sub.xp_attributed

  // Anti-farm: a user can earn the XP of a given challenge only ONCE, even across
  // reparticipations / multiple submission rows. If any *other* submission for
  // this (user, challenge) already holds the xp_attributed=true flag, we
  // approve this one visually but don't credit profile XP again. We also
  // leave its xp_attributed=false so a later rejectSubmission on this row
  // doesn't refund XP it never granted.
  let otherHoldsXp = false
  if (!wasAttributed) {
    const { data: priorCredit } = await supabaseAdmin
      .from('submissions')
      .select('id')
      .eq('user_id', sub.user_id)
      .eq('challenge_id', sub.challenge_id)
      .eq('xp_attributed', true)
      .neq('id', submissionId)
      .limit(1)
      .maybeSingle()
    otherHoldsXp = !!priorCredit
  }

  const shouldCredit = !wasAttributed && !otherHoldsXp

  await supabaseAdmin
    .from('submissions')
    .update({
      validation_status: 'approved',
      validated_at: new Date().toISOString(),
      validated_by: validatedBy,
      xp_attributed: shouldCredit || wasAttributed,
      rejection_reason: null,
      description_bonus_applied: bonusApplied,
    })
    .eq('id', submissionId)

  if (shouldCredit) {
    const { data: prof } = await supabaseAdmin
      .from('profiles')
      .select('xp, referred_by')
      .eq('id', sub.user_id)
      .single()
    const newXP = (prof?.xp ?? 0) + xpReward
    await supabaseAdmin.from('profiles').update({ xp: newXP }).eq('id', sub.user_id)
    const { checkAndUpdateLeague } = await import('@/lib/utils/leagues')
    await checkAndUpdateLeague(sub.user_id)

    // Reward referrer +50 XP on referred user's first approved submission
    if (prof?.referred_by) {
      const { data: pendingReferral } = await supabaseAdmin
        .from('referrals')
        .select('id')
        .eq('referrer_id', prof.referred_by)
        .eq('referred_id', sub.user_id)
        .eq('status', 'pending')
        .maybeSingle()

      if (pendingReferral?.id) {
        const REFERRAL_XP = 50
        const { data: referrer } = await supabaseAdmin
          .from('profiles')
          .select('xp')
          .eq('id', prof.referred_by)
          .single()
        const newReferrerXP = (referrer?.xp ?? 0) + REFERRAL_XP
        await supabaseAdmin
          .from('profiles')
          .update({ xp: newReferrerXP })
          .eq('id', prof.referred_by)
        await supabaseAdmin
          .from('referrals')
          .update({ status: 'completed', xp_awarded: true })
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
    xp: shouldCredit ? xpReward : 0,
  })

  return { xpAwarded: shouldCredit ? xpReward : 0, bonusApplied: shouldCredit && bonusApplied, bonusXp: shouldCredit ? bonusXp : 0 }
}

export async function rejectSubmission(
  submissionId: string,
  reason: string,
  validatedBy: string | null
): Promise<void> {
  const { data: sub } = await supabaseAdmin
    .from('submissions')
    .select('id, user_id, challenge_id, xp_attributed, challenges(xp_reward)')
    .eq('id', submissionId)
    .single()

  if (!sub || !sub.user_id || !sub.challenge_id) return

  // Revoke XP if previously attributed
  if (sub.xp_attributed) {
    const xpReward = sub.challenges?.xp_reward ?? 150
    const { data: prof } = await supabaseAdmin
      .from('profiles')
      .select('xp')
      .eq('id', sub.user_id)
      .single()
    const newXP = Math.max(0, (prof?.xp ?? 0) - xpReward)
    await supabaseAdmin.from('profiles').update({ xp: newXP }).eq('id', sub.user_id)
  }

  await supabaseAdmin
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
  const { data: sub } = await supabaseAdmin
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

  if (!sub || !sub.user_id || !sub.challenge_id || !sub.cover_url) return

  const challenge = sub.challenges
  const leagueName = challenge?.leagues?.name ?? null

  if (challenge && shouldAutoValidate(leagueName)) {
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
    await supabaseAdmin
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
