'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getDashboardState, getHeroConfig } from '@/lib/utils/dashboard'
import { tx } from '@/lib/i18n/tx'
import type { Lang } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

interface HeroBannerProps {
  profile: any
  participation: any | null
  streak: any | null
  xpToday: number
  xpPercent: number
  xpGap: number
  nextLeague: string
  justSubmitted: boolean
  lastSubmissionDate: Date | null
  suggestedChallenge: any | null
  completedTotal: number
  completedToday: number
  lang: Lang
  t: Dictionary['dashboard']['heroBanner']
}

export function HeroBanner({
  profile,
  participation,
  streak,
  xpToday,
  xpPercent,
  xpGap,
  nextLeague,
  justSubmitted,
  lastSubmissionDate,
  suggestedChallenge,
  completedTotal,
  completedToday,
  lang,
  t,
}: HeroBannerProps) {
  const firstName =
    profile?.first_name ||
    profile?.full_name?.split(' ')[0] ||
    profile?.username ||
    'Designer'

  const state = getDashboardState({
    participation,
    profile,
    streak,
    xpPercent,
    justSubmitted,
    lastSubmissionDate,
  })

  const config = getHeroConfig(state, {
    firstName,
    participation,
    xpGap,
    nextLeague,
    streak,
    xpToday,
    suggestedChallenge,
    completedTotal,
    lang,
    t,
  })

  // Countdown pour état urgent
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 })
  useEffect(() => {
    if (state !== 'urgent' || !participation?.personal_deadline) return
    const update = () => {
      const diff = new Date(participation.personal_deadline).getTime() - Date.now()
      if (diff <= 0) return
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [state, participation])

  // Tip contextuel si défi actif (fallback FR si la clé n'existe pas)
  const tip = participation?.challenges?.challenge_type
    ? t.tips[participation.challenges.challenge_type]
    : null

  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden p-5 sm:p-8 pb-10 sm:pb-12 relative text-white min-h-[180px]',
        'bg-gradient-to-r',
        config.gradient,
      )}
    >
      {config.badge && (
        <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium mb-4">
          {config.badge}
        </div>
      )}

      <div className="max-w-full sm:max-w-[60%]">
        <h1 className="text-xl sm:text-2xl font-bold mb-1">{config.title}</h1>
        {config.subtitle && (
          <p className="text-base sm:text-lg font-semibold text-white/90 mb-2">{config.subtitle}</p>
        )}
        {config.body && (
          <p className="text-white/75 text-xs sm:text-sm mb-4">{config.body}</p>
        )}

        {state === 'urgent' && (
          <div className="flex gap-2 mb-4">
            {[
              { v: timeLeft.h, l: 'H' },
              { v: timeLeft.m, l: 'MIN' },
              { v: timeLeft.s, l: 'SEC' },
            ].map((t) => (
              <div
                key={t.l}
                className="bg-white/20 rounded-xl px-3 py-2 text-center min-w-[52px]"
              >
                <p className="text-xl font-bold tabular-nums">
                  {String(t.v).padStart(2, '0')}
                </p>
                <p className="text-xs text-white/60">{t.l}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {config.cta1 && (
            <Link href={config.cta1.href}>
              <Button className="bg-white text-violet-700 hover:bg-white/90 font-semibold">
                {config.cta1.label}
              </Button>
            </Link>
          )}
          {config.cta2 && (
            <Link href={config.cta2.href}>
              <Button
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 bg-transparent"
              >
                {config.cta2.label}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {tip && state === 'active' && (
        <div className="hidden sm:block absolute bottom-12 end-6 max-w-[35%] bg-white/10 backdrop-blur-sm rounded-xl p-3">
          <p className="text-xs text-white/60 mb-1">{t.tipLabel}</p>
          <p className="text-xs text-white/90 leading-relaxed">{tip}</p>
        </div>
      )}

      <div className="absolute bottom-0 start-0 end-0 px-5 sm:px-8 pb-4">
        <div className="flex justify-between text-xs text-white/50 mb-1">
          <span>{t.todayProgress}</span>
          <span>{tx(t.tasksLabel, { done: completedToday })}</span>
        </div>
        <div className="h-1 bg-white/20 rounded-full">
          <div
            className="h-full bg-white rounded-full transition-all duration-700"
            style={{ width: `${Math.min((completedToday / 5) * 100, 100)}%` }}
          />
        </div>
      </div>

      {xpToday > 0 && (
        <div className="absolute top-3 end-3 sm:top-4 sm:end-4 bg-amber-400 text-amber-900 rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold shadow-lg whitespace-nowrap">
          {tx(t.xpTodayBadge, { n: xpToday })}
        </div>
      )}
    </div>
  )
}
