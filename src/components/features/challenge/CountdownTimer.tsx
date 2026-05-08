'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

interface CountdownTimerProps {
  deadline: string
  label?: string
  onExpired?: () => void
  compact?: boolean
  t?: Dictionary['challengeDetail']['countdown']
}

const FALLBACK_T: Dictionary['challengeDetail']['countdown'] = {
  expired: '⏰ Délai expiré',
  days: 'jours',
  hours: 'h',
  min: 'min',
  sec: 'sec',
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function calc(deadline: string): TimeLeft {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  return {
    total: diff,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

function pad(n: number) { return String(n).padStart(2, '0') }

export function CountdownTimer({ deadline, label, onExpired, compact = false, t = FALLBACK_T }: CountdownTimerProps) {
  const [time, setTime] = useState<TimeLeft | null>(null)
  const [fired, setFired] = useState(false)

  useEffect(() => {
    setTime(calc(deadline))
    const tick = setInterval(() => {
      const t = calc(deadline)
      setTime(t)
      if (t.total === 0 && !fired) {
        setFired(true)
        onExpired?.()
        clearInterval(tick)
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [deadline, fired, onExpired])

  if (!time) {
    return compact
      ? <span className="font-mono text-xs font-semibold text-muted-foreground">--h --m --s</span>
      : <div className="h-10" />
  }

  const isExpired = time.total === 0
  const isUrgent = time.total > 0 && time.total < 3600000       // < 1h
  const isWarning = time.total > 0 && time.total < 86400000     // < 24h

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-mono font-bold text-red-500">
        {t.expired}
      </span>
    )
  }

  const colorClass = isUrgent
    ? 'text-red-500 animate-pulse'
    : isWarning
    ? 'text-orange-500'
    : 'text-foreground'

  if (compact) {
    return (
      <span className={cn('font-mono text-xs font-semibold', colorClass)}>
        {time.days > 0 && `${time.days}${t.days.charAt(0)} `}{pad(time.hours)}{t.hours} {pad(time.minutes)}m {pad(time.seconds)}s
      </span>
    )
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-xs text-muted-foreground">{label}</p>}
      <div className={cn('flex items-end gap-2', colorClass)}>
        {time.days > 0 && (
          <div className="text-center">
            <div className="font-mono text-2xl font-bold leading-none bg-muted rounded-lg px-3 py-2 min-w-[52px] text-center">
              {pad(time.days)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase">{t.days}</p>
          </div>
        )}
        <div className="text-center">
          <div className="font-mono text-2xl font-bold leading-none bg-muted rounded-lg px-3 py-2 min-w-[52px] text-center">
            {pad(time.hours)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase">{t.hours}</p>
        </div>
        <div className="text-center">
          <div className="font-mono text-2xl font-bold leading-none bg-muted rounded-lg px-3 py-2 min-w-[52px] text-center">
            {pad(time.minutes)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase">{t.min}</p>
        </div>
        <div className="text-center">
          <div className="font-mono text-2xl font-bold leading-none bg-muted rounded-lg px-3 py-2 min-w-[52px] text-center">
            {pad(time.seconds)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase">{t.sec}</p>
        </div>
      </div>
    </div>
  )
}
