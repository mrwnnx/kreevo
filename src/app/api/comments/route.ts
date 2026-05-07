import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notify } from '@/lib/utils/notifications'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { submissionId, content } = await request.json()
  if (!submissionId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing submissionId or content' }, { status: 400 })
  }

  const { data: comment, error } = await (supabase.from('comments') as any)
    .insert({ submission_id: submissionId, user_id: user.id, content: content.trim() })
    .select('*, profiles(username, avatar_url, plan)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Increment comments_count + award XP to submission owner
  const { data: sub } = await (supabase.from('submissions') as any)
    .select('comments_count, user_id').eq('id', submissionId).single()
  await (supabase.from('submissions') as any)
    .update({ comments_count: (sub?.comments_count ?? 0) + 1 }).eq('id', submissionId)

  if (sub?.user_id && sub.user_id !== user.id) {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/xp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
      body: JSON.stringify({ userId: sub.user_id, action: 'comment_received' }),
    })
    try {
      await notify(sub.user_id, 'submission_commented', {
        submission_id: submissionId,
        comment_id: comment?.id,
        commenter_id: user.id,
      })
    } catch { /* ignore */ }
  }

  return NextResponse.json({ comment })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const submissionId = searchParams.get('submissionId')
  if (!submissionId) return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await (supabase.from('comments') as any)
    .select('*, profiles(username, avatar_url, plan)')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data ?? [] })
}
