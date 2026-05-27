'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { updateStreak } from '@/lib/utils/streaks'
import { revalidatePath } from 'next/cache'
import type { Json } from '@/types/database.types'

export async function submitChallenge(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const challengeId = formData.get('challengeId') as string
  const coverUrl = formData.get('coverUrl') as string
  const description = (formData.get('description') as string | null) ?? null
  const title = (formData.get('title') as string | null) ?? null
  const projectLink = (formData.get('projectLink') as string | null) ?? null
  const figmaUrl = (formData.get('figmaUrl') as string | null) ?? null
  const participationId = formData.get('participationId') as string | null
  const isDraft = formData.get('isDraft') === 'true'
  const isVisible = formData.get('isVisible') !== 'false'
  const photosRaw = formData.get('photos') as string | null
  const aiVerdict = formData.get('aiVerdict') as 'approved' | 'rejected' | 'skipped' | 'human_review' | null
  const rejectionReason = (formData.get('rejectionReason') as string | null) ?? null
  const aiAnalysisRaw = formData.get('aiAnalysis') as string | null
  const aiBypassed = formData.get('aiAnalysisBypassed') === 'true'
  const descriptionBonusEligible = formData.get('descriptionBonusEligible') === 'true'
  let aiAnalysis: Json | null = null
  try { aiAnalysis = aiAnalysisRaw ? (JSON.parse(aiAnalysisRaw) as Json) : null } catch {}

  if (!coverUrl) return { error: 'Image de couverture requise' }

  // Photos: array of { url, caption } (caption optional). Normalize + drop empties.
  let photos: { url: string; caption: string }[] = []
  try {
    const parsed = photosRaw ? JSON.parse(photosRaw) : []
    if (Array.isArray(parsed)) {
      photos = parsed
        .map((p: any) =>
          typeof p === 'string'
            ? { url: p, caption: '' }
            : { url: String(p?.url ?? ''), caption: String(p?.caption ?? '') },
        )
        .filter((p) => p.url)
        .slice(0, 7)
    }
  } catch {}

  // Verify participation is still active (only for non-draft submissions)
  if (participationId) {
    const { data: part } = await supabase
      .from('participations')
      .select('status, personal_deadline')
      .eq('id', participationId)
      .single()

    if (!part) return { error: 'Participation introuvable' }
    if (new Date(part.personal_deadline) < new Date()) {
      return { error: 'Ton délai personnel est dépassé' }
    }
  }

  const files: Record<string, Json> = {}
  if (figmaUrl) files.figma = figmaUrl
  if (projectLink) files.link = projectLink
  if (photos.length) files.images = photos

  // Check existing submission
  const { data: existing } = await supabase
    .from('submissions')
    .select('id, attempt_number, is_draft')
    .eq('challenge_id', challengeId)
    .eq('user_id', user.id)
    .maybeSingle()

  // Attempt limit check (only count published attempts, not drafts)
  const { data: profile } = await supabase
    .from('profiles').select('plan').eq('id', user.id).single()
  const maxAttempts = profile?.plan === 'pro' ? 3 : 2
  const wasDraft = existing?.is_draft ?? true
  const nextAttempt = isDraft
    ? (existing?.attempt_number ?? 0)
    : wasDraft
      ? Math.max(1, existing?.attempt_number ?? 1)
      : (existing?.attempt_number ?? 0) + 1

  if (!isDraft && existing && !wasDraft && nextAttempt > maxAttempts) {
    return { error: `Tu as atteint la limite de ${maxAttempts} soumissions` }
  }

  const payload = {
    challenge_id: challengeId,
    user_id: user.id,
    cover_url: coverUrl,
    title: title || null,
    description: description || null,
    files: Object.keys(files).length ? files : null,
    participation_id: participationId || null,
    attempt_number: nextAttempt,
    is_draft: isDraft,
    is_visible: isVisible,
  }

  // Reset validation_status to pending on every publish (not on drafts)
  const finalPayload = isDraft
    ? payload
    : {
        ...payload,
        validation_status: 'pending',
        xp_attributed: false,
        rejection_reason: null,
        validated_at: null,
        validated_by: null,
        ...(aiAnalysis ? { ai_analysis: aiAnalysis } : {}),
        ai_analysis_bypassed: aiBypassed,
      }

  const submissions = supabase.from('submissions')
  const { data: upsertResult, error } = existing
    ? await submissions.update(finalPayload).eq('id', existing.id).select('id').single()
    : await submissions.insert(finalPayload).select('id').single()

  if (error) return { error: error.message }

  const submissionId = upsertResult?.id ?? existing?.id

  // For drafts: skip status updates and XP awards
  if (isDraft) {
    revalidatePath(`/dashboard/challenges/${challengeId}`)
    return { success: true, draft: true }
  }

  // Update participation status to 'submitted'
  if (participationId) {
    await supabase
      .from('participations')
      .update({ status: 'submitted' })
      .eq('id', participationId)
  }

  try { await updateStreak(user.id, supabaseAdmin) } catch { /* ignore */ }

  // Apply AI verdict from client (decided sync at publish click), or fall back to server-side flow
  let bonusXp = 0
  if (submissionId) {
    if (aiVerdict === 'approved') {
      // Cases A (no rejection + maybe bonus) and B (1 rejected + bypassed → no bonus)
      const { approveSubmission } = await import('@/lib/utils/submissions')
      const applyBonus = !aiBypassed && descriptionBonusEligible
      const result = await approveSubmission(submissionId, null, { applyDescriptionBonus: applyBonus })
      bonusXp = result.bonusXp ?? 0
    } else if (aiVerdict === 'rejected') {
      // AI says the work doesn't match the brief → published but no XP. User can resubmit.
      const { rejectSubmission } = await import('@/lib/utils/submissions')
      await rejectSubmission(
        submissionId,
        rejectionReason || 'Ce travail ne semble pas correspondre au brief.',
        null,
      )
      // Bump the AI rejection counter. Only AI rejections count — admin rejections
      // and community reports don't unlock the "request human review" path.
      const { data: cur } = await supabaseAdmin
        .from('submissions')
        .select('ai_rejection_count')
        .eq('id', submissionId)
        .single()
      const nextCount = ((cur?.ai_rejection_count as number | null) ?? 0) + 1
      await supabaseAdmin
        .from('submissions')
        .update({ ai_rejection_count: nextCount })
        .eq('id', submissionId)
    } else if (aiVerdict === 'human_review') {
      // Case D: 3+ rejections accumulated → user requested human review
      await supabaseAdmin
        .from('submissions')
        .update({ validation_status: 'pending_human_review' })
        .eq('id', submissionId)
      const { notify, notifyAllAdmins } = await import('@/lib/utils/notifications')
      await notify(user.id, 'submission_human_review_pending', {
        submission_id: submissionId,
        challenge_id: challengeId,
      })
      await notifyAllAdmins('submission_human_review_requested', {
        submission_id: submissionId,
        challenge_id: challengeId,
        user_id: user.id,
      })
    } else {
      // skipped (Gold+) or no verdict → run server-side flow (pending admin review)
      const { triggerValidationFlow } = await import('@/lib/utils/submissions')
      await triggerValidationFlow(submissionId)
    }
  }

  revalidatePath(`/dashboard/challenges/${challengeId}`)
  revalidatePath('/dashboard')

  // Tell client which final status was applied so it can show the right UI
  let finalStatus: 'approved' | 'pending' | 'human_review' = 'pending'
  if (aiVerdict === 'approved') finalStatus = 'approved'
  else if (aiVerdict === 'human_review') finalStatus = 'human_review'

  return { success: true, draft: false, status: finalStatus, bonusXp }
}
