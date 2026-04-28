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
    .select('id, user_id')
    .eq('id', commentId)
    .single()
  if (!comment) return NextResponse.json({ error: 'Commentaire introuvable' }, { status: 404 })
  if (comment.user_id === user.id) {
    return NextResponse.json({ error: 'Tu ne peux pas signaler ton propre commentaire' }, { status: 403 })
  }

  const { error } = await (supabaseAdmin as any)
    .from('comments')
    .update({ is_reported: true })
    .eq('id', commentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
