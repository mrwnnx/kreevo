import { Trophy, Zap, Target } from 'lucide-react'
import type { ReactNode } from 'react'
import { LeagueIcon } from '@/components/features/league/LeagueIcon'
import { tx } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type Props = {
  profile: any
  streak: any
  completedTotal: number
  completedThisWeek: number
  xpToday: number
  leagueIndex: number
  userLeague?: { name?: string; icon?: string } | null
  t: Dictionary['dashboard']['statCards']
}

export function StatCards({
  profile,
  streak,
  completedTotal,
  completedThisWeek,
  xpToday,
  leagueIndex,
  userLeague,
  t,
}: Props) {
  const leagueName = userLeague?.name || (profile?.league === '7ajra' ? 'Stone' : profile?.league) || 'Stone'
  const leagueIcon = userLeague?.icon || '🪨'
  const stats: Array<{
    label: string
    icon: ReactNode
    value: ReactNode
    subtext: string
    valueClass: string
  }> = [
    {
      label: t.league,
      icon: <Trophy className="w-4 h-4 text-amber-500" />,
      value: (
        <span className="inline-flex items-center gap-2">
          <LeagueIcon icon={leagueIcon} size="lg" />
          {leagueName}
        </span>
      ),
      subtext: tx(t.tierOf, { n: leagueIndex }),
      valueClass: 'text-xl font-bold',
    },
    {
      label: t.totalXp,
      icon: <Zap className="w-4 h-4 text-violet-500" />,
      value: (profile?.xp || 0).toLocaleString(),
      subtext: xpToday > 0 ? tx(t.xpToday, { n: xpToday }) : t.keepGoing,
      valueClass: 'text-xl font-bold text-violet-600',
    },
    {
      label: t.challenges,
      icon: <Target className="w-4 h-4 text-green-500" />,
      value: (completedTotal || 0).toString(),
      subtext: completedThisWeek > 0 ? tx(t.thisWeek, { n: completedThisWeek }) : t.completeFirst,
      valueClass: 'text-xl font-bold text-green-500',
    },
    {
      label: t.streak,
      icon: <span className="text-base leading-none">🔥</span>,
      value: `${streak?.current_streak || 0}d`,
      subtext:
        streak?.current_streak === streak?.longest_streak && streak?.current_streak > 0
          ? t.personalBest
          : tx(t.best, { n: streak?.longest_streak || 0 }),
      valueClass: 'text-xl font-bold text-orange-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(stat => (
        <div
          key={stat.label}
          className="h-full flex flex-col justify-between gap-4 bg-card border border-border rounded-[24px] p-4 hover:shadow-sm transition-shadow duration-200"
        >
          <div className="flex items-center justify-between h-5">
            <span className="text-xs font-bold text-foreground tracking-widest leading-none">
              {stat.label}
            </span>
            <span className="inline-flex items-center justify-center w-5 h-5 shrink-0">
              {stat.icon}
            </span>
          </div>
          <p className={stat.valueClass}>{stat.value}</p>
        </div>
      ))}
    </div>
  )
}
