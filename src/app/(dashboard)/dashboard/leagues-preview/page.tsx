import { TrendingUp } from 'lucide-react'
import { ALL_LEAGUE_STYLES, type LeagueStyle } from '@/lib/utils/league-style'

function LeagueCardPreview({ league }: { league: LeagueStyle }) {
  const xpPercent = 60
  const currentXP = 4200
  const threshold = 7000

  return (
    <div className={`relative overflow-hidden border-2 ${league.borderClass} rounded-[24px] p-4 ${league.bgClass}`}>
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
        {ALL_LEAGUE_STYLES.map(league => (
          <LeagueCardPreview key={league.name} league={league} />
        ))}
      </div>
    </div>
  )
}
