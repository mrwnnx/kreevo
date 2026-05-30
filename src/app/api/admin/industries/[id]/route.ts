import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

interface Props { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()

  const update: Record<string, unknown> = {}
  if (body.name_fr !== undefined)            update.name_fr = body.name_fr
  if (body.name_en !== undefined)            update.name_en = body.name_en
  if (body.name_ar !== undefined)            update.name_ar = body.name_ar
  if (body.display_order !== undefined)      update.display_order = body.display_order
  if (body.translation_status !== undefined) update.translation_status = body.translation_status

  const { error: dbErr } = await (admin!.supabase as any)
    .from('industries')
    .update(update)
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params

  // Referential guard — never orphan a challenge that still points here.
  const { count } = await (admin!.supabase as any)
    .from('challenges')
    .select('id', { count: 'exact', head: true })
    .eq('industry_id', id)

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Impossible de supprimer : ${count} challenge(s) utilisent encore cette industrie. Réassigne-les d'abord.` },
      { status: 409 },
    )
  }

  const { error: dbErr } = await (admin!.supabase as any)
    .from('industries')
    .delete()
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
