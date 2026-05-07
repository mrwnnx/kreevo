import { supabaseAdmin } from '@/lib/supabase/admin'

export type LeagueRow = {
  id: string
  name: string
  icon: string
  color: string
  order_index: number
  min_challenges: number
  min_challenges_enabled: boolean
  xp_threshold_percent: number
  tier_window_enabled: boolean
  tier_window_days: number
  tier_window_xp_penalty: number
  tier_window_set_at: string | null
  access: 'all' | 'pro_only'
  is_active: boolean
  specialty?: string | null
  created_at: string
}

// Seuil XP d'une ligue : pourcentage configurable (par défaut 60%) du total
// des xp_reward des challenges publiés dans la ligue.
export async function getLeagueThreshold(leagueId: string): Promise<number> {
  const [{ data: league }, { data: challenges }] = await Promise.all([
    (supabaseAdmin as any)
      .from('leagues')
      .select('xp_threshold_percent')
      .eq('id', leagueId)
      .single(),
    supabaseAdmin
      .from('challenges')
      .select('xp_reward')
      .eq('league_id', leagueId)
      .eq('is_published', true),
  ])
  const total = (challenges ?? []).reduce((s: number, c: any) => s + (c.xp_reward || 0), 0)
  const percent = league?.xp_threshold_percent ?? 60
  return Math.floor(total * percent / 100)
}

// Promotion auto si seuil XP + min_challenges atteints.
export async function checkAndUpdateLeague(userId: string): Promise<void> {
  const { data: profile } = await (supabaseAdmin as any)
    .from('profiles')
    .select('xp, league')
    .eq('id', userId)
    .single()
  if (!profile) return

  const currentLeagueName = profile.league || '7ajra'
  const currentXP = profile.xp || 0

  const { data: currentLeague } = await (supabaseAdmin as any)
    .from('leagues')
    .select('*')
    .eq('name', currentLeagueName)
    .single()
  if (!currentLeague) return

  const threshold = await getLeagueThreshold(currentLeague.id)

  const { data: leagueChallenges } = await (supabaseAdmin as any)
    .from('challenges')
    .select('id')
    .eq('league_id', currentLeague.id)
    .eq('is_published', true)

  const challengeIds = (leagueChallenges ?? []).map((c: any) => c.id)
  let completedCount = 0
  if (challengeIds.length > 0) {
    const { count } = await (supabaseAdmin as any)
      .from('participations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'submitted')
      .in('challenge_id', challengeIds)
    completedCount = count ?? 0
  }

  const minChallenges = currentLeague.min_challenges ?? 3
  const minChallengesEnabled = currentLeague.min_challenges_enabled ?? true
  const meetsXP = threshold === 0 || currentXP >= threshold
  const meetsChallenges = !minChallengesEnabled || completedCount >= minChallenges

  if (!meetsXP || !meetsChallenges) return

  const { data: nextLeague } = await (supabaseAdmin as any)
    .from('leagues')
    .select('*')
    .eq('order_index', currentLeague.order_index + 1)
    .eq('is_active', true)
    .maybeSingle()

  if (!nextLeague) return

  await (supabaseAdmin as any)
    .from('profiles')
    .update({ league: nextLeague.name, league_entered_at: new Date().toISOString() })
    .eq('id', userId)

  try {
    await (supabaseAdmin as any).from('notifications').insert({
      user_id: userId,
      type: 'league_up',
      data: { old_league: currentLeagueName, new_league: nextLeague.name },
    })
  } catch { /* ignore */ }
}

// Sanction : descend d'une ligue (sauf si déjà à la première).
// Reason 'inactivity' (90j sans soumission) ou 'tier_window_failed' (seuil non atteint dans la fenêtre).
// xpPenalty optionnel : retire X XP au passage (cap à 0).
export async function demoteLeague(
  userId: string,
  options: { reason?: 'inactivity' | 'tier_window_failed'; xpPenalty?: number } = {},
): Promise<void> {
  const { reason = 'inactivity', xpPenalty = 0 } = options

  const { data: profile } = await (supabaseAdmin as any)
    .from('profiles')
    .select('league, xp')
    .eq('id', userId)
    .single()
  if (!profile) return

  const { data: currentLeague } = await (supabaseAdmin as any)
    .from('leagues')
    .select('*')
    .eq('name', profile.league || '7ajra')
    .single()
  if (!currentLeague || currentLeague.order_index <= 1) return

  const { data: prevLeague } = await (supabaseAdmin as any)
    .from('leagues')
    .select('*')
    .eq('order_index', currentLeague.order_index - 1)
    .eq('is_active', true)
    .maybeSingle()
  if (!prevLeague) return

  const newXP = Math.max(0, (profile.xp ?? 0) - Math.max(0, xpPenalty))

  await (supabaseAdmin as any)
    .from('profiles')
    .update({
      league: prevLeague.name,
      xp: newXP,
      league_entered_at: new Date().toISOString(),
    })
    .eq('id', userId)

  try {
    await (supabaseAdmin as any).from('notifications').insert({
      user_id: userId,
      type: reason === 'tier_window_failed' ? 'league_window_failed' : 'league_down',
      data: {
        old_league: profile.league,
        new_league: prevLeague.name,
        xp_penalty: xpPenalty,
        reason,
      },
    })
  } catch { /* ignore */ }
}
