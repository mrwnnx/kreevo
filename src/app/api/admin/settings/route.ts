import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { data: rows } = await (admin!.supabase as any)
    .from('settings')
    .select('key, value')

  const settings: Record<string, unknown> = {}
  for (const row of rows ?? []) {
    settings[row.key] = row.value
  }

  return NextResponse.json({ settings })
}

export async function PATCH(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { key, value } = await request.json()
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })

  const { error: dbErr } = await (admin!.supabase as any)
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
