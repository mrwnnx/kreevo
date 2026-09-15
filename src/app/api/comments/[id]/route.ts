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

  const { error } = await (supabaseAdmin as any).from('comments').delete().eq('id', commentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Décrément APRÈS la suppression, et en une seule instruction SQL : avant, le
  // compteur baissait d'abord, si bien qu'une suppression en échec laissait un
  // commentaire visible décompté — et deux suppressions simultanées lisaient la
  // même valeur pour écrire le même résultat (cf. migration 023).
  if (!comment.parent_id) {
    await (supabaseAdmin as any).rpc('bump_comments_count', {
      p_submission_id: comment.submission_id,
      p_delta: -1,
    })
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: commentId } = await params
  const body = await req.json().catch(() => ({}))
  const content = typeof body?.content === 'string' ? body.content.trim() : ''
  if (content.length < 10) {
    return NextResponse.json({ error: 'Content too short' }, { status: 400 })
  }

  const { data: comment } = await (supabaseAdmin as any)
    .from('comments')
    .select('id, user_id')
    .eq('id', commentId)
    .single()
  if (!comment) return NextResponse.json({ error: 'Commentaire introuvable' }, { status: 404 })
  if (comment.user_id !== user.id) {
    return NextResponse.json({ error: 'Tu ne peux modifier que tes propres commentaires' }, { status: 403 })
  }

  const editedAt = new Date().toISOString()
  const { error } = await (supabaseAdmin as any)
    .from('comments')
    .update({ content, edited_at: editedAt })
    .eq('id', commentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, content, editedAt })
}
