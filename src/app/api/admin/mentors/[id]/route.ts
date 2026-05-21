import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin, MENTOR_FIELDS } from '../route'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireAdmin()
  if (a.error) return a.error
  const { id } = await params
  const body = await request.json()
  const update: Record<string, unknown> = {}
  for (const f of MENTOR_FIELDS) if (f in body) update[f] = body[f]
  update.updated_at = new Date().toISOString()
  const { data, error } = await (supabaseAdmin as any).from('ai_mentors').update(update).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ mentor: data })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireAdmin()
  if (a.error) return a.error
  const { id } = await params
  const { error } = await (supabaseAdmin as any).from('ai_mentors').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
