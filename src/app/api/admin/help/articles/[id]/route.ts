import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

interface Params {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: Params) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const fields = [
    'slug', 'category', 'title_fr', 'title_en',
    'content_fr', 'content_en', 'excerpt_fr', 'excerpt_en',
    'order_index', 'published',
  ] as const
  for (const f of fields) {
    if (body[f] !== undefined) update[f] = body[f]
  }

  if (update.slug && !/^[a-z0-9-]+$/.test(update.slug as string)) {
    return NextResponse.json({ error: 'Slug invalide (a-z, 0-9, - seulement)' }, { status: 400 })
  }

  const { error: dbErr } = await (admin!.supabase as any)
    .from('help_articles')
    .update(update)
    .eq('id', id)

  if (dbErr) {
    if (dbErr.code === '23505') {
      return NextResponse.json({ error: 'Ce slug existe déjà' }, { status: 409 })
    }
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: Params) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const { error: dbErr } = await (admin!.supabase as any)
    .from('help_articles')
    .delete()
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
