'use client'

import { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
  nextLeague,
  userRank,
  totalInLeague,
  currentXP,
  threshold,
  suggestedChallenge,
}: Props) {
  const xpPercent = threshold > 0 ? Math.min((currentXP / threshold) * 100, 100) : 0
  const isCloseToPromotion = xpPercent >= 80

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

  const leagueName = profile?.league === '7ajra' ? 'Stone' : profile?.league || 'Stone'

  return (
    <div className="grid md:grid-cols-2 gap-4">

      <div
        className="relative overflow-hidden border border-amber-100 dark:border-amber-900/30 rounded-2xl p-5"
        style={{ backgroundColor: '#FCEAC8' }}
      >
        {/* Decorative organic shapes */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full"
          viewBox="0 0 400 240"
          preserveAspectRatio="xMidYMid slice"
          fill="#F5D9A8"
        >
          {/* top-left blob */}
          <path d="M-20 30 Q 30 -10 70 20 Q 95 50 60 80 Q 25 100 -5 80 Q -35 55 -20 30 Z" opacity="0.55" />
          {/* small top-right curl */}
          <path d="M380 10 Q 410 25 395 50 Q 375 65 360 50 Q 350 30 380 10 Z" opacity="0.5" />
          {/* mid dot */}
          <circle cx="270" cy="55" r="4" opacity="0.55" />
          {/* mid-left dot */}
          <circle cx="35" cy="155" r="3" opacity="0.55" />
          {/* bottom-left petal */}
          <path d="M0 200 Q 35 170 70 195 Q 90 225 60 245 Q 20 250 0 230 Z" opacity="0.55" />
          {/* bottom-right petal */}
          <path d="M340 220 Q 380 200 410 230 Q 415 260 380 265 Q 345 260 340 220 Z" opacity="0.5" />
          {/* center-right curve */}
          <path d="M310 130 Q 340 115 360 140 Q 350 170 320 165 Q 300 150 310 130 Z" opacity="0.4" />
        </svg>

        <div className="relative">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest mb-3">
            YOUR LEAGUE
          </p>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center text-xl">
                🏆
              </div>
              <h3 className="text-xl font-bold text-amber-900">
                {leagueName} League
              </h3>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-xs text-amber-900/70 mb-1.5">
              <span>Tier progress</span>
              <span>
                {currentXP.toLocaleString()} / {threshold.toLocaleString()} XP
              </span>
            </div>
            <div className="h-2.5 bg-white/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-700"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm">
              <TrendingUp className="w-4 h-4 text-amber-700" />
              <span className="font-semibold text-amber-900">
                Rank #{userRank || '—'} of {totalInLeague || 50}
              </span>
            </div>
            <Link
              href="/dashboard/leaderboard"
              className="text-xs text-amber-700 hover:text-amber-800 font-medium"
            >
              Push to top 10 🔥
            </Link>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'rounded-2xl p-5 relative overflow-hidden',
          isCloseToPromotion
            ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white'
            : 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white',
        )}
      >
        {isCloseToPromotion ? (
          <>
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
              Stay active to remain in {leagueName}. Top 20 stay. Others drop to{' '}
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
          </>
        ) : (
          <>
            <p className="text-sm text-white/70 mb-2">Suggested for you</p>
            <h3 className="font-bold text-lg mb-1 leading-tight">
              {suggestedChallenge?.title || 'Pick your next challenge'}
            </h3>
            {suggestedChallenge && (
              <p className="text-white/70 text-sm mb-1">
                +{suggestedChallenge.xp_reward} XP · {suggestedChallenge.deadline_days} days
              </p>
            )}
            <p className="text-white/60 text-xs mb-5">
              {[suggestedChallenge?.specialty, suggestedChallenge?.challenge_type]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <Link href="/dashboard/challenges">
              <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/30 w-full">
                Complete a Challenge ⚡
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
