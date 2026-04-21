import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { submissionId } = await request.json()
  if (!submissionId) return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 })

  // Check existing like
  const { data: existing } = await (supabase.from('likes') as any)
    .select('id')
    .eq('submission_id', submissionId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // Unlike
    await (supabase.from('likes') as any).delete().eq('id', existing.id)
    // Manual decrement
    const { data: sub } = await (supabase.from('submissions') as any)
      .select('likes_count').eq('id', submissionId).single()
    const newCount = Math.max(0, (sub?.likes_count ?? 1) - 1)
    await (supabase.from('submissions') as any)
      .update({ likes_count: newCount }).eq('id', submissionId)

    return NextResponse.json({ liked: false, likes_count: newCount })
  } else {
    // Like
    await (supabase.from('likes') as any).insert({ submission_id: submissionId, user_id: user.id })
    const { data: sub } = await (supabase.from('submissions') as any)
      .select('likes_count, user_id').eq('id', submissionId).single()
    const newCount = (sub?.likes_count ?? 0) + 1
    await (supabase.from('submissions') as any)
      .update({ likes_count: newCount }).eq('id', submissionId)

    // Award XP to submission owner
    if (sub?.user_id && sub.user_id !== user.id) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/xp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
        body: JSON.stringify({ userId: sub.user_id, action: 'like_received' }),
      })
    }

    return NextResponse.json({ liked: true, likes_count: newCount })
  }
}
