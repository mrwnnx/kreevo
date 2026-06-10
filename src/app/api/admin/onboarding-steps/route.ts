import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

// 9 champs texte NOT NULL (name/title/description × fr/en/ar).
const TEXT_FIELDS = [
  'name_fr', 'name_en', 'name_ar',
  'title_fr', 'title_en', 'title_ar',
  'description_fr', 'description_en', 'description_ar',
] as const

// Liste TOUTES les étapes (actives ET inactives), triées order_index. Admin only.
export async function GET() {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { data } = await (admin!.supabase as any)
    .from('onboarding_steps')
    .select('*')
    .order('order_index', { ascending: true })

  return NextResponse.json({ steps: data ?? [] })
}

// Crée une étape en fin de liste (order_index = max+1).
export async function POST(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const body = await request.json()

  const values: Record<string, string> = {}
  for (const f of TEXT_FIELDS) {
    const v = (body[f] ?? '').toString().trim()
    if (!v) return NextResponse.json({ error: `Champ requis : ${f}` }, { status: 400 })
    values[f] = v
  }

  const { data: last } = await (admin!.supabase as any)
    .from('onboarding_steps')
    .select('order_index')
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()
  const order_index = (last?.order_index ?? -1) + 1

  const { data, error: dbErr } = await (admin!.supabase as any)
    .from('onboarding_steps')
    .insert({
      ...values,
      image_url: body.image_url ?? null,
      is_active: body.is_active ?? true,
      order_index,
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ step: data })
}
