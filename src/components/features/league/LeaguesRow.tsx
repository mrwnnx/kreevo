'use client'

import { LeagueIcon } from '@/components/features/league/LeagueIcon'
import { cn } from '@/lib/utils'

interface League {
  id: string
  name: string
  icon: string
  color: string
  order_index: number
}

interface Props {
  leagues: League[]
  userLeagueIndex: number
}

const SMALL_SLOT_WIDTH = 80

export function LeaguesRow({ leagues, userLeagueIndex }: Props) {
  const sorted = [...leagues].sort((a, b) => a.order_index - b.order_index)
  const activeIdx = sorted.findIndex((l) => l.order_index === userLeagueIndex)

  const pastCount = activeIdx >= 0 ? activeIdx : 0
  const futureCount = activeIdx >= 0 ? sorted.length - 1 - activeIdx : 0

  // Spacers to keep the active league at the visual center of the row
  const leftSpacers = Math.max(0, futureCount - pastCount)
  const rightSpacers = Math.max(0, pastCount - futureCount)

  const Spacer = () => (
    <div className="shrink-0" style={{ width: SMALL_SLOT_WIDTH }} aria-hidden />
  )

  return (
    // Full-bleed: escape parent's max-width, span full viewport, no scroll/clip
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-x-clip">
      <div className="flex items-center justify-center gap-8 py-2">
        {Array.from({ length: leftSpacers }).map((_, i) => (
          <Spacer key={`l-${i}`} />
        ))}

        {sorted.map((league) => {
          const isActive = league.order_index === userLeagueIndex
          const isLocked = league.order_index > userLeagueIndex
          const isPast = league.order_index < userLeagueIndex

          if (isActive) {
            return (
              <div key={league.id} className="shrink-0">
                <div className="size-32 mx-auto flex items-center justify-center">
                  <LeagueIcon
                    icon={league.icon}
                    size="xl"
                    className="size-28 text-7xl"
                  />
                </div>
              </div>
            )
          }

          return (
            <div key={league.id} className="shrink-0">
              <div
                className="relative rounded-full bg-muted flex items-center justify-center"
                style={{
                  width: SMALL_SLOT_WIDTH,
                  height: SMALL_SLOT_WIDTH,
                  opacity: isLocked ? 0.5 : isPast ? 0.7 : 1,
                }}
              >
                <LeagueIcon
                  icon={league.icon}
                  size="lg"
                  className={cn('size-12 text-4xl', isLocked && 'grayscale')}
                />
              </div>
            </div>
          )
        })}

        {Array.from({ length: rightSpacers }).map((_, i) => (
          <Spacer key={`r-${i}`} />
        ))}
      </div>
    </div>
  )
}
