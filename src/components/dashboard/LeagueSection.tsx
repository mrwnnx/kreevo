'use client'

import { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getLeagueStyle } from '@/lib/utils/league-style'
import { LeagueIcon } from '@/components/features/league/LeagueIcon'

type Props = {
  profile: any
  league: any
  nextLeague: any
  userRank: number
  totalInLeague: number
  currentXP: number
  threshold: number
  suggestedChallenge: any
}

export function LeagueSection({
  profile,
  league,
  userRank,
  totalInLeague,
  currentXP,
  threshold,
}: Props) {
  const xpPercent = threshold > 0 ? Math.min((currentXP / threshold) * 100, 100) : 0
  const leagueStyle = getLeagueStyle(profile?.league)

  return (
    <div className={cn('relative overflow-hidden border border-border rounded-[24px] p-4', leagueStyle.bgClass)}>
      <div className="relative">
        <p className={cn('text-xs font-bold uppercase tracking-widest mb-3', leagueStyle.textPrimary)}>
          YOUR LEAGUE
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/60 dark:bg-white/10 rounded-xl flex items-center justify-center">
              <LeagueIcon icon={league?.icon ?? leagueStyle.emoji} size="lg" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              {league?.name ?? leagueStyle.name} League
            </h3>
          </div>
        </div>

        <div className="mb-3">
          <div className={cn('flex justify-between text-xs opacity-70 mb-1.5', leagueStyle.textSecondary)}>
            <span>Tier progress</span>
            <span>
              {currentXP.toLocaleString()} / {threshold.toLocaleString()} XP
            </span>
          </div>
          <div className="h-2.5 bg-white/50 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700', leagueStyle.accent)}
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-2 bg-white dark:bg-white/10 rounded-lg">
          <div className="flex items-center gap-1.5 text-sm">
            <TrendingUp className={cn('w-4 h-4', leagueStyle.textPrimary)} />
            <span className={cn('font-semibold', leagueStyle.textSecondary)}>
              Rank #{userRank || '—'} of {totalInLeague || 50}
            </span>
          </div>
          <Link
            href="/dashboard/leaderboard"
            className={cn('text-xs font-medium', leagueStyle.textPrimary)}
          >
            Push to top 10 🔥
          </Link>
        </div>
      </div>
    </div>
  )
}

type CountdownProps = {
  profile: any
  nextLeague: any
  currentXP: number
  threshold: number
  suggestedChallenge: any
}

export function LeagueCountdownCard({
  profile,
  nextLeague,
  currentXP,
  threshold,
  suggestedChallenge,
}: CountdownProps) {
  const xpPercent = threshold > 0 ? Math.min((currentXP / threshold) * 100, 100) : 0
  const isCloseToPromotion = xpPercent >= 80
  const leagueStyle = getLeagueStyle(profile?.league)

  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, min: 11, sec: 32 })

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, min, sec } = prev
        sec--
        if (sec < 0) { sec = 59; min-- }
        if (min < 0) { min = 59; hours-- }
        if (hours < 0) { hours = 23; days-- }
        if (days < 0) { days = 0; hours = 0; min = 0; sec = 0 }
        return { days, hours, min, sec }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!isCloseToPromotion) return null

  return (
    <div className="rounded-[24px] p-4 relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 text-white">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
          ⏰ League ends soon
        </span>
        <span className="text-xs bg-red-400/40 px-2 py-1 rounded-full">
          🔺 High stakes
        </span>
      </div>

      <h3 className="font-bold text-lg mb-1">Don&apos;t lose your spot.</h3>
      <p className="text-white/80 text-sm mb-4">
        Stay active to remain in {leagueStyle.name}. Top 20 stay. Others drop to{' '}
        {nextLeague?.name || 'Silver'}.
      </p>

      <div className="flex gap-2 mb-4">
        {[
          { v: timeLeft.days, l: 'DAYS' },
          { v: timeLeft.hours, l: 'HOURS' },
          { v: timeLeft.min, l: 'MIN' },
          { v: timeLeft.sec, l: 'SEC' },
        ].map(t => (
          <div
            key={t.l}
            className="bg-white/20 rounded-lg px-3 py-2 text-center min-w-[52px]"
          >
            <p className="text-xl font-bold">{String(t.v).padStart(2, '0')}</p>
            <p className="text-xs text-white/60">{t.l}</p>
          </div>
        ))}
      </div>

      <Link href="/dashboard/challenges">
        <Button className="bg-white text-orange-600 hover:bg-white/90 w-full font-semibold">
          ⚡ Complete a Challenge
        </Button>
      </Link>
    </div>
  )
}
