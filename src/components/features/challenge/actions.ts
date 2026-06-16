'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { updateStreak } from '@/lib/utils/streaks'
import { revalidatePath } from 'next/cache'
import { specialtyMismatch, SPECIALTY_GUARD_MESSAGE } from '@/lib/challenges/specialty'
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
  // NOTE: any client-supplied AI verdict/analysis is deliberately IGNORED.
  // The validation decision is made server-side in triggerValidationFlow.

  // PHASE 4 — garde-fou cross-spé EN TÊTE, draft inclus (on ne brouillonne même pas
  // un challenge d'une autre spé). L'UI cachée est contournable → autorité serveur.
  // (Couvre le cas legacy switch-de-spé : un challenge de l'ancienne spé devient
  // non-soumissible, même avec une participation active antérieure — assumé.)
  {
    const { data: guardProfile } = await supabase
      .from('profiles').select('specialty_id').eq('id', user.id).single()
    const { data: guardChallenge } = await supabaseAdmin
      .from('challenges').select('specialty_id').eq('id', challengeId).single()
    const mismatch = specialtyMismatch(guardProfile?.specialty_id, guardChallenge?.specialty_id)
    if (mismatch) return { error: SPECIALTY_GUARD_MESSAGE[mismatch], code: mismatch }
  }

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

  // Server-authoritative validation. The submission is ALREADY published (insert
  // above) — publication is never blocked. This only sets validation_status + XP,
  // running the AI server-side (Stone/Bronze/Silver) or deferring to admin (Gold+).
  // Any client-supplied verdict is ignored → self-approval is impossible.
  let finalStatus: 'approved' | 'rejected' | 'pending' | 'human_review' = 'pending'
  let bonusXp = 0
  if (submissionId) {
    const { triggerValidationFlow } = await import('@/lib/utils/submissions')
    const outcome = await triggerValidationFlow(submissionId)
    finalStatus = outcome.status
    bonusXp = outcome.bonusXp
  }

  revalidatePath(`/dashboard/challenges/${challengeId}`)
  revalidatePath('/dashboard')

  return { success: true, draft: false, status: finalStatus, bonusXp }
}
