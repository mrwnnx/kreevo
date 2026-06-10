import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

interface Props { params: Promise<{ id: string }> }

const TEXT_FIELDS = [
  'name_fr', 'name_en', 'name_ar',
  'title_fr', 'title_en', 'title_ar',
  'description_fr', 'description_en', 'description_ar',
] as const

// Édite une étape : champs texte (non vides si fournis), image_url, is_active, order_index.
export async function PATCH(request: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()

  const update: Record<string, unknown> = {}
  for (const f of TEXT_FIELDS) {
    if (body[f] !== undefined) {
      const v = (body[f] ?? '').toString().trim()
      if (!v) return NextResponse.json({ error: `Champ vide non autorisé : ${f}` }, { status: 400 })
      update[f] = v
    }
  }
  if (body.image_url !== undefined) update.image_url = body.image_url || null
  if (body.is_active !== undefined) update.is_active = !!body.is_active
  if (body.order_index !== undefined) {
    if (!Number.isInteger(body.order_index)) {
      return NextResponse.json({ error: 'order_index doit être un entier' }, { status: 400 })
    }
    update.order_index = body.order_index
  }
  update.updated_at = new Date().toISOString()

  const { data, error: dbErr } = await (admin!.supabase as any)
    .from('onboarding_steps')
    .update(update)
    .eq('id', id)
    .select()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Étape introuvable' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, step: data[0] })
}

// Suppression dure (aucune FK ne référence onboarding_steps).
export async function DELETE(_: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params

  const { error: dbErr } = await (admin!.supabase as any)
    .from('onboarding_steps')
    .delete()
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
