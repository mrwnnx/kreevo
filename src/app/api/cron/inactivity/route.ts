import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { demoteLeague, getLeagueThreshold } from '@/lib/utils/leagues'

export async function POST(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // ── 1. Expire participations past personal_deadline ──
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

    // -50 XP penalty
    const { data: prof } = await (supabaseAdmin as any)
      .from('profiles').select('xp').eq('id', part.user_id).single()
    const newXP = Math.max(0, (prof?.xp ?? 0) - 50)
    await (supabaseAdmin as any).from('profiles').update({ xp: newXP }).eq('id', part.user_id)

    try {
      await (supabaseAdmin as any).from('notifications').insert({
        user_id: part.user_id,
        type: 'deadline_missed',
        data: { challenge_id: part.challenge_id, xp_lost: 50 },
      })
    } catch { /* ignore */ }

    deadlineMissed++
  }

  // ── 2. Inactivity checks + tier window failures ──
  const { data: profiles } = await (supabaseAdmin as any)
    .from('profiles')
    .select('id, xp, league, league_entered_at, created_at')

  if (!profiles?.length) {
    return NextResponse.json({ deadlineMissed, warned: 0, penalized: 0, demoted: 0, windowFailed: 0 })
  }

  // Pre-fetch tier_window config per league name
  const { data: leagues } = await (supabaseAdmin as any)
    .from('leagues')
    .select('id, name, tier_window_enabled, tier_window_days, tier_window_xp_penalty, tier_window_set_at')

  const leagueByName = new Map<string, any>()
  for (const l of leagues ?? []) leagueByName.set(l.name, l)

  let warned = 0, penalized = 0, demoted = 0, windowFailed = 0

  for (const profile of profiles) {
    // ── 2a. Tier window check (independent of activity) ──
    const lg = leagueByName.get(profile.league)
    if (lg?.tier_window_enabled && lg.tier_window_days > 0) {
      const enteredAt = profile.league_entered_at
        ? new Date(profile.league_entered_at)
        : new Date(profile.created_at)
      const setAt = lg.tier_window_set_at ? new Date(lg.tier_window_set_at) : enteredAt
      const start = enteredAt.getTime() > setAt.getTime() ? enteredAt : setAt
      const deadline = new Date(start.getTime() + lg.tier_window_days * 24 * 60 * 60 * 1000)

      if (now > deadline) {
        const threshold = await getLeagueThreshold(lg.id)
        if (threshold > 0 && (profile.xp ?? 0) < threshold) {
          await demoteLeague(profile.id, {
            reason: 'tier_window_failed',
            xpPenalty: lg.tier_window_xp_penalty ?? 0,
          })
          windowFailed++
          continue // skip inactivity branch — already demoted
        }
      }
    }

    // ── 2b. Inactivity branch (uses last submission) ──
    const { data: lastSub } = await (supabaseAdmin as any)
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
      // Descend d'une ligue via la table leagues (gère la notif au passage)
      const before = profile.league
      await demoteLeague(profile.id)
      const { data: refreshed } = await (supabaseAdmin as any)
        .from('profiles').select('league').eq('id', profile.id).single()
      if (refreshed && refreshed.league !== before) demoted++
    } else if (daysSince >= 60) {
      const newXP = Math.max(0, (profile.xp ?? 0) - 200)
      await (supabaseAdmin as any).from('profiles').update({ xp: newXP }).eq('id', profile.id)
      try {
        await (supabaseAdmin as any).from('notifications').insert({
          user_id: profile.id,
          type: 'xp_penalty',
          data: { penalty: 200, reason: 'inactivity_60d' },
        })
      } catch { /* ignore */ }
      penalized++
    } else if (daysSince >= 30) {
      try {
        await (supabaseAdmin as any).from('notifications').insert({
          user_id: profile.id,
          type: 'warning_inactivity',
          data: { days_since: daysSince },
        })
      } catch { /* ignore */ }
      warned++
    }
  }

  return NextResponse.json({ deadlineMissed, warned, penalized, demoted, windowFailed })
}
