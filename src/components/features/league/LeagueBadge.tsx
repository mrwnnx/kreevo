import { cn } from '@/lib/utils'
import { getLeagueColor, getLeagueIcon, getLeagueLabel } from '@/lib/utils/xp'

interface Props {
  league: string | null | undefined
  size?: 'sm' | 'md' | 'lg'
}

const SIZE = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-3 py-1 gap-1.5',
  lg: 'text-base px-4 py-1.5 gap-2',
}

export function LeagueBadge({ league, size = 'md' }: Props) {
  const label = getLeagueLabel(league)
  const icon = getLeagueIcon(league)
  const color = getLeagueColor(league)

  return (
    <span
      className={cn('inline-flex items-center rounded-full font-mono font-semibold text-white', SIZE[size])}
      style={{ backgroundColor: color }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  )
}
