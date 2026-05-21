'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, ArrowRight, Clock, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getLeagueStyle } from '@/lib/utils/league-style'
import { LeagueIcon } from '@/components/features/league/LeagueIcon'
import { tx } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type Props = {
  profile: any
  league: any
  nextLeague: any
  userRank: number
  totalInLeague: number
  currentXP: number
  threshold: number
  suggestedChallenge: any
  completedInLeague: number
  minChallenges: number
  minChallengesEnabled: boolean
  t: Dictionary['dashboard']['leagueSection']
}

export function LeagueSection({
  profile,
  league,
  userRank,
  totalInLeague,
  currentXP,
  threshold,
  completedInLeague,
  minChallenges,
  minChallengesEnabled,
  t,
}: Props) {
  const xpPercent = threshold > 0 ? Math.min((currentXP / threshold) * 100, 100) : 0
  const challengesPercent =
    minChallenges > 0 ? Math.min((completedInLeague / minChallenges) * 100, 100) : 0
  const leagueStyle = getLeagueStyle(profile?.league)

  return (
    <div className={cn('relative overflow-hidden border border-border rounded-[24px] p-4', leagueStyle.bgClass)}>
      <div className="relative">
        <p className={cn('text-xs font-bold uppercase tracking-widest mb-3', leagueStyle.textPrimary)}>
          {t.yourLeague}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/60 dark:bg-white/10 rounded-xl flex items-center justify-center">
              <LeagueIcon icon={league?.icon ?? leagueStyle.emoji} size="lg" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              {league?.name ?? leagueStyle.name} {t.leagueSuffix}
            </h3>
          </div>
        </div>

        <div className="mb-3 space-y-2.5">
          <div>
            <div className={cn('flex justify-between text-xs opacity-70 mb-1.5', leagueStyle.textSecondary)}>
              <span className="inline-flex items-center gap-1">{t.xpProgress}</span>
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

          {minChallengesEnabled && (
            <div>
              <div className={cn('flex justify-between text-xs opacity-70 mb-1.5', leagueStyle.textSecondary)}>
                <span className="inline-flex items-center gap-1">{t.challengesProgress}</span>
                <span>
                  {completedInLeague} / {minChallenges}
                </span>
              </div>
              <div className="h-2.5 bg-white/50 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', leagueStyle.accent)}
                  style={{ width: `${challengesPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-2 bg-white dark:bg-white/10 rounded-lg">
          <div className="flex items-center gap-1.5 text-sm">
            <TrendingUp className={cn('w-4 h-4', leagueStyle.textPrimary)} />
            <span className={cn('font-semibold', leagueStyle.textSecondary)}>
              {tx(t.rank, { rank: userRank || '—', total: totalInLeague || 50 })}
            </span>
          </div>
          <Link
            href="/dashboard/leaderboard"
            className={cn('text-xs font-medium', leagueStyle.textPrimary)}
          >
            {t.pushToTop}
          </Link>
        </div>
      </div>
    </div>
  )
}

type CountdownProps = {
  participation: any
  suggestedChallenge: any
  t: Dictionary['dashboard']['countdownCard']
}

type TimeLeft = { days: number; hours: number; min: number; sec: number }

export function LeagueCountdownCard({
  participation,
  suggestedChallenge,
  t,
}: CountdownProps) {
  const deadline = participation?.personal_deadline
    ? new Date(participation.personal_deadline).getTime()
    : null

  // null jusqu'au mount → évite tout mismatch d'hydratation sur le compte à rebours
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  useEffect(() => {
    if (!deadline) return
    const tick = () => {
      const diff = Math.max(0, deadline - Date.now())
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor(diff / 3600000) % 24,
        min: Math.floor(diff / 60000) % 60,
        sec: Math.floor(diff / 1000) % 60,
      })
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  // ── Mode motivation (aucune participation active) ───────────────
  if (!participation) {
    const href = suggestedChallenge?.id
      ? `/dashboard/challenges/${suggestedChallenge.id}`
      : '/dashboard/challenges'
    return (
      <div className="relative overflow-hidden rounded-[28px] bg-card border border-border shadow-sm h-full">
        <div className="relative p-5 sm:p-6 flex flex-col gap-4 h-full">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
              <Sparkles className="size-3.5" /> {t.noChallengeLabel}
            </span>
            <h3 className="mt-2 text-2xl font-bold tracking-tight leading-tight text-foreground">
              {t.noChallengeTitle}
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-prose">
              {t.noChallengeBody}
            </p>
          </div>
          <Link href={href} className="mt-auto">
            <Button className="group bg-violet-600 text-white hover:bg-violet-700 font-semibold shadow-sm">
              {t.browseCta}
              <ArrowRight className="size-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // ── Mode deadline (participation active) ────────────────────────
  const challengeTitle = participation.challenges?.title ?? ''
  const submitHref = `/dashboard/challenges/${participation.challenge_id}/submit`
  const isUp =
    timeLeft != null &&
    timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.min === 0 && timeLeft.sec === 0

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-card border border-border shadow-sm h-full flex flex-col">
      <div className="relative p-5 sm:p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-orange-500/10 ring-1 ring-orange-500/20">
            <Clock className="size-4 text-orange-600 dark:text-orange-400" strokeWidth={2.2} />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-300">
            {t.deadlineLabel}
          </span>
        </div>

        {/* Titre du challenge */}
        {challengeTitle && (
          <h3 className="text-2xl font-bold tracking-tight leading-tight text-foreground truncate">
            {challengeTitle}
          </h3>
        )}

        {/* Countdown */}
        <div className="mt-5 flex flex-wrap gap-2 sm:gap-3">
          {[
            { v: timeLeft?.days, l: t.days },
            { v: timeLeft?.hours, l: t.hours },
            { v: timeLeft?.min, l: t.min },
            { v: timeLeft?.sec, l: t.sec },
          ].map(unit => (
            <div
              key={unit.l}
              className="w-16 shrink-0 rounded-xl bg-muted/50 ring-1 ring-border px-2 py-2 text-center"
            >
              <p className="text-lg sm:text-xl font-bold tabular-nums leading-none text-foreground">
                {unit.v == null ? '--' : String(unit.v).padStart(2, '0')}
              </p>
              <p className="mt-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                {unit.l}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link href={submitHref} className="mt-auto pt-5">
          <Button className="group bg-foreground text-background hover:opacity-85 font-semibold shadow-sm">
            {isUp ? t.timeUp : t.submitCta}
            <ArrowRight className="size-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
