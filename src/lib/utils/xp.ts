// Ligues dynamiques depuis la table `leagues` (Supabase).
// La DB enforce les 8 noms canoniques via le CHECK `profiles_league_valid`.

export const XP_REWARDS = {
  like_received:     2,
  comment_received:  5,
  comment_given:    10,
} as const

export const XP_PENALTIES = {
  no_submission: -100,
} as const

export type XPAction = keyof typeof XP_REWARDS

export const LEAGUE_COLORS: Record<string, string> = {
  'Stone':    '#8B8B8B',
  'Bronze':   '#CD7F32',
  'Silver':   '#C0C0C0',
  'Gold':     '#FFD700',
  'Platinum': '#E5E4E2',
  'Diamond':  '#B9F2FF',
  'Master':   '#7C3AED',
  'Legend':   '#DC2626',
}

export const LEAGUE_ICONS: Record<string, string> = {
  'Stone':    '🪨',
  'Bronze':   '🟤',
  'Silver':   '⚪',
  'Gold':     '🟡',
  'Platinum': '🔵',
  'Diamond':  '💎',
  'Master':   '👑',
  'Legend':   '🔴',
}

export function getLeagueColor(name: string | null | undefined): string {
  return LEAGUE_COLORS[name ?? ''] ?? '#8B8B8B'
}

export function getLeagueIcon(name: string | null | undefined): string {
  return LEAGUE_ICONS[name ?? ''] ?? '🪨'
}

export function getLeagueLabel(name: string | null | undefined): string {
  return name ?? 'Stone'
}

// Backwards-compat aliases (anciens noms d'API)
export const leagueLabel = getLeagueLabel
export const leagueColor = getLeagueColor
export const leagueIcon = getLeagueIcon
