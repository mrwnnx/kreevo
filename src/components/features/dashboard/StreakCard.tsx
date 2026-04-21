import { cn } from '@/lib/utils'

interface StreakCardProps {
  streak: number
  activeDays: boolean[] // 7 éléments, index 0 = lundi, index 6 = dimanche
  todayIndex: number   // index du jour actuel dans la semaine (0=lundi)
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function StreakCard({ streak, activeDays, todayIndex }: StreakCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-sm">
            {streak === 0 ? '0 jour de streak' : `${streak} jour${streak > 1 ? 's' : ''} de streak`}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {streak === 0 ? 'Active-toi aujourd\'hui !' : 'Continue comme ça !'}
          </p>
        </div>
        <span className="text-xl">⚡</span>
      </div>

      {/* 7 jours */}
      <div className="flex items-end justify-between gap-1">
        {DAY_LABELS.map((label, i) => {
          const isToday = i === todayIndex
          const isActive = activeDays[i]

          return (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              <div className={cn(
                'rounded-full transition-all',
                isToday ? 'size-8 border-2 border-primary' : 'size-6',
                isActive
                  ? 'bg-primary'
                  : isToday
                  ? 'bg-primary/10'
                  : 'bg-muted'
              )} />
              <span className={cn(
                'text-[10px] font-mono uppercase',
                isToday ? 'text-primary font-bold' : 'text-muted-foreground'
              )}>
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Streak count */}
      {streak > 0 && (
        <div className="pt-2 border-t border-border flex items-center gap-2">
          <div className="size-6 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-xs">🔥</span>
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{streak} jour{streak > 1 ? 's'  : ''}</span> consécutif{streak > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
