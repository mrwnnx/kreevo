'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
  const additionalImagesRaw = formData.get('additionalImages') as string | null
  const collaboratorsRaw = formData.get('collaborators') as string | null
  const aiVerdict = formData.get('aiVerdict') as 'approved' | 'rejected' | 'skipped' | null
  const aiReason = formData.get('aiReason') as string | null

  if (!coverUrl) return { error: 'Image de couverture requise' }

  let additionalImages: string[] = []
  try { additionalImages = additionalImagesRaw ? JSON.parse(additionalImagesRaw) : [] } catch {}
  let collaborators: string[] = []
  try { collaborators = collaboratorsRaw ? JSON.parse(collaboratorsRaw) : [] } catch {}

  // Verify participation is still active (only for non-draft submissions)
  if (participationId) {
    const { data: part } = await (supabase as any)
      .from('participations')
      .select('status, personal_deadline')
      .eq('id', participationId)
      .single()

    if (!part) return { error: 'Participation introuvable' }
    if (new Date(part.personal_deadline) < new Date()) {
      return { error: 'Ton délai personnel est dépassé' }
    }
  }

  const files: Record<string, unknown> = {}
  if (figmaUrl) files.figma = figmaUrl
  if (projectLink) files.link = projectLink
  if (additionalImages.length) files.images = additionalImages
  if (collaborators.length) files.collaborators = collaborators

  // Check existing submission
  const { data: existing } = await (supabase.from('submissions') as any)
    .select('id, attempt_number, is_draft')
    .eq('challenge_id', challengeId)
    .eq('user_id', user.id)
    .single() as { data: { id: string; attempt_number: number; is_draft: boolean } | null }

  // Attempt limit check (only count published attempts, not drafts)
  const { data: profile } = await (supabase as any)
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
    : { ...payload, validation_status: 'pending', xp_attributed: false, rejection_reason: null, validated_at: null, validated_by: null }

  const table = supabase.from('submissions') as any
  const { data: upsertResult, error } = existing
    ? await table.update(finalPayload).eq('id', existing.id).select('id').single()
    : await table.insert(finalPayload).select('id').single()

  if (error) return { error: error.message }

  const submissionId = upsertResult?.id ?? existing?.id

  // For drafts: skip status updates and XP awards
  if (isDraft) {
    revalidatePath(`/dashboard/challenges/${challengeId}`)
    return { success: true, draft: true }
  }

  // Update participation status to 'submitted'
  if (participationId) {
    await (supabase as any)
      .from('participations')
      .update({ status: 'submitted' })
      .eq('id', participationId)
  }

  // Apply AI verdict from client (decided during upload), or fall back to server-side flow
  if (submissionId) {
    if (aiVerdict === 'approved') {
      const { approveSubmission } = await import('@/lib/utils/submissions')
      await approveSubmission(submissionId, null)
    } else if (aiVerdict === 'rejected') {
      const { rejectSubmission } = await import('@/lib/utils/submissions')
      await rejectSubmission(
        submissionId,
        aiReason ?? 'Soumission rejetée par la validation automatique',
        null
      )
    } else {
      // skipped (Gold+) or no verdict → run server-side flow (pending admin review)
      const { triggerValidationFlow } = await import('@/lib/utils/submissions')
      await triggerValidationFlow(submissionId)
    }
  }

  revalidatePath(`/dashboard/challenges/${challengeId}`)
  revalidatePath('/dashboard')

  // Tell client which final status was applied so it can show the right UI
  let finalStatus: 'approved' | 'rejected' | 'pending' = 'pending'
  if (aiVerdict === 'approved') finalStatus = 'approved'
  else if (aiVerdict === 'rejected') finalStatus = 'rejected'

  return { success: true, draft: false, status: finalStatus }
}
