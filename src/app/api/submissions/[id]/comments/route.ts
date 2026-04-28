import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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
      id, content, title, parent_id, claps_given, is_reported, created_at,
      user:profiles(id, username, avatar_url, plan, league)
    `)
    .eq('submission_id', submissionId)
    .eq('is_reported', false)
    .order('created_at', { ascending: false })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count: dailyCount } = await (supabaseAdmin as any)
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', today.toISOString())

  return NextResponse.json({ comments: comments ?? [], dailyCount: dailyCount ?? 0 })
}

export async function POST(req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: submissionId } = await params
  const body = await req.json().catch(() => ({}))
  const content = (body.content as string | undefined)?.trim() ?? ''
  const title = (body.title as string | undefined)?.trim() ?? ''
  const requestedClaps = Math.max(0, Math.min(10, Number(body.claps ?? 0)))

  if (content.length < MIN_CONTENT) {
    return NextResponse.json({ error: `Min ${MIN_CONTENT} caractères` }, { status: 400 })
  }

  const { data: submission } = await (supabaseAdmin as any)
    .from('submissions')
    .select('id, user_id, validation_status, total_claps')
    .eq('id', submissionId)
    .single()
  if (!submission) return NextResponse.json({ error: 'Soumission introuvable' }, { status: 404 })
  if (submission.validation_status !== 'approved') {
    return NextResponse.json({ error: 'Soumission non publiée' }, { status: 403 })
  }
  if (submission.user_id === user.id) {
    return NextResponse.json({ error: 'Tu ne peux pas commenter ta propre soumission' }, { status: 403 })
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
      title: title || null,
      claps_given: 0, // updated below if claps applied
    })
    .select(`
      id, content, title, claps_given, is_reported, created_at,
      user:profiles(id, username, avatar_url, plan, league)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Increment submission comments_count + +5 XP to owner
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
  }

  // Apply claps from the review (1-10 in one shot)
  let appliedClaps = 0
  let newTotalClaps = submission.total_claps ?? 0
  if (requestedClaps > 0) {
    const { data: existingClap } = await (supabaseAdmin as any)
      .from('submission_claps')
      .select('id, claps_count')
      .eq('submission_id', submissionId)
      .eq('user_id', user.id)
      .maybeSingle()

    const currentUserClaps = existingClap?.claps_count ?? 0
    const allowedClaps = Math.min(requestedClaps, 10 - currentUserClaps)

    if (allowedClaps > 0) {
      const newUserClaps = currentUserClaps + allowedClaps
      newTotalClaps = (submission.total_claps ?? 0) + allowedClaps

      if (existingClap) {
        await (supabaseAdmin as any)
          .from('submission_claps')
          .update({ claps_count: newUserClaps, updated_at: new Date().toISOString() })
          .eq('id', existingClap.id)
      } else {
        await (supabaseAdmin as any)
          .from('submission_claps')
          .insert({ submission_id: submissionId, user_id: user.id, claps_count: newUserClaps })
      }

      await (supabaseAdmin as any)
        .from('submissions')
        .update({ total_claps: newTotalClaps })
        .eq('id', submissionId)

      // +2 XP per clap to owner
      const { data: ownerProf2 } = await (supabaseAdmin as any)
        .from('profiles').select('xp').eq('id', submission.user_id).single()
      await (supabaseAdmin as any)
        .from('profiles')
        .update({ xp: (ownerProf2?.xp ?? 0) + allowedClaps * 2 })
        .eq('id', submission.user_id)

      appliedClaps = allowedClaps

      // Track on comment for refund on delete
      await (supabaseAdmin as any)
        .from('comments')
        .update({ claps_given: allowedClaps })
        .eq('id', comment.id)
      ;(comment as any).claps_given = allowedClaps
    }
  }

  return NextResponse.json({ comment, appliedClaps, totalClaps: newTotalClaps })
}
