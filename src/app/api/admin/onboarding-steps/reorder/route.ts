import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

// Réordonnancement par lot : body { items: [{ id, order_index }] }.
export async function PATCH(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const items = Array.isArray(body.items) ? body.items : null
  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'items[] requis' }, { status: 400 })
  }
  for (const it of items) {
    if (typeof it?.id !== 'string' || !Number.isInteger(it?.order_index)) {
      return NextResponse.json({ error: 'Chaque item doit être { id: string, order_index: int }' }, { status: 400 })
    }
  }

  const now = new Date().toISOString()
  const results = await Promise.all(
    items.map((it: { id: string; order_index: number }) =>
      (admin!.supabase as any)
        .from('onboarding_steps')
        .update({ order_index: it.order_index, updated_at: now })
        .eq('id', it.id),
    ),
  )
  const failed = results.find((r: { error: unknown }) => r.error)
  if (failed) return NextResponse.json({ error: (failed.error as { message: string }).message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
