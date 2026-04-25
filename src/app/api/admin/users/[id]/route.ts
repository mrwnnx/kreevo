import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { checkAndUpdateLeague } from '@/lib/utils/leagues'

interface Props { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const update: Record<string, unknown> = {}

  if ('plan' in body)         update.plan = body.plan
  if ('league' in body)       update.league = body.league
  if ('role' in body)         update.role = body.role
  if ('is_suspended' in body) update.is_suspended = body.is_suspended

  let triggerLeagueCheck = false
  if ('xp_add' in body) {
    const { data: profile } = await (admin!.supabase as any)
      .from('profiles').select('xp').eq('id', id).single()
    const newXP = Math.max(0, (profile?.xp ?? 0) + (body.xp_add as number))
    update.xp = newXP
    triggerLeagueCheck = !('league' in body)
  }

  const { error: dbErr } = await (admin!.supabase as any)
    .from('profiles')
    .update(update)
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  if (triggerLeagueCheck) {
    try { await checkAndUpdateLeague(id) } catch { /* ignore */ }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  await (admin!.supabase as any).from('profiles').delete().eq('id', id)
  await admin!.supabase.auth.admin.deleteUser(id)

  return NextResponse.json({ ok: true })
}
