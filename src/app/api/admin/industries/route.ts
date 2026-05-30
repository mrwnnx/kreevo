import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { data } = await (admin!.supabase as any)
    .from('industries')
    .select('*')
    .order('display_order', { ascending: true })

  return NextResponse.json({ industries: data ?? [] })
}

export async function POST(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { data, error: dbErr } = await (admin!.supabase as any)
    .from('industries')
    .insert({
      name_fr: body.name_fr ?? null,
      name_en: body.name_en ?? null,
      name_ar: body.name_ar ?? null,
      display_order: body.display_order ?? 0,
      translation_status: body.translation_status ?? { fr: 'draft', en: 'draft', ar: 'draft' },
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ industry: data })
}
