import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Backstop cron that flips `participations` past their personal_deadline
 * to `expired` and emits the `deadline_missed` notification. Lazy cleanup
 * also happens in the participations API and SSR pages; this cron is the
 * safety net.
 *
 * NB: league demotion / tier-window / XP penalties were removed 2026-05-26 —
 * leagues are permanent achievements and a missed deadline no longer costs XP.
 */
export async function POST(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Expire participations past personal_deadline + notify
  const { data: expiredParts } = await (supabaseAdmin as any)
    .from('participations')
    .select('id, user_id, challenge_id')
    .eq('status', 'active')
    .lt('personal_deadline', now.toISOString())

  let deadlineMissed = 0

  for (const part of expiredParts ?? []) {
    await (supabaseAdmin as any)
      .from('participations')
      .update({ status: 'expired' })
      .eq('id', part.id)

    try {
      await (supabaseAdmin as any).from('notifications').insert({
        user_id: part.user_id,
        type: 'deadline_missed',
        data: { challenge_id: part.challenge_id },
      })
    } catch { /* ignore */ }

    deadlineMissed++
  }

  return NextResponse.json({ deadlineMissed })
}
