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
  access: 'all' | 'pro_only'
  is_active: boolean
  specialty?: string | null
  created_at: string
}

// Seuil XP d'une ligue : pourcentage configurable (par défaut 60%) du total
// des xp_reward des challenges publiés dans la ligue.
//
// `specialtyId` optionnel (PHASE 2 — scoping par spécialité) :
//   - fourni  → ne somme que les challenges de cette spécialité (seuil scopé)
//   - absent/null → comportement global historique (toutes spés), utilisé par
//     la stat admin globale (api/admin/leagues/[id]/stats).
export async function getLeagueThreshold(
  leagueId: string,
  specialtyId?: string | null,
): Promise<number> {
  let challengesQuery = supabaseAdmin
    .from('challenges')
    .select('xp_reward')
    .eq('league_id', leagueId)
    .eq('is_published', true)
  if (specialtyId) {
    challengesQuery = challengesQuery.eq('specialty_id', specialtyId)
  }
  const [{ data: league }, { data: challenges }] = await Promise.all([
    supabaseAdmin
      .from('leagues')
      .select('xp_threshold_percent')
      .eq('id', leagueId)
      .single(),
    challengesQuery,
  ])
  const total = (challenges ?? []).reduce((s, c) => s + (c.xp_reward || 0), 0)
  const percent = league?.xp_threshold_percent ?? 60
  return Math.floor(total * percent / 100)
}

// PHASE 3 — score « leagueXp » scopé par spécialité.
// Pour chaque user : somme des xp_reward des challenges SOUMIS dans l'ensemble
// {league_id + specialty_id + is_published} — EXACTEMENT le même set de challenges
// que getLeagueThreshold(leagueId, specialtyId). Le score d'un user est donc borné
// par le seuil (leagueXp ≤ threshold), cohérence garantie. Source unique réutilisée
// par le leaderboard ET le dashboard (pas de duplication de la logique de score).
export async function getScopedLeagueScores(
  leagueId: string,
  specialtyId: string,
): Promise<Record<string, number>> {
  const { data: leagueChallenges } = await supabaseAdmin
    .from('challenges')
    .select('id, xp_reward')
    .eq('league_id', leagueId)
    .eq('is_published', true)
    .eq('specialty_id', specialtyId)

  const xpByChallenge: Record<string, number> = {}
  for (const c of leagueChallenges ?? []) xpByChallenge[c.id] = c.xp_reward ?? 0
  const challengeIds = Object.keys(xpByChallenge)

  const scoreByUser: Record<string, number> = {}
  if (challengeIds.length === 0) return scoreByUser

  const { data: parts } = await supabaseAdmin
    .from('participations')
    .select('user_id, challenge_id')
    .in('challenge_id', challengeIds)
    .eq('status', 'submitted')

  for (const p of parts ?? []) {
    if (!p.user_id || !p.challenge_id) continue
    scoreByUser[p.user_id] = (scoreByUser[p.user_id] ?? 0) + (xpByChallenge[p.challenge_id] ?? 0)
  }
  return scoreByUser
}

// Promotion auto si seuil XP + min_challenges atteints.
export async function checkAndUpdateLeague(userId: string): Promise<void> {
  // PHASE 2 — scoping encapsulé : on charge specialty_id ici pour que les 4
  // callers n'aient rien à passer (le scoping reste interne à cette fonction).
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('xp, league, specialty_id')
    .eq('id', userId)
    .single()
  if (!profile) return

  // Pas de spécialité → aucun calcul de ligue (on ne plante pas). Les users sans
  // specialty_id (legacy / onboarding non terminé) ne progressent simplement pas
  // tant qu'ils n'ont pas de spé.
  if (!profile.specialty_id) return

  const currentLeagueName = profile.league || 'Stone'
  const currentXP = profile.xp || 0

  const { data: currentLeague } = await supabaseAdmin
    .from('leagues')
    .select('*')
    .eq('name', currentLeagueName)
    .single()
  if (!currentLeague) return

  // Seuil scopé : ne somme que les challenges de la spécialité du user.
  const threshold = await getLeagueThreshold(currentLeague.id, profile.specialty_id)

  const { data: leagueChallenges } = await supabaseAdmin
    .from('challenges')
    .select('id')
    .eq('league_id', currentLeague.id)
    .eq('is_published', true)
    .eq('specialty_id', profile.specialty_id) // PHASE 2 — comptage min_challenges scopé

  const challengeIds = (leagueChallenges ?? []).map((c) => c.id)
  let completedCount = 0
  if (challengeIds.length > 0) {
    const { count } = await supabaseAdmin
      .from('participations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'submitted')
      .in('challenge_id', challengeIds)
    completedCount = count ?? 0
  }

  const minChallenges = currentLeague.min_challenges ?? 3
  const minChallengesEnabled = currentLeague.min_challenges_enabled ?? true
  // ⚠️ PHASE 2 : `threshold` est scopé par spécialité, mais `currentXP` vient de
  // profiles.xp qui est ENCORE GLOBAL (toutes spés confondues). C'est une
  // incohérence temporaire ASSUMÉE : l'isolation de l'XP par spécialité est une
  // phase ultérieure. Ne pas « corriger » ce comparatif comme un bug.
  const meetsXP = threshold === 0 || currentXP >= threshold
  const meetsChallenges = !minChallengesEnabled || completedCount >= minChallenges

  if (!meetsXP || !meetsChallenges) return

  const { data: nextLeague } = await supabaseAdmin
    .from('leagues')
    .select('*')
    .eq('order_index', currentLeague.order_index + 1)
    .eq('is_active', true)
    .maybeSingle()

  if (!nextLeague) return

  await supabaseAdmin
    .from('profiles')
    .update({ league: nextLeague.name, league_entered_at: new Date().toISOString() })
    .eq('id', userId)

  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type: 'league_up',
      data: { old_league: currentLeagueName, new_league: nextLeague.name },
    })
  } catch { /* ignore */ }
}

// Demotion / relegation removed 2026-05-26 — leagues are permanent achievements.
// Only promotion (checkAndUpdateLeague) remains.
