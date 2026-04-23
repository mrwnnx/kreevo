import type { League } from '@/lib/utils/xp'
import { getLeagueFromXP } from '@/lib/utils/xp'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function getLeagueThreshold(leagueId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('challenges')
    .select('xp_reward')
    .eq('league_id', leagueId)
    .eq('is_published', true)

  const total = (data ?? []).reduce((sum: number, c: any) => sum + (c.xp_reward ?? 0), 0)
  return Math.floor(total * 0.6)
}

export const LEAGUE_CONFIG: Record<League, {
  name: string
  minXp: number
  gradient: string
  textClass: string
  icon: string
  perks: string[]
}> = {
  rookie: {
    name: 'Rookie',
    minXp: 0,
    gradient: 'from-stone-600 to-stone-400',
    textClass: 'text-stone-500',
    icon: '🎯',
    perks: ['Weekly challenges', 'Community gallery'],
  },
  rising: {
    name: 'Rising',
    minXp: 500,
    gradient: 'from-slate-500 to-slate-300',
    textClass: 'text-slate-500',
    icon: '⬆️',
    perks: ['Rookie perks', 'Vote on submissions', 'Monthly badge'],
  },
  pro: {
    name: 'Pro',
    minXp: 1500,
    gradient: 'from-yellow-600 to-yellow-400',
    textClass: 'text-yellow-600',
    icon: '⭐',
    perks: ['Rising perks', 'Featured profile', 'Priority feedback'],
  },
  elite: {
    name: 'Elite',
    minXp: 3500,
    gradient: 'from-blue-600 to-blue-400',
    textClass: 'text-blue-600',
    icon: '💎',
    perks: ['Pro perks', 'Jury eligibility', 'Exclusive challenges'],
  },
  legend: {
    name: 'Legend',
    minXp: 7000,
    gradient: 'from-red-600 to-pink-500',
    textClass: 'text-red-500',
    icon: '👑',
    perks: ['Elite perks', 'Mentor badge', 'Revenue share (Pro)'],
  },
}

export function getLeagueConfig(league: League) {
  return LEAGUE_CONFIG[league]
}

export async function checkAndUpdateLeague(userId: string, _supabase?: any): Promise<void> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('xp, league')
    .eq('id', userId)
    .single()

  if (!profile) return

  // Try new leagues table first
  const { data: currentLeagueRow } = await (supabaseAdmin as any)
    .from('leagues')
    .select('id, order_index, min_challenges, name')
    .ilike('name', profile.league)
    .eq('is_active', true)
    .maybeSingle()

  if (currentLeagueRow) {
    // New system: check XP threshold + challenges completed
    const xpThreshold = await getLeagueThreshold(currentLeagueRow.id)

    // Count challenges completed by user in this league
    const { data: leagueChallenges } = await supabaseAdmin
      .from('challenges')
      .select('id')
      .eq('league_id', currentLeagueRow.id)
      .eq('is_published', true)

    const ids = (leagueChallenges ?? []).map((c: any) => c.id)
    let completedCount = 0
    if (ids.length > 0) {
      const { count } = await supabaseAdmin
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('challenge_id', ids)
      completedCount = count ?? 0
    }

    const meetsXP = xpThreshold === 0 || (profile.xp ?? 0) >= xpThreshold
    const meetsChallenges = completedCount >= (currentLeagueRow.min_challenges ?? 3)

    if (meetsXP && meetsChallenges) {
      // Find next league
      const { data: nextLeague } = await (supabaseAdmin as any)
        .from('leagues')
        .select('id, name')
        .eq('order_index', currentLeagueRow.order_index + 1)
        .eq('is_active', true)
        .maybeSingle()

      if (nextLeague) {
        await supabaseAdmin
          .from('profiles')
          .update({ league: nextLeague.name })
          .eq('id', userId)

        try {
          await (supabaseAdmin as any).from('notifications').insert({
            user_id: userId,
            type: 'league_up',
            data: { from: profile.league, to: nextLeague.name },
          })
          await (supabaseAdmin as any).from('badges').insert({
            user_id: userId,
            badge_type: 'league_up',
            metadata: { league: nextLeague.name },
          })
        } catch { /* ignore */ }
      }
    }
    return
  }

  // Fallback: old XP-based system
  const newLeague = getLeagueFromXP(profile.xp ?? 0)
  if (newLeague === profile.league) return

  await supabaseAdmin
    .from('profiles')
    .update({ league: newLeague })
    .eq('id', userId)

  const isPromotion = leagueRank(newLeague) > leagueRank(profile.league)
  try {
    await (supabaseAdmin as any).from('notifications').insert({
      user_id: userId,
      type: isPromotion ? 'league_up' : 'league_down',
      data: { from: profile.league, to: newLeague },
    })
  } catch { /* ignore */ }
}

function leagueRank(league: string): number {
  const order = ['rookie', 'rising', 'pro', 'elite', 'legend']
  return order.indexOf(league)
}
