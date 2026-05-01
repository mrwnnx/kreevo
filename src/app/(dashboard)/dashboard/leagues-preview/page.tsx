import { TrendingUp } from 'lucide-react'

type LeaguePreview = {
  name: string
  emoji: string
  bgClass: string
  textPrimary: string
  textSecondary: string
  accent: string
}

const LEAGUES: LeaguePreview[] = [
  {
    name: 'Stone',
    emoji: '🪨',
    bgClass: 'bg-[#FEF3C6] dark:bg-[#322801]',
    textPrimary: 'text-amber-700 dark:text-amber-300',
    textSecondary: 'text-amber-900 dark:text-amber-200',
    accent: 'bg-amber-500',
  },
  {
    name: 'Bronze',
    emoji: '🟤',
    bgClass: 'bg-[#FDECD5] dark:bg-[#311D02]',
    textPrimary: 'text-orange-700 dark:text-orange-300',
    textSecondary: 'text-orange-900 dark:text-orange-200',
    accent: 'bg-orange-500',
  },
  {
    name: 'Silver',
    emoji: '⚪',
    bgClass: 'bg-[#F0F0F5] dark:bg-[#14141F]',
    textPrimary: 'text-slate-700 dark:text-slate-300',
    textSecondary: 'text-slate-900 dark:text-slate-200',
    accent: 'bg-slate-500',
  },
  {
    name: 'Gold',
    emoji: '🟡',
    bgClass: 'bg-[#FEF7DC] dark:bg-[#322802]',
    textPrimary: 'text-yellow-700 dark:text-yellow-300',
    textSecondary: 'text-yellow-900 dark:text-yellow-200',
    accent: 'bg-yellow-500',
  },
  {
    name: 'Platinum',
    emoji: '🔵',
    bgClass: 'bg-[#EFF6FF] dark:bg-[#001D33]',
    textPrimary: 'text-sky-700 dark:text-sky-300',
    textSecondary: 'text-sky-900 dark:text-sky-200',
    accent: 'bg-sky-500',
  },
  {
    name: 'Diamond',
    emoji: '💎',
    bgClass: 'bg-[#ECFEFF] dark:bg-[#003033]',
    textPrimary: 'text-cyan-700 dark:text-cyan-300',
    textSecondary: 'text-cyan-900 dark:text-cyan-200',
    accent: 'bg-cyan-500',
  },
  {
    name: 'Master',
    emoji: '👑',
    bgClass: 'bg-[#F5F0FF] dark:bg-[#110033]',
    textPrimary: 'text-violet-700 dark:text-violet-300',
    textSecondary: 'text-violet-900 dark:text-violet-200',
    accent: 'bg-violet-500',
  },
  {
    name: 'Legend',
    emoji: '🔴',
    bgClass: 'bg-[#FFF1F2] dark:bg-[#330003]',
    textPrimary: 'text-rose-700 dark:text-rose-300',
    textSecondary: 'text-rose-900 dark:text-rose-200',
    accent: 'bg-rose-500',
  },
]

function LeagueCardPreview({ league }: { league: LeaguePreview }) {
  const xpPercent = 60
  const currentXP = 4200
  const threshold = 7000

  return (
    <div className={`relative overflow-hidden border border-border rounded-[16px] p-4 ${league.bgClass}`}>
      <div className="relative">
        <p className={`text-xs font-bold ${league.textPrimary} uppercase tracking-widest mb-3`}>
          YOUR LEAGUE
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/60 dark:bg-white/10 rounded-xl flex items-center justify-center text-xl">
              {league.emoji}
            </div>
            <h3 className="text-xl font-bold text-foreground">{league.name} League</h3>
          </div>
        </div>

        <div className="mb-3">
          <div className={`flex justify-between text-xs ${league.textSecondary} opacity-70 mb-1.5`}>
            <span>Tier progress</span>
            <span>
              {currentXP.toLocaleString()} / {threshold.toLocaleString()} XP
            </span>
          </div>
          <div className="h-2.5 bg-white/50 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full ${league.accent} rounded-full transition-all duration-700`}
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-2 bg-white dark:bg-white/10 rounded-lg">
          <div className="flex items-center gap-1.5 text-sm">
            <TrendingUp className={`w-4 h-4 ${league.textPrimary}`} />
            <span className={`font-semibold ${league.textSecondary}`}>Rank #12 of 50</span>
          </div>
          <span className={`text-xs ${league.textPrimary} font-medium`}>
            Push to top 10 🔥
          </span>
        </div>
      </div>
    </div>
  )
}

export default function LeaguesPreviewPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Leagues preview</h1>
        <p className="text-sm text-muted-foreground">
          Visual reference of the &quot;Your League&quot; card across the 8 tiers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {LEAGUES.map(league => (
          <LeagueCardPreview key={league.name} league={league} />
        ))}
      </div>
    </div>
  )
}
