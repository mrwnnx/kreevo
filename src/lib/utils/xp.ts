export type League = 'rookie' | 'rising' | 'pro' | 'elite' | 'legend'

export const LEAGUE_THRESHOLDS: Record<League, number> = {
  rookie:  0,
  rising:  500,
  pro:     1500,
  elite:   3500,
  legend:  7000,
}

export const LEAGUE_COLORS: Record<League, string> = {
  rookie:  'from-stone-600 to-stone-400',
  rising:  'from-slate-500 to-slate-300',
  pro:     'from-yellow-600 to-yellow-400',
  elite:   'from-blue-600 to-blue-400',
  legend:  'from-red-600 to-pink-500',
}

export const XP_REWARDS = {
  submission_complete:   150,
  joined_challenge:       50,
  top_10:               100,
  top_3:                200,
  top_1:                350,
  comment_received:       5,
  like_received:          2,
  random_brief_complete:  50,
  random_brief_shared:    20,
  comment_given:          25,
  deadline_missed:       -50,
  brief_expired:         -50,
} as const

export type XPAction = keyof typeof XP_REWARDS

const LEAGUE_ORDER: League[] = ['rookie', 'rising', 'pro', 'elite', 'legend']

export function getLeagueFromXP(xp: number): League {
  for (let i = LEAGUE_ORDER.length - 1; i >= 0; i--) {
    if (xp >= LEAGUE_THRESHOLDS[LEAGUE_ORDER[i]]) return LEAGUE_ORDER[i]
  }
  return 'rookie'
}

export function getXPForNextLeague(xp: number): number {
  const current = getLeagueFromXP(xp)
  const idx = LEAGUE_ORDER.indexOf(current)
  if (idx === LEAGUE_ORDER.length - 1) return 0
  const next = LEAGUE_ORDER[idx + 1]
  return LEAGUE_THRESHOLDS[next] - xp
}

export function getLeagueProgress(xp: number): number {
  const current = getLeagueFromXP(xp)
  const idx = LEAGUE_ORDER.indexOf(current)
  if (idx === LEAGUE_ORDER.length - 1) return 100
  const currentThreshold = LEAGUE_THRESHOLDS[current]
  const nextThreshold = LEAGUE_THRESHOLDS[LEAGUE_ORDER[idx + 1]]
  return Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
}

export function getNextLeague(league: League): League | null {
  const idx = LEAGUE_ORDER.indexOf(league)
  return idx < LEAGUE_ORDER.length - 1 ? LEAGUE_ORDER[idx + 1] : null
}

// ── Legacy helpers (used in Sidebar / profile pages) ──────────────

const LEVEL_XP_BASE = 100
const LEVEL_XP_MULTIPLIER = 1.5

function xpToNextLevel(level: number): number {
  return Math.floor(LEVEL_XP_BASE * Math.pow(LEVEL_XP_MULTIPLIER, level - 1))
}

function totalXpForLevel(level: number): number {
  let total = 0
  for (let i = 1; i < level; i++) total += xpToNextLevel(i)
  return total
}

export function levelFromXp(xp: number): number {
  let level = 1
  let accumulated = 0
  while (accumulated + xpToNextLevel(level) <= xp) {
    accumulated += xpToNextLevel(level)
    level++
  }
  return level
}

export function xpProgressInCurrentLevel(xp: number): { current: number; required: number; percent: number } {
  const level = levelFromXp(xp)
  const xpAtLevelStart = totalXpForLevel(level)
  const current = xp - xpAtLevelStart
  const required = xpToNextLevel(level)
  return { current, required, percent: Math.round((current / required) * 100) }
}

export function leagueLabel(league: string): string {
  const labels: Record<string, string> = {
    rookie: 'Rookie', rising: 'Rising', pro: 'Pro', elite: 'Elite', legend: 'Legend',
  }
  return labels[league] ?? league.charAt(0).toUpperCase() + league.slice(1)
}

export function leagueColor(league: string): string {
  const colors: Record<string, string> = {
    rookie:  '#78716c',
    rising:  '#94a3b8',
    pro:     '#ca8a04',
    elite:   '#2563eb',
    legend:  '#e11d48',
  }
  return colors[league] ?? '#94a3b8'
}

// Keep legacy alias
export { getLeagueFromXP as leagueFromXp }
