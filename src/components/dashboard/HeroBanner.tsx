'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Participation = {
  challenge_id?: string
  personal_deadline?: string
  challenges?: {
    title?: string
    xp_reward?: number
  } | null
} | null

type Props = {
  profile: any
  participation: Participation
  xpToday: number
  completedToday: number
  justSubmitted?: boolean
  isCloseToPromotion?: boolean
}

function getDashboardState(participation: Participation): 'free' | 'active' | 'urgent' {
  if (!participation || !participation.personal_deadline) return 'free'
  const deadline = new Date(participation.personal_deadline)
  const hoursLeft = (deadline.getTime() - Date.now()) / (1000 * 60 * 60)
  if (hoursLeft < 0) return 'free'
  if (hoursLeft < 24) return 'urgent'
  return 'active'
}

export function HeroBanner({
  profile,
  participation,
  xpToday,
  completedToday,
  justSubmitted,
  isCloseToPromotion,
}: Props) {
  const state: 'free' | 'active' | 'urgent' | 'submitted' | 'close_promotion' = justSubmitted
    ? 'submitted'
    : isCloseToPromotion
      ? 'close_promotion'
      : getDashboardState(participation)

  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 })

  useEffect(() => {
    if (state !== 'urgent' || !participation?.personal_deadline) return
    const tick = () => {
      const diff = new Date(participation.personal_deadline!).getTime() - Date.now()
      if (diff < 0) return
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [state, participation?.personal_deadline])

  const firstName = profile?.full_name?.split(' ')[0] || profile?.first_name || profile?.username || 'Designer'

  const bannerConfig = {
    free: {
      gradient: 'from-violet-600 via-violet-600 to-indigo-700',
      badge: '✨ Daily quest unlocked',
      title: `Welcome back, ${firstName} 👋`,
      subtitle: 'Ready for your next challenge?',
      body: "You're closer than you think. Let's keep the momentum going.",
      cta1: { label: '▶ Start a Challenge →', href: '/dashboard/challenges' },
      cta2: { label: 'View Challenges', href: '/dashboard/challenges' },
    },
    active: {
      gradient: 'from-violet-600 via-violet-600 to-indigo-700',
      badge: '⏱ Défi en cours',
      title: participation?.challenges?.title || 'Défi en cours',
      subtitle: 'Continue ton travail !',
      body: 'Il te reste du temps — livre ton meilleur travail.',
      cta1: {
        label: '▶ Continuer mon défi →',
        href: `/dashboard/challenges/${participation?.challenge_id}`,
      },
      cta2: null as null | { label: string; href: string },
    },
    urgent: {
      gradient: 'from-orange-500 via-red-500 to-rose-600',
      badge: '🚨 Deadline proche !',
      title: `Plus que ${timeLeft.h}h ${timeLeft.m}m !`,
      subtitle: participation?.challenges?.title || '',
      body: 'Soumets maintenant pour garder tes XP.',
      cta1: {
        label: '⚡ Soumettre maintenant →',
        href: `/dashboard/challenges/${participation?.challenge_id}`,
      },
      cta2: null as null | { label: string; href: string },
    },
    submitted: {
      gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
      badge: null as string | null,
      title: '🎉 Travail soumis !',
      subtitle: `+${participation?.challenges?.xp_reward ?? 0} XP ajoutés`,
      body: 'Excellent travail ! Choisis ton prochain défi.',
      cta1: { label: 'Voir mes défis →', href: '/dashboard/challenges' },
      cta2: null as null | { label: string; href: string },
    },
    close_promotion: {
      gradient: 'from-amber-500 via-orange-500 to-yellow-500',
      badge: '🏆 Promotion proche !',
      title: 'Tu y es presque !',
      subtitle: 'Plus que quelques XP pour passer la ligue',
      body: "Continue sur ta lancée — la prochaine ligue t'attend.",
      cta1: { label: '▶ Continuer →', href: '/dashboard/challenges' },
      cta2: null as null | { label: string; href: string },
    },
  } as const

  const config = bannerConfig[state]

  return (
    <div
      className={cn(
        'rounded-[24px] overflow-hidden p-4 pb-10 relative bg-gradient-to-r text-white min-h-[200px]',
        config.gradient,
      )}
    >
      {config.badge && (
        <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium mb-4">
          {config.badge}
        </div>
      )}

      <div className="max-w-[60%]">
        <h1 className="text-2xl font-bold mb-1 leading-tight">{config.title}</h1>
        {config.subtitle && (
          <p className="text-lg font-semibold text-white/90 mb-2">{config.subtitle}</p>
        )}
        <p className="text-white/75 text-sm mb-6">{config.body}</p>

        <div className="flex items-center gap-3 flex-wrap">
          {config.cta1 && (
            <Link href={config.cta1.href}>
              <Button className="bg-white text-violet-700 hover:bg-white/90 font-semibold">
                {config.cta1.label}
              </Button>
            </Link>
          )}
          {config.cta2 && (
            <Link href={config.cta2.href}>
              <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 bg-transparent">
                {config.cta2.label}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
        <div className="flex justify-between text-xs text-white/60 mb-1.5">
          <span>Today&apos;s progress</span>
          <span>{completedToday} / 5 tasks</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-700"
            style={{ width: `${Math.min((completedToday / 5) * 100, 100)}%` }}
          />
        </div>
      </div>

      {xpToday > 0 && (
        <div className="absolute top-4 right-4 bg-amber-400 text-amber-900 rounded-full px-3 py-1 text-xs font-bold shadow-lg">
          +{xpToday} XP today
        </div>
      )}
    </div>
  )
}
