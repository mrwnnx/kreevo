import { cn } from '@/lib/utils'
import { getLeagueFromXP, getLeagueProgress, getXPForNextLeague, leagueLabel } from '@/lib/utils/xp'

interface Props {
  xp: number
  showLabel?: boolean
  className?: string
}

export function XPBar({ xp, showLabel = false, className }: Props) {
  const progress = getLeagueProgress(xp)
  const league = getLeagueFromXP(xp)
  const xpLeft = getXPForNextLeague(xp)
  const isMax = xpLeft === 0

  return (
    <div className={cn('space-y-1', className)}>
      <div className="relative h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-[11px] font-mono text-muted-foreground">
          <span className="text-foreground">{xp.toLocaleString()}</span>
          {!isMax && (
            <> XP · <span className="text-foreground">{xpLeft.toLocaleString()}</span> pour {leagueLabel(getNextLeagueName(league))}</>
          )}
          {isMax && <> XP · <span className="text-foreground">{leagueLabel(league)}</span> max</>}
        </p>
      )}
    </div>
  )
}

function getNextLeagueName(league: string): string {
  const order = ['rookie', 'rising', 'pro', 'elite', 'legend']
  const idx = order.indexOf(league)
  return idx < order.length - 1 ? order[idx + 1] : league
}
