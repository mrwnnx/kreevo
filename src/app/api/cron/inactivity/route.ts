import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getLeagueFromXP } from '@/lib/utils/xp'

const LEAGUE_ORDER = ['rookie', 'rising', 'pro', 'elite', 'legend']

function demoteLeague(league: string): string {
  const idx = LEAGUE_ORDER.indexOf(league)
  return idx > 0 ? LEAGUE_ORDER[idx - 1] : 'rookie'
}

export async function POST(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()
  const now = new Date()

  // ── 1. Expire participations past personal_deadline ──
  const { data: expiredParts } = await (supabase as any)
    .from('participations')
    .select('id, user_id, challenge_id')
    .eq('status', 'active')
    .lt('personal_deadline', now.toISOString())

  let deadlineMissed = 0

  for (const part of expiredParts ?? []) {
    await (supabase as any)
      .from('participations')
      .update({ status: 'expired' })
      .eq('id', part.id)

    // -50 XP penalty
    const { data: prof } = await (supabase as any)
      .from('profiles').select('xp').eq('id', part.user_id).single()
    const newXP = Math.max(0, (prof?.xp ?? 0) - 50)
    await (supabase as any).from('profiles').update({ xp: newXP }).eq('id', part.user_id)

    try {
      await (supabase as any).from('notifications').insert({
        user_id: part.user_id,
        type: 'deadline_missed',
        data: { challenge_id: part.challenge_id, xp_lost: 50 },
      })
    } catch { /* ignore */ }

    deadlineMissed++
  }

  // ── 2. Inactivity checks (existing logic) ──
  const { data: profiles } = await (supabase as any)
    .from('profiles')
    .select('id, xp, league')

  if (!profiles?.length) return NextResponse.json({ deadlineMissed, warned: 0, penalized: 0, demoted: 0 })

  let warned = 0, penalized = 0, demoted = 0

  for (const profile of profiles) {
    const { data: lastSub } = await (supabase as any)
      .from('submissions')
      .select('created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const lastActivity = lastSub?.created_at ? new Date(lastSub.created_at) : null
    if (!lastActivity) continue

    const daysSince = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSince >= 90) {
      const newLeague = demoteLeague(profile.league)
      if (newLeague !== profile.league) {
        await (supabase as any).from('profiles').update({ league: newLeague }).eq('id', profile.id)
        try {
          await (supabase as any).from('notifications').insert({
            user_id: profile.id,
            type: 'league_down',
            data: { from: profile.league, to: newLeague, reason: 'inactivity_90d' },
          })
        } catch { /* ignore */ }
        demoted++
      }
    } else if (daysSince >= 60) {
      const newXP = Math.max(0, (profile.xp ?? 0) - 200)
      const newLeague = getLeagueFromXP(newXP)
      await (supabase as any).from('profiles').update({ xp: newXP, league: newLeague }).eq('id', profile.id)
      try {
        await (supabase as any).from('notifications').insert({
          user_id: profile.id,
          type: 'xp_penalty',
          data: { penalty: 200, reason: 'inactivity_60d' },
        })
      } catch { /* ignore */ }
      penalized++
    } else if (daysSince >= 30) {
      try {
        await (supabase as any).from('notifications').insert({
          user_id: profile.id,
          type: 'warning_inactivity',
          data: { days_since: daysSince },
        })
      } catch { /* ignore */ }
      warned++
    }
  }

  return NextResponse.json({ deadlineMissed, warned, penalized, demoted })
}
