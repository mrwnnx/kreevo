import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Downgrade promo-Pro accounts back to `free` once their `plan_expires_at` has
 * passed. New signups (and any promo upgrade) get `plan='pro'` +
 * `plan_expires_at` = end of the promo window; this daily cron is what reverts
 * them. Rows with a NULL `plan_expires_at` (real/permanent plans) are untouched.
 *
 * Vercel Cron sends GET (always) — see inactivity/streak-reset for the pattern.
 */
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date().toISOString()
  const { data, error } = await (supabaseAdmin as any)
    .from('profiles')
    .update({ plan: 'free', plan_expires_at: null })
    .lt('plan_expires_at', now)
    .neq('plan', 'free')
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ downgraded: data?.length ?? 0 })
}
