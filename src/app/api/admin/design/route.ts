import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/admin'
import { DEFAULT_TOKENS, normalizeTokens } from '@/lib/design-tokens'
import { DESIGN_TOKENS_CACHE_TAG } from '@/lib/design-tokens.server'

export async function GET() {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { data } = await (admin!.supabase as any)
    .from('settings')
    .select('value')
    .eq('key', 'design_tokens')
    .single()

  return NextResponse.json({ tokens: data?.value ? normalizeTokens(data.value) : DEFAULT_TOKENS })
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

  // Invalidate the cached tokens so the new theme reflects on the next render
  // instead of waiting for the 1h revalidation window. Next 16 requires the
  // stale-while-revalidate profile as the 2nd arg; 'max' = longest stale window.
  revalidateTag(DESIGN_TOKENS_CACHE_TAG, 'max')

  return NextResponse.json({ ok: true })
}
