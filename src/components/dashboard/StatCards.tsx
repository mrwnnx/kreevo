import { Trophy, Zap, Target } from 'lucide-react'

const LEAGUE_ICONS: Record<string, string> = {
  Stone: '🪨', '7ajra': '🪨', Bronze: '🟤', Silver: '⚪',
  Gold: '🟡', Platinum: '🔵', Diamond: '💎',
  Master: '👑', Legend: '🔴',
}

type Props = {
  profile: any
  streak: any
  completedTotal: number
  completedThisWeek: number
  xpToday: number
  leagueIndex: number
}

export function StatCards({
  profile,
  streak,
  completedTotal,
  completedThisWeek,
  xpToday,
  leagueIndex,
}: Props) {
  const leagueName = profile?.league || 'Stone'
  const stats = [
    {
      label: 'LEAGUE',
      icon: <Trophy className="w-4 h-4 text-amber-500" />,
      value: `${LEAGUE_ICONS[leagueName] || '🪨'} ${leagueName === '7ajra' ? 'Stone' : leagueName}`,
      subtext: `Tier ${leagueIndex} of 8`,
      valueClass: 'text-3xl font-bold',
    },
    {
      label: 'TOTAL XP',
      icon: <Zap className="w-4 h-4 text-violet-500" />,
      value: (profile?.xp || 0).toLocaleString(),
      subtext: xpToday > 0 ? `+${xpToday} XP today` : 'Keep going!',
      valueClass: 'text-3xl font-bold text-violet-600',
    },
    {
      label: 'STREAK',
      icon: <span className="text-base leading-none">🔥</span>,
      value: `${streak?.current_streak || 0}d`,
      subtext:
        streak?.current_streak === streak?.longest_streak && streak?.current_streak > 0
          ? 'Personal best 🏆'
          : `Best: ${streak?.longest_streak || 0}d`,
      valueClass: 'text-3xl font-bold text-orange-500',
    },
    {
      label: 'CHALLENGES',
      icon: <Target className="w-4 h-4 text-green-500" />,
      value: (completedTotal || 0).toString(),
      subtext: completedThisWeek > 0 ? `+${completedThisWeek} this week` : 'Complete your first!',
      valueClass: 'text-3xl font-bold text-green-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(stat => (
        <div
          key={stat.label}
          className="flex flex-col gap-4 bg-card border border-border rounded-2xl p-5 hover:shadow-sm transition-shadow duration-200"
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
