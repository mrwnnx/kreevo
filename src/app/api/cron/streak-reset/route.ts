import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    auth !== `Bearer ${process.env.CRON_SECRET}` &&
    auth !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const { error, count } = await (supabaseAdmin as any)
    .from('streaks')
    .update({ current_streak: 0 }, { count: 'exact' })
    .lt('last_activity_date', yesterdayStr)
    .gt('current_streak', 0)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, reset: count ?? 0 })
}
