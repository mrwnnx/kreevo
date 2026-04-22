import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin'
import { DEFAULT_TOKENS } from '@/lib/design-tokens'

export async function GET() {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { data } = await (admin!.supabase as any)
    .from('settings')
    .select('value')
    .eq('key', 'design_tokens')
    .single()

  return NextResponse.json({ tokens: data?.value ?? DEFAULT_TOKENS })
}

export async function POST(req: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { tokens } = await req.json()
  if (!tokens) return NextResponse.json({ error: 'Missing tokens' }, { status: 400 })

  const { error: dbErr } = await (admin!.supabase as any)
    .from('settings')
    .upsert({ key: 'design_tokens', value: tokens, updated_at: new Date().toISOString() }, { onConflict: 'key' })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  revalidatePath('/', 'layout')
  return NextResponse.json({ ok: true })
}
