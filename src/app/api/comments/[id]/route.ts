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
    .select('id, user_id, submission_id, parent_id, claps_given')
    .eq('id', commentId)
    .single()
  if (!comment) return NextResponse.json({ error: 'Commentaire introuvable' }, { status: 404 })
  if (comment.user_id !== user.id) {
    return NextResponse.json({ error: 'Tu ne peux supprimer que tes propres commentaires' }, { status: 403 })
  }

  // Refund claps if it's a top-level review with claps_given > 0
  const clapsGiven = comment.claps_given ?? 0
  if (!comment.parent_id && clapsGiven > 0) {
    const { data: existingClap } = await (supabaseAdmin as any)
      .from('submission_claps')
      .select('id, claps_count')
      .eq('submission_id', comment.submission_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingClap) {
      const newUserClaps = Math.max(0, (existingClap.claps_count ?? 0) - clapsGiven)
      if (newUserClaps === 0) {
        await (supabaseAdmin as any).from('submission_claps').delete().eq('id', existingClap.id)
      } else {
        await (supabaseAdmin as any)
          .from('submission_claps')
          .update({ claps_count: newUserClaps, updated_at: new Date().toISOString() })
          .eq('id', existingClap.id)
      }
    }

    // Decrement total_claps on submission
    const { data: sub } = await (supabaseAdmin as any)
      .from('submissions').select('total_claps').eq('id', comment.submission_id).single()
    const newTotal = Math.max(0, (sub?.total_claps ?? 0) - clapsGiven)
    await (supabaseAdmin as any)
      .from('submissions')
      .update({ total_claps: newTotal })
      .eq('id', comment.submission_id)
  }

  // Decrement comments_count on submission (only for top-level)
  if (!comment.parent_id) {
    const { data: sub } = await (supabaseAdmin as any)
      .from('submissions').select('comments_count').eq('id', comment.submission_id).single()
    await (supabaseAdmin as any)
      .from('submissions')
      .update({ comments_count: Math.max(0, (sub?.comments_count ?? 0) - 1) })
      .eq('id', comment.submission_id)
  }

  // Delete comment (replies cascade via FK)
  const { error } = await (supabaseAdmin as any).from('comments').delete().eq('id', commentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
