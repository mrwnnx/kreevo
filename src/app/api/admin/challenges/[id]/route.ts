import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { buildI18nColumns } from '@/lib/challenges/columns'

interface Props { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()

  const { data, error: dbErr } = await (admin!.supabase as any)
    .from('challenges')
    .update({
      // Full multilingual save from the admin form (18 cols + legacy mirror + status).
      // Absent on partial PATCH (e.g. quick publish toggle) → legacy fields untouched.
      ...(body.texts !== undefined ? buildI18nColumns(body) : {}),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.brief !== undefined && { brief: body.brief }),
      ...(body.context !== undefined && { context: body.context }),
      ...(body.deliverable !== undefined && { deliverable: body.deliverable }),
      ...(body.constraints !== undefined && { constraints: body.constraints }),
      ...(body.criteria !== undefined && { criteria: body.criteria }),
      ...(body.league_id !== undefined && { league_id: body.league_id }),
      ...(body.xp_reward !== undefined && { xp_reward: body.xp_reward }),
      ...(body.deadline_days !== undefined && { deadline_days: body.deadline_days }),
      ...(body.is_published !== undefined && { is_published: body.is_published }),
      ...(body.specialty !== undefined && { specialty: body.specialty }),
      ...(body.challenge_type !== undefined && { challenge_type: body.challenge_type }),
      ...(body.industry !== undefined && { industry: body.industry }),
      ...(body.emoji !== undefined && { emoji: body.emoji || null }),
    })
    .eq('id', id)
    .select()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Challenge introuvable ou modification bloquée par RLS' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, challenge: data[0] })
}

export async function DELETE(_: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const { error: dbErr } = await (admin!.supabase as any)
    .from('challenges')
    .delete()
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
