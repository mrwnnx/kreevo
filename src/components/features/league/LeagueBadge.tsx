import { cn } from '@/lib/utils'
import { LEAGUE_CONFIG } from '@/lib/utils/leagues'
import type { League } from '@/lib/utils/xp'

interface Props {
  league: League
  size?: 'sm' | 'md' | 'lg'
}

const SIZE = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-3 py-1 gap-1.5',
  lg: 'text-base px-4 py-1.5 gap-2',
}

export function LeagueBadge({ league, size = 'md' }: Props) {
  const config = LEAGUE_CONFIG[league] ?? LEAGUE_CONFIG.rookie

  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-mono font-semibold text-white',
      'bg-gradient-to-r',
      config.gradient,
      SIZE[size]
    )}>
      <span>{config.icon}</span>
      <span>{config.name}</span>
    </span>
  )
}
