import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/utils/notifications'

interface Params { params: Promise<{ id: string }> }

type LikeRow = { id: string; likes_count: number | null }

/**
 * Toggle like on a submission.
 *
 * XP rules (2026-05-26):
 *  - +2 XP to the owner ONCE per (liker, submission), credited the very
 *    first time the liker likes this submission.
 *  - Unliking does NOT debit XP, re-liking does NOT re-credit. The row in
 *    `submission_likes` persists across toggles (likes_count 0/1) so the
 *    historical credit is preserved and farming via toggle is blocked.
 *  - Auto-like (owner liking their own work) is allowed cosmetically but
 *    never credits XP nor emits a notification.
 */
export async function POST(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id: submissionId } = await params

  const { data: submission } = await (supabaseAdmin as any)
    .from('submissions')
    .select('user_id, total_likes')
    .eq('id', submissionId)
    .single()
  if (!submission) return NextResponse.json({ error: 'Soumission introuvable' }, { status: 404 })

  const isAutoLike = submission.user_id === user.id

  const { data: existingRow } = await (supabaseAdmin as any)
    .from('submission_likes')
    .select('id, likes_count')
    .eq('submission_id', submissionId)
    .eq('user_id', user.id)
    .maybeSingle()

  const existing = existingRow as LikeRow | null

  let liked: boolean
  let totalDelta: number
  let creditXp = false

  if (!existing) {
    // First-ever interaction with this submission by this liker.
    await (supabaseAdmin as any)
      .from('submission_likes')
      .insert({ submission_id: submissionId, user_id: user.id, likes_count: 1 })
    liked = true
    totalDelta = 1
    // Credit XP only on this first INSERT and only when not auto-liking.
    creditXp = !isAutoLike
  } else {
    const wasActive = (existing.likes_count ?? 0) > 0
    const nextActive = !wasActive
    await (supabaseAdmin as any)
      .from('submission_likes')
      .update({ likes_count: nextActive ? 1 : 0 })
      .eq('id', existing.id)
    liked = nextActive
    totalDelta = nextActive ? 1 : -1
    // No XP delta on subsequent toggles — historical credit already happened
    // (or didn't, in the auto-like case) at the first INSERT above.
  }

  // Maintain the denormalized counter on the submission.
  const newTotal = Math.max(0, (submission.total_likes ?? 0) + totalDelta)
  await (supabaseAdmin as any)
    .from('submissions')
    .update({ total_likes: newTotal })
    .eq('id', submissionId)

  if (creditXp) {
    const { data: ownerProf } = await (supabaseAdmin as any)
      .from('profiles').select('xp').eq('id', submission.user_id).single()
    const newXP = Math.max(0, (ownerProf?.xp ?? 0) + 2)
    await (supabaseAdmin as any).from('profiles').update({ xp: newXP }).eq('id', submission.user_id)

    try {
      await notify(submission.user_id, 'submission_liked', {
        submission_id: submissionId,
        liker_id: user.id,
      })
    } catch { /* ignore — notif is best-effort */ }
  }

  return NextResponse.json({ liked, totalLikes: newTotal })
}
