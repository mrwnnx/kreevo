import type { League } from '@/lib/utils/xp'
import { getLeagueFromXP } from '@/lib/utils/xp'

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

export async function checkAndUpdateLeague(userId: string, supabase: any): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, league')
    .eq('id', userId)
    .single()

  if (!profile) return

  const newLeague = getLeagueFromXP(profile.xp ?? 0)
  if (newLeague === profile.league) return

  await supabase
    .from('profiles')
    .update({ league: newLeague })
    .eq('id', userId)

  const isPromotion = leagueRank(newLeague) > leagueRank(profile.league)

  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: isPromotion ? 'league_up' : 'league_down',
      data: { from: profile.league, to: newLeague },
    })
  } catch {
    // notifications table may not exist yet
  }
}

function leagueRank(league: string): number {
  const order = ['rookie', 'rising', 'pro', 'elite', 'legend']
  return order.indexOf(league)
}
