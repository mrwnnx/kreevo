import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: commentId } = await params

  // Check existing like
  const { data: existing } = await (supabaseAdmin as any)
    .from('comment_likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .maybeSingle()

  // Read current count
  const { data: comment } = await (supabaseAdmin as any)
    .from('comments')
    .select('likes_count')
    .eq('id', commentId)
    .single()
  if (!comment) return NextResponse.json({ error: 'Commentaire introuvable' }, { status: 404 })

  const current = comment.likes_count ?? 0

  if (existing) {
    await (supabaseAdmin as any).from('comment_likes').delete().eq('id', existing.id)
    await (supabaseAdmin as any)
      .from('comments')
      .update({ likes_count: Math.max(0, current - 1) })
      .eq('id', commentId)
    return NextResponse.json({ liked: false, likes_count: Math.max(0, current - 1) })
  }

  const { error } = await (supabaseAdmin as any)
    .from('comment_likes')
    .insert({ comment_id: commentId, user_id: user.id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await (supabaseAdmin as any)
    .from('comments')
    .update({ likes_count: current + 1 })
    .eq('id', commentId)

  return NextResponse.json({ liked: true, likes_count: current + 1 })
}
