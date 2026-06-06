import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

// slugify : lowercase, sans accents, alphanum → `_`, trim des `_`.
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export async function GET() {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { data } = await (admin!.supabase as any)
    .from('specialties')
    .select('*')
    .order('order_index', { ascending: true })

  return NextResponse.json({ specialties: data ?? [] })
}

export async function POST(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const name = (body.name ?? body.name_fr ?? '').toString().trim()
  if (!name) {
    return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
  }

  // Slug : fourni (slugifié) sinon auto-suggéré depuis le name. Immuable ensuite.
  const slug = slugify((body.slug ?? '').toString().trim() || name)
  if (!slug) {
    return NextResponse.json({ error: 'Slug invalide' }, { status: 400 })
  }

  // Unicité du slug.
  const { data: existing } = await (admin!.supabase as any)
    .from('specialties')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ error: `Le slug « ${slug} » est déjà utilisé.`, code: 'SLUG_TAKEN' }, { status: 409 })
  }

  const { data, error: dbErr } = await (admin!.supabase as any)
    .from('specialties')
    .insert({
      slug,
      name,
      name_fr: body.name_fr ?? null,
      name_en: body.name_en ?? null,
      name_ar: body.name_ar ?? null,
      emoji: body.emoji ?? null,
      order_index: body.order_index ?? 0,
      is_active: body.is_active ?? true,
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ specialty: data })
}
