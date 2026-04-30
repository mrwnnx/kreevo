import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface Params { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: commentId } = await params

  const { data: comment } = await (supabaseAdmin as any)
    .from('comments')
    .select('id, user_id, submission_id, parent_id')
    .eq('id', commentId)
    .single()
  if (!comment) return NextResponse.json({ error: 'Commentaire introuvable' }, { status: 404 })
  if (comment.user_id !== user.id) {
    return NextResponse.json({ error: 'Tu ne peux supprimer que tes propres commentaires' }, { status: 403 })
  }

  if (!comment.parent_id) {
    const { data: sub } = await (supabaseAdmin as any)
      .from('submissions').select('comments_count').eq('id', comment.submission_id).single()
    await (supabaseAdmin as any)
      .from('submissions')
      .update({ comments_count: Math.max(0, (sub?.comments_count ?? 0) - 1) })
      .eq('id', comment.submission_id)
  }

  const { error } = await (supabaseAdmin as any).from('comments').delete().eq('id', commentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
