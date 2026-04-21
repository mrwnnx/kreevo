import { createClient } from '@/lib/supabase/server'
import { LeagueBadge } from './LeagueBadge'
import { XPBar } from './XPBar'
import { getLeagueFromXP, getXPForNextLeague, getNextLeague } from '@/lib/utils/xp'
import { LEAGUE_CONFIG } from '@/lib/utils/leagues'
import type { League } from '@/lib/utils/xp'

interface Props {
  xp: number
  userId: string
}

export async function LeagueProgress({ xp, userId }: Props) {
  const supabase = await createClient()

  const league = getLeagueFromXP(xp)
  const nextLeague = getNextLeague(league)
  const xpLeft = getXPForNextLeague(xp)

  const { count } = await (supabase as any)
    .from('profiles')
    .select('id', { count: 'exact', head: true })

  const { count: aboveCount } = await (supabase as any)
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gt('xp', xp)

  const totalUsers = count ?? 1
  const topPercent = Math.round(((aboveCount ?? 0) / totalUsers) * 100)

  return (
    <div className="space-y-4">
      {/* Current league */}
      <div className="flex items-center justify-between">
        <LeagueBadge league={league} size="lg" />
        <span className="text-xs font-mono text-muted-foreground">
          Top {topPercent}% de la communauté
        </span>
      </div>

      {/* XP bar */}
      <XPBar xp={xp} showLabel />

      {/* Next league */}
      {nextLeague && (
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span>Prochain palier</span>
          <div className="flex items-center gap-2">
            <span className="text-foreground font-semibold">{xpLeft.toLocaleString()} XP</span>
            <LeagueBadge league={nextLeague} size="sm" />
          </div>
        </div>
      )}

      {/* Perks of current league */}
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Avantages actuels</p>
        <ul className="space-y-1">
          {LEAGUE_CONFIG[league].perks.map(perk => (
            <li key={perk} className="flex items-center gap-2 text-xs text-foreground">
              <span className="size-1 rounded-full bg-primary shrink-0" />
              {perk}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
