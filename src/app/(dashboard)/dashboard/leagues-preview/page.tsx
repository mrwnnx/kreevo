import { TrendingUp } from 'lucide-react'

type LeaguePreview = {
  name: string
  emoji: string
  bg: string
  textPrimary: string
  textSecondary: string
  accent: string
}

const LEAGUES: LeaguePreview[] = [
  {
    name: 'Stone',
    emoji: '🪨',
    bg: '#FEF3C6',
    textPrimary: 'text-amber-700',
    textSecondary: 'text-amber-900',
    accent: 'bg-amber-500',
  },
  {
    name: 'Bronze',
    emoji: '🟤',
    bg: '#FDECD5',
    textPrimary: 'text-orange-700',
    textSecondary: 'text-orange-900',
    accent: 'bg-orange-500',
  },
  {
    name: 'Silver',
    emoji: '⚪',
    bg: '#F0F0F5',
    textPrimary: 'text-slate-700',
    textSecondary: 'text-slate-900',
    accent: 'bg-slate-500',
  },
  {
    name: 'Gold',
    emoji: '🟡',
    bg: '#FEF7DC',
    textPrimary: 'text-yellow-700',
    textSecondary: 'text-yellow-900',
    accent: 'bg-yellow-500',
  },
  {
    name: 'Platinum',
    emoji: '🔵',
    bg: '#EFF6FF',
    textPrimary: 'text-sky-700',
    textSecondary: 'text-sky-900',
    accent: 'bg-sky-500',
  },
  {
    name: 'Diamond',
    emoji: '💎',
    bg: '#ECFEFF',
    textPrimary: 'text-cyan-700',
    textSecondary: 'text-cyan-900',
    accent: 'bg-cyan-500',
  },
  {
    name: 'Master',
    emoji: '👑',
    bg: '#F5F0FF',
    textPrimary: 'text-violet-700',
    textSecondary: 'text-violet-900',
    accent: 'bg-violet-500',
  },
  {
    name: 'Legend',
    emoji: '🔴',
    bg: '#FFF1F2',
    textPrimary: 'text-rose-700',
    textSecondary: 'text-rose-900',
    accent: 'bg-rose-500',
  },
]

function LeagueCardPreview({ league }: { league: LeaguePreview }) {
  const xpPercent = 60
  const currentXP = 4200
  const threshold = 7000

  return (
    <div
      className="relative overflow-hidden border border-border rounded-2xl p-5"
      style={{ backgroundColor: league.bg }}
    >
      <div className="relative">
        <p className={`text-xs font-bold ${league.textPrimary} uppercase tracking-widest mb-3`}>
          YOUR LEAGUE
        </p>

        <div className="flex items-center justify-between p-2 bg-white rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center text-xl">
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
          <div className="h-2.5 bg-white/50 rounded-full overflow-hidden">
            <div
              className={`h-full ${league.accent} rounded-full transition-all duration-700`}
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
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
          Visual reference of the “Your League” card across the 8 tiers.
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
