'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitChallenge(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const challengeId = formData.get('challengeId') as string
  const coverUrl = formData.get('coverUrl') as string
  const description = formData.get('description') as string | null
  const figmaUrl = formData.get('figmaUrl') as string | null
  const participationId = formData.get('participationId') as string | null

  if (!coverUrl) return { error: 'Image de couverture requise' }

  // Verify participation is still active
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

  const files: Record<string, string> = {}
  if (figmaUrl) files.figma = figmaUrl

  // Check existing submission
  const { data: existing } = await (supabase.from('submissions') as any)
    .select('id, attempt_number')
    .eq('challenge_id', challengeId)
    .eq('user_id', user.id)
    .single() as { data: { id: string; attempt_number: number } | null }

  // Attempt limit check
  const { data: profile } = await (supabase as any)
    .from('profiles').select('plan').eq('id', user.id).single()
  const maxAttempts = profile?.plan === 'pro' ? 3 : 2
  const nextAttempt = (existing?.attempt_number ?? 0) + 1

  if (existing && nextAttempt > maxAttempts) {
    return { error: `Tu as atteint la limite de ${maxAttempts} soumissions` }
  }

  const payload = {
    challenge_id: challengeId,
    user_id: user.id,
    cover_url: coverUrl,
    description: description || null,
    files: Object.keys(files).length ? files : null,
    participation_id: participationId || null,
    attempt_number: nextAttempt,
  }

  const table = supabase.from('submissions') as any
  const { error } = existing
    ? await table.update({ ...payload, attempt_number: nextAttempt }).eq('id', existing.id)
    : await table.insert(payload)

  if (error) return { error: error.message }

  // Update participation status to 'submitted'
  if (participationId) {
    await (supabase as any)
      .from('participations')
      .update({ status: 'submitted' })
      .eq('id', participationId)
  }

  // Award XP on first submission
  if (!existing) {
    const { data: prof } = await (supabase as any)
      .from('profiles').select('xp').eq('id', user.id).single()
    const newXP = (prof?.xp ?? 0) + 150
    await (supabase as any).from('profiles').update({ xp: newXP }).eq('id', user.id)
    const { checkAndUpdateLeague } = await import('@/lib/utils/leagues')
    await checkAndUpdateLeague(user.id)
  }

  revalidatePath(`/dashboard/challenges/${challengeId}`)
  revalidatePath('/dashboard')
}
