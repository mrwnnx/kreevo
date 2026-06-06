import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

interface Props { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()

  // slug IMMUABLE : on ignore toute tentative de le modifier (clé fonctionnelle
  // référencée par les FK + mappings par slug onboarding/profil).
  const update: Record<string, unknown> = {}
  if (body.name !== undefined)        update.name = body.name
  if (body.name_fr !== undefined)     update.name_fr = body.name_fr
  if (body.name_en !== undefined)     update.name_en = body.name_en
  if (body.name_ar !== undefined)     update.name_ar = body.name_ar
  if (body.emoji !== undefined)       update.emoji = body.emoji || null
  if (body.order_index !== undefined) update.order_index = body.order_index
  if (body.is_active !== undefined)   update.is_active = body.is_active
  update.updated_at = new Date().toISOString()

  const { data, error: dbErr } = await (admin!.supabase as any)
    .from('specialties')
    .update(update)
    .eq('id', id)
    .select()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Spécialité introuvable' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, specialty: data[0] })
}

export async function DELETE(_: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params

  // Garde référentielle : la FK est en NO ACTION (la DB bloquerait), on renvoie un
  // message propre. Hard delete autorisé UNIQUEMENT si 0 référence.
  const [{ count: userCount }, { count: challengeCount }] = await Promise.all([
    (admin!.supabase as any).from('profiles').select('id', { count: 'exact', head: true }).eq('specialty_id', id),
    (admin!.supabase as any).from('challenges').select('id', { count: 'exact', head: true }).eq('specialty_id', id),
  ])
  const total = (userCount ?? 0) + (challengeCount ?? 0)
  if (total > 0) {
    return NextResponse.json(
      {
        error: `Impossible de supprimer : ${userCount ?? 0} user(s) et ${challengeCount ?? 0} challenge(s) y sont rattachés. Désactive-la plutôt (is_active = false).`,
        code: 'SPECIALTY_IN_USE',
      },
      { status: 409 },
    )
  }

  const { error: dbErr } = await (admin!.supabase as any)
    .from('specialties')
    .delete()
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
