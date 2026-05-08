import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

const VALID_CATEGORIES = [
  'getting-started',
  'challenges',
  'submissions',
  'profile',
  'billing',
  'account',
] as const

export async function GET() {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { data } = await (admin!.supabase as any)
    .from('help_articles')
    .select('*')
    .order('category', { ascending: true })
    .order('order_index', { ascending: true })

  return NextResponse.json({ articles: data ?? [] })
}

export async function POST(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const slug = (body.slug as string)?.trim()
  const category = body.category as string

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Slug invalide (a-z, 0-9, - seulement)' }, { status: 400 })
  }
  if (!VALID_CATEGORIES.includes(category as any)) {
    return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 })
  }
  if (!body.title_fr || !body.title_en || !body.content_fr || !body.content_en) {
    return NextResponse.json({ error: 'Titres et contenus FR/EN requis' }, { status: 400 })
  }

  const { data, error: dbErr } = await (admin!.supabase as any)
    .from('help_articles')
    .insert({
      slug,
      category,
      title_fr: body.title_fr,
      title_en: body.title_en,
      content_fr: body.content_fr,
      content_en: body.content_en,
      excerpt_fr: body.excerpt_fr ?? null,
      excerpt_en: body.excerpt_en ?? null,
      order_index: body.order_index ?? 0,
      published: body.published ?? true,
    })
    .select()
    .single()

  if (dbErr) {
    if (dbErr.code === '23505') {
      return NextResponse.json({ error: 'Ce slug existe déjà' }, { status: 409 })
    }
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }
  return NextResponse.json({ article: data })
}
