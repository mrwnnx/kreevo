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

  const table = supabase.from('submissions') as any
  const { error } = existing
    ? await table.update(payload).eq('id', existing.id)
    : await table.insert(payload)

  if (error) return { error: error.message }

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

  // Award XP only on the first published submission (not on drafts, not on resubmits)
  const isFirstPublish = !existing || wasDraft
  if (isFirstPublish) {
    const { data: prof } = await (supabase as any)
      .from('profiles').select('xp').eq('id', user.id).single()
    const newXP = (prof?.xp ?? 0) + 150
    await (supabase as any).from('profiles').update({ xp: newXP }).eq('id', user.id)
    const { checkAndUpdateLeague } = await import('@/lib/utils/leagues')
    await checkAndUpdateLeague(user.id)
  }

  revalidatePath(`/dashboard/challenges/${challengeId}`)
  revalidatePath('/dashboard')
  return { success: true, draft: false }
}
