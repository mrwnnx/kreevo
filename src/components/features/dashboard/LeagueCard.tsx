import Link from 'next/link'
import { Lock, Trophy } from 'lucide-react'
import { leagueColor } from '@/lib/utils/xp'
import type { League } from '@/lib/utils/xp'
import { LeagueIcon } from '@/components/features/league/LeagueIcon'

const LEAGUE_GRADIENT: Record<string, string> = {
  // Old system
  rookie:  'from-stone-400 to-stone-600',
  rising:  'from-slate-400 to-slate-600',
  pro:     'from-yellow-400 to-yellow-600',
  elite:   'from-blue-400 to-blue-600',
  legend:  'from-pink-500 to-red-600',
  // New system
  Stone:    'from-stone-400 to-stone-600',
  Bronze:   'from-orange-400 to-orange-700',
  Silver:   'from-slate-300 to-slate-500',
  Gold:     'from-yellow-400 to-yellow-600',
  Platinum: 'from-cyan-300 to-cyan-600',
  Diamond:  'from-blue-300 to-blue-600',
  Master:   'from-violet-500 to-violet-700',
  Legend:   'from-pink-500 to-red-600',
}

const LEAGUE_EMOJI: Record<string, string> = {
  // Old system
  rookie:  '🎯',
  rising:  '⬆️',
  pro:     '⭐',
  elite:   '💎',
  legend:  '👑',
  // New system
  Stone:    '🪨',
  Bronze:   '🟤',
  Silver:   '⚪',
  Gold:     '🟡',
  Platinum: '🔵',
  Diamond:  '💎',
  Master:   '👑',
  Legend:   '🔴',
}

interface LeagueCardProps {
  league: string
  xp: number
  plan: string
  leagueIcon?: string
  leagueDbColor?: string
  xpThreshold?: number
  challengesCompleted?: number
  minChallenges?: number
  nextLeagueName?: string
  nextLeagueIcon?: string
}

export function LeagueCard({
  league, xp, plan,
  leagueIcon, leagueDbColor,
  xpThreshold, challengesCompleted, minChallenges,
  nextLeagueName, nextLeagueIcon,
}: LeagueCardProps) {
  const isPro = plan === 'pro' || plan === 'studio'
  const gradient = LEAGUE_GRADIENT[league] ?? 'from-slate-400 to-slate-600'
  const emoji = LEAGUE_EMOJI[league] ?? '🏆'
  const color = leagueDbColor ?? leagueColor(league as League)

  const hasNewSystem = xpThreshold !== undefined && xpThreshold > 0
  const xpPercent = hasNewSystem ? Math.min(100, Math.round((xp / xpThreshold!) * 100)) : 0
  const challengesPercent = minChallenges
    ? Math.min(100, Math.round(((challengesCompleted ?? 0) / minChallenges) * 100))
    : 0

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-sm">Ma ligue</h3>
        <div className={`size-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
          <LeagueIcon icon={leagueIcon ?? emoji} size="xl" />
        </div>
      </div>

      {/* League name */}
      <div>
        <p className="text-2xl font-bold" style={{ color }}>
          {league}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{xp.toLocaleString()} XP total</p>
      </div>

      {/* Dual progress */}
      {hasNewSystem && nextLeagueName ? (
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            Vers
            {nextLeagueIcon && <LeagueIcon icon={nextLeagueIcon} size="sm" />}
            <span>{nextLeagueName}</span>
          </div>

          {/* XP progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">XP</span>
              <span className="font-mono font-semibold text-primary">{xp.toLocaleString()} / {xpThreshold!.toLocaleString()}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Challenges progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Trophy className="size-3" /> Challenges
              </span>
              <span className="font-mono font-semibold">{challengesCompleted ?? 0} / {minChallenges}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${challengesPercent}%` }}
              />
            </div>
          </div>

          {xpPercent >= 100 && challengesPercent >= 100 && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ Conditions remplies — tu monteras à la prochaine remontée !
            </p>
          )}
        </div>
      ) : !isPro ? (
        /* Lock pour free (old system) */
        <div className="pt-2 border-t border-border space-y-3">
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <Lock className="size-4 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              Passe en Pro pour accéder aux ligues supérieures
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="flex items-center justify-center w-full rounded-full bg-primary text-primary-foreground text-sm font-semibold py-2 hover:opacity-85 transition-opacity"
          >
            Upgrade
          </Link>
        </div>
      ) : null}
    </div>
  )
}
