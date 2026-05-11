import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { updateStreak } from '@/lib/utils/streaks'
import { notify } from '@/lib/utils/notifications'

interface Params { params: Promise<{ id: string }> }

const FREE_LIMIT = 5
const MIN_CONTENT = 10

export async function GET(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: submissionId } = await params

  const { data: comments } = await (supabaseAdmin as any)
    .from('comments')
    .select(`
      id, content, parent_id, likes_count, is_reported, created_at, edited_at,
      user:profiles(id, username, full_name, avatar_url, plan, league)
    `)
    .eq('submission_id', submissionId)
    .eq('is_reported', false)
    .order('created_at', { ascending: false })

  const commentIds = (comments ?? []).map((c: any) => c.id)
  let likedSet = new Set<string>()
  if (commentIds.length > 0) {
    const { data: likes } = await (supabaseAdmin as any)
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', user.id)
      .in('comment_id', commentIds)
    likedSet = new Set((likes ?? []).map((l: any) => l.comment_id))
  }
  const enriched = (comments ?? []).map((c: any) => ({ ...c, liked_by_me: likedSet.has(c.id) }))

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count: dailyCount } = await (supabaseAdmin as any)
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', today.toISOString())

  return NextResponse.json({ comments: enriched, dailyCount: dailyCount ?? 0 })
}

export async function POST(req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: submissionId } = await params
  const body = await req.json().catch(() => ({}))
  const content = (body.content as string | undefined)?.trim() ?? ''

  if (content.length < MIN_CONTENT) {
    return NextResponse.json({ error: `Min ${MIN_CONTENT} caractères` }, { status: 400 })
  }

  const { data: submission } = await (supabaseAdmin as any)
    .from('submissions')
    .select('id, user_id, validation_status')
    .eq('id', submissionId)
    .single()
  if (!submission) return NextResponse.json({ error: 'Soumission introuvable' }, { status: 404 })
  if (submission.validation_status !== 'approved') {
    return NextResponse.json({ error: 'Soumission non publiée' }, { status: 403 })
  }

  const { data: profile } = await (supabaseAdmin as any)
    .from('profiles').select('plan').eq('id', user.id).single()
  const isPro = profile?.plan === 'pro' || profile?.plan === 'studio'
  if (!isPro) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count } = await (supabaseAdmin as any)
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
    if ((count ?? 0) >= FREE_LIMIT) {
      return NextResponse.json({ error: `Limite atteinte (${FREE_LIMIT}/jour)` }, { status: 403 })
    }
  }

  const { data: comment, error } = await (supabaseAdmin as any)
    .from('comments')
    .insert({
      submission_id: submissionId,
      user_id: user.id,
      content,
    })
    .select(`
      id, content, parent_id, likes_count, is_reported, created_at, edited_at,
      user:profiles(id, username, full_name, avatar_url, plan, league)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try { await updateStreak(user.id, supabaseAdmin) } catch { /* ignore */ }

  const { data: sub } = await (supabaseAdmin as any)
    .from('submissions').select('comments_count').eq('id', submissionId).single()
  await (supabaseAdmin as any)
    .from('submissions')
    .update({ comments_count: (sub?.comments_count ?? 0) + 1 })
    .eq('id', submissionId)

  if (submission.user_id !== user.id) {
    const { data: ownerProf } = await (supabaseAdmin as any)
      .from('profiles').select('xp').eq('id', submission.user_id).single()
    const newXP = (ownerProf?.xp ?? 0) + 5
    await (supabaseAdmin as any).from('profiles').update({ xp: newXP }).eq('id', submission.user_id)

    try {
      await notify(submission.user_id, 'submission_commented', {
        submission_id: submissionId,
        comment_id: comment?.id,
        commenter_id: user.id,
      })
    } catch { /* ignore */ }
  }

  return NextResponse.json({ comment: { ...comment, liked_by_me: false } })
}
