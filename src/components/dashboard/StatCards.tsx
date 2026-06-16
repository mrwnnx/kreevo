import { Trophy, Target, Medal } from 'lucide-react'
import { XpIcon } from '@/components/ui/XpIcon'
import type { ReactNode } from 'react'
import { LeagueIcon } from '@/components/features/league/LeagueIcon'
import { tx } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'
import { StatCard } from './StatCard'

type Props = {
  profile: any
  userRank: number
  totalInLeague: number
  completedTotal: number
  completedThisWeek: number
  xpToday: number
  leagueIndex: number
  userLeague?: { name?: string; icon?: string } | null
  t: Dictionary['dashboard']['statCards']
}

export function StatCards({
  profile,
  userRank,
  totalInLeague,
  completedTotal,
  completedThisWeek,
  xpToday,
  leagueIndex,
  userLeague,
  t,
}: Props) {
  const leagueName = userLeague?.name || profile?.league || 'Stone'
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
      valueClass: '',
    },
    {
      label: t.totalXp,
      icon: <XpIcon className="w-4 h-4" />,
      value: (profile?.xp || 0).toLocaleString(),
      subtext: xpToday > 0 ? tx(t.xpToday, { n: xpToday }) : t.keepGoing,
      valueClass: 'text-violet-600',
    },
    {
      label: t.challenges,
      icon: <Target className="w-4 h-4 text-green-500" />,
      value: (completedTotal || 0).toString(),
      subtext: completedThisWeek > 0 ? tx(t.thisWeek, { n: completedThisWeek }) : t.completeFirst,
      valueClass: 'text-green-500',
    },
    {
      label: t.rank,
      icon: <Medal className="w-4 h-4 text-sky-500" />,
      value: userRank && totalInLeague ? tx(t.rankValue, { rank: userRank, total: totalInLeague }) : '—',
      subtext: t.rankSubtext,
      valueClass: 'text-sky-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(stat => (
        <StatCard
          key={stat.label}
          label={stat.label}
          icon={stat.icon}
          value={stat.value}
          valueClass={stat.valueClass}
        />
      ))}
    </div>
  )
}
