import { TrendingUp } from 'lucide-react'
import { ALL_LEAGUE_STYLES, getLeagueStyle, type LeagueStyle } from '@/lib/utils/league-style'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { LeagueIcon } from '@/components/features/league/LeagueIcon'

function LeagueCardPreview({
  style,
  dbIcon,
  displayName,
}: {
  style: LeagueStyle
  dbIcon: string
  displayName: string
}) {
  const xpPercent = 60
  const currentXP = 4200
  const threshold = 7000

  return (
    <div className={`relative overflow-hidden border-2 ${style.borderClass} rounded-[24px] p-4 ${style.bgClass}`}>
      <div className="relative">
        <p className={`text-xs font-bold ${style.textPrimary} uppercase tracking-widest mb-3`}>
          YOUR LEAGUE
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/60 dark:bg-white/10 rounded-xl flex items-center justify-center">
              <LeagueIcon icon={dbIcon} size="lg" />
            </div>
            <h3 className="text-xl font-bold text-foreground">{displayName} League</h3>
          </div>
        </div>

        <div className="mb-3">
          <div className={`flex justify-between text-xs ${style.textSecondary} opacity-70 mb-1.5`}>
            <span>Tier progress</span>
            <span>
              {currentXP.toLocaleString()} / {threshold.toLocaleString()} XP
            </span>
          </div>
          <div className="h-2.5 bg-white/50 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full ${style.accent} rounded-full transition-all duration-700`}
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-2 bg-white dark:bg-white/10 rounded-lg">
          <div className="flex items-center gap-1.5 text-sm">
            <TrendingUp className={`w-4 h-4 ${style.textPrimary}`} />
            <span className={`font-semibold ${style.textSecondary}`}>Rank #12 of 50</span>
          </div>
          <span className={`text-xs ${style.textPrimary} font-medium`}>
            Push to top 10 🔥
          </span>
        </div>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'

export default async function LeaguesPreviewPage() {
  const { data: dbLeagues } = await (supabaseAdmin as any)
    .from('leagues')
    .select('name, icon')
    .order('order_index')

  const iconByName = new Map<string, string>()
  for (const l of (dbLeagues ?? []) as Array<{ name: string; icon: string }>) {
    iconByName.set(l.name, l.icon)
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Leagues preview</h1>
        <p className="text-sm text-muted-foreground">
          Visual reference of the &quot;Your League&quot; card across the 8 tiers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ALL_LEAGUE_STYLES.map(style => {
          const dbIcon = iconByName.get(style.name) ?? style.emoji
          return (
            <LeagueCardPreview
              key={style.name}
              style={getLeagueStyle(style.name)}
              dbIcon={dbIcon}
              displayName={style.name}
            />
          )
        })}
      </div>
    </div>
  )
}
