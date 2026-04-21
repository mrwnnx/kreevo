import Link from 'next/link'
import { Lock } from 'lucide-react'
import { leagueLabel, leagueColor, getLeagueProgress, getXPForNextLeague, getNextLeague } from '@/lib/utils/xp'
import type { League } from '@/lib/utils/xp'

const LEAGUE_GRADIENT: Record<League, string> = {
  rookie:  'from-stone-400 to-stone-600',
  rising:  'from-slate-400 to-slate-600',
  pro:     'from-yellow-400 to-yellow-600',
  elite:   'from-blue-400 to-blue-600',
  legend:  'from-pink-500 to-red-600',
}

const LEAGUE_EMOJI: Record<League, string> = {
  rookie:  '🪨',
  rising:  '⬆️',
  pro:     '⭐',
  elite:   '💎',
  legend:  '👑',
}

interface LeagueCardProps {
  league: League
  xp: number
  plan: string
}

export function LeagueCard({ league, xp, plan }: LeagueCardProps) {
  const isPro = plan === 'pro' || plan === 'studio'
  const progress = getLeagueProgress(xp)
  const xpToNext = getXPForNextLeague(xp)
  const nextLeague = getNextLeague(league)

  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const daysLeft = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-sm">Ma ligue</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''} ce mois
          </p>
        </div>
        {/* League badge */}
        <div className={`size-12 rounded-2xl bg-gradient-to-br ${LEAGUE_GRADIENT[league]} flex items-center justify-center text-2xl shadow-sm`}>
          {LEAGUE_EMOJI[league]}
        </div>
      </div>

      {/* League name */}
      <div>
        <p className="text-2xl font-bold" style={{ color: leagueColor(league) }}>
          {leagueLabel(league)}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{xp.toLocaleString()} XP total</p>
      </div>

      {isPro && nextLeague ? (
        /* Progression vers ligue suivante */
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Vers {leagueLabel(nextLeague)}</span>
            <span className="font-mono font-semibold text-primary">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{xpToNext.toLocaleString()} XP restants</p>
        </div>
      ) : !isPro ? (
        /* Lock pour free */
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
