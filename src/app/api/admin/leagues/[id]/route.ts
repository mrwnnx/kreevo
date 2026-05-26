import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

interface Props { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()

  const update: Record<string, unknown> = {}
  if (body.name !== undefined)           update.name = body.name
  if (body.icon !== undefined)           update.icon = body.icon
  if (body.color !== undefined)          update.color = body.color
  if (body.order_index !== undefined)    update.order_index = body.order_index
  if (body.min_challenges !== undefined)         update.min_challenges = body.min_challenges
  if (body.min_challenges_enabled !== undefined) update.min_challenges_enabled = body.min_challenges_enabled
  if (body.xp_threshold_percent !== undefined)   update.xp_threshold_percent = body.xp_threshold_percent
  if (body.access !== undefined)               update.access = body.access
  if (body.is_active !== undefined)      update.is_active = body.is_active

  const { error: dbErr } = await (admin!.supabase as any)
    .from('leagues')
    .update(update)
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const { error: dbErr } = await (admin!.supabase as any)
    .from('leagues')
    .delete()
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
