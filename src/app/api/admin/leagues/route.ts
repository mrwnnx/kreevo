import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { data } = await (admin!.supabase as any)
    .from('leagues')
    .select('*')
    .order('order_index', { ascending: true })

  return NextResponse.json({ leagues: data ?? [] })
}

export async function POST(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { data, error: dbErr } = await (admin!.supabase as any)
    .from('leagues')
    .insert({
      name: body.name,
      icon: body.icon,
      color: body.color,
      order_index: body.order_index,
      min_challenges: body.min_challenges ?? 3,
      access: body.access ?? 'all',
      is_active: body.is_active ?? true,
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ league: data })
}
