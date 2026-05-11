import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: commentId } = await params

  const { data: comment } = await (supabaseAdmin as any)
    .from('comments')
    .select('id, user_id, likes_count')
    .eq('id', commentId)
    .single()
  if (!comment) return NextResponse.json({ error: 'Commentaire introuvable' }, { status: 404 })

  const { data: existing } = await (supabaseAdmin as any)
    .from('comment_likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .maybeSingle()

  let liked: boolean
  let newCount: number

  if (existing) {
    await (supabaseAdmin as any).from('comment_likes').delete().eq('id', existing.id)
    newCount = Math.max(0, (comment.likes_count ?? 0) - 1)
    liked = false
  } else {
    await (supabaseAdmin as any)
      .from('comment_likes')
      .insert({ comment_id: commentId, user_id: user.id })
    newCount = (comment.likes_count ?? 0) + 1
    liked = true
  }

  await (supabaseAdmin as any)
    .from('comments')
    .update({ likes_count: newCount })
    .eq('id', commentId)

  return NextResponse.json({ liked, likesCount: newCount })
}
