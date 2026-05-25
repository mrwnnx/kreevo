export type LeagueStyle = {
  name: string
  emoji: string
  bgClass: string
  textPrimary: string
  textSecondary: string
  accent: string
  borderClass: string
}

export const LEAGUE_STYLES: Record<string, LeagueStyle> = {
  Stone: {
    name: 'Stone',
    emoji: '🪨',
    bgClass: 'bg-[#FEF3C6] dark:bg-[#322801]',
    textPrimary: 'text-amber-700 dark:text-amber-300',
    textSecondary: 'text-amber-900 dark:text-amber-200',
    accent: 'bg-amber-500',
    borderClass: 'border-amber-500',
  },
  Bronze: {
    name: 'Bronze',
    emoji: '🟤',
    bgClass: 'bg-[#FDECD5] dark:bg-[#311D02]',
    textPrimary: 'text-orange-700 dark:text-orange-300',
    textSecondary: 'text-orange-900 dark:text-orange-200',
    accent: 'bg-orange-500',
    borderClass: 'border-orange-500',
  },
  Silver: {
    name: 'Silver',
    emoji: '⚪',
    bgClass: 'bg-[#F0F0F5] dark:bg-[#14141F]',
    textPrimary: 'text-slate-700 dark:text-slate-300',
    textSecondary: 'text-slate-900 dark:text-slate-200',
    accent: 'bg-slate-500',
    borderClass: 'border-slate-500',
  },
  Gold: {
    name: 'Gold',
    emoji: '🟡',
    bgClass: 'bg-[#FEF7DC] dark:bg-[#322802]',
    textPrimary: 'text-yellow-700 dark:text-yellow-300',
    textSecondary: 'text-yellow-900 dark:text-yellow-200',
    accent: 'bg-yellow-500',
    borderClass: 'border-yellow-500',
  },
  Platinum: {
    name: 'Platinum',
    emoji: '🔵',
    bgClass: 'bg-[#EFF6FF] dark:bg-[#001D33]',
    textPrimary: 'text-sky-700 dark:text-sky-300',
    textSecondary: 'text-sky-900 dark:text-sky-200',
    accent: 'bg-sky-500',
    borderClass: 'border-sky-500',
  },
  Diamond: {
    name: 'Diamond',
    emoji: '💎',
    bgClass: 'bg-[#ECFEFF] dark:bg-[#003033]',
    textPrimary: 'text-cyan-700 dark:text-cyan-300',
    textSecondary: 'text-cyan-900 dark:text-cyan-200',
    accent: 'bg-cyan-500',
    borderClass: 'border-cyan-500',
  },
  Master: {
    name: 'Master',
    emoji: '👑',
    bgClass: 'bg-[#F5F0FF] dark:bg-[#110033]',
    textPrimary: 'text-violet-700 dark:text-violet-300',
    textSecondary: 'text-violet-900 dark:text-violet-200',
    accent: 'bg-violet-500',
    borderClass: 'border-violet-500',
  },
  Legend: {
    name: 'Legend',
    emoji: '🔴',
    bgClass: 'bg-[#FFF1F2] dark:bg-[#330003]',
    textPrimary: 'text-rose-700 dark:text-rose-300',
    textSecondary: 'text-rose-900 dark:text-rose-200',
    accent: 'bg-rose-500',
    borderClass: 'border-rose-500',
  },
}

export const ALL_LEAGUE_STYLES: LeagueStyle[] = [
  LEAGUE_STYLES.Stone,
  LEAGUE_STYLES.Bronze,
  LEAGUE_STYLES.Silver,
  LEAGUE_STYLES.Gold,
  LEAGUE_STYLES.Platinum,
  LEAGUE_STYLES.Diamond,
  LEAGUE_STYLES.Master,
  LEAGUE_STYLES.Legend,
]

export function getLeagueStyle(rawName: string | null | undefined): LeagueStyle {
  if (!rawName) return LEAGUE_STYLES.Stone
  return LEAGUE_STYLES[rawName] ?? LEAGUE_STYLES.Stone
}
