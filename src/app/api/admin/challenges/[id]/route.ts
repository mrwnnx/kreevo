import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

interface Props { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()

  const { error: dbErr } = await (admin!.supabase as any)
    .from('challenges')
    .update({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.brief !== undefined && { brief: body.brief }),
      ...(body.context !== undefined && { context: body.context }),
      ...(body.deliverable !== undefined && { deliverable: body.deliverable }),
      ...(body.constraints !== undefined && { constraints: body.constraints }),
      ...(body.criteria !== undefined && { criteria: body.criteria }),
      ...(body.track !== undefined && { track: body.track }),
      ...(body.level !== undefined && { level: body.level }),
      ...(body.month !== undefined && { month: body.month }),
      ...(body.year !== undefined && { year: body.year }),
      ...(body.reveal_at !== undefined && { reveal_at: body.reveal_at }),
      ...(body.closes_at !== undefined && { closes_at: body.closes_at }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.league_id !== undefined && { league_id: body.league_id }),
      ...(body.difficulty !== undefined && { difficulty: body.difficulty }),
      ...(body.xp_reward !== undefined && { xp_reward: body.xp_reward }),
      ...(body.deadline_days !== undefined && { deadline_days: body.deadline_days }),
      ...(body.is_published !== undefined && { is_published: body.is_published }),
    })
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
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
