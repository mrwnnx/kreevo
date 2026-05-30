'use server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'

import { cn } from '@/lib/utils'
import { Clock, ChevronLeft, Users, Play } from 'lucide-react'
import { XpIcon } from '@/components/ui/XpIcon'
import Link from 'next/link'
import { SubmissionGallery } from '@/components/features/challenge/SubmissionGallery'
import { CountdownTimer } from '@/components/features/challenge/CountdownTimer'
import { ParticipateButton } from '@/components/features/challenge/ParticipateButton'
import { ParticipantsDialog } from '@/components/features/challenge/ParticipantsDialog'
import { RulesDialog } from '@/components/features/challenge/RulesDialog'
import { MySubmissionCard } from '@/components/features/challenge/MySubmissionCard'
import { CancelParticipationButton } from '@/components/features/challenge/CancelParticipationButton'
import { ChallengeBriefSections } from '@/components/features/challenge/ChallengeBriefSections'
import { CooldownCountdown } from '@/components/features/challenge/CooldownCountdown'
import { cooldownEnd, isInCooldown } from '@/lib/utils/participation-cooldown'
import type { Profile } from '@/types/database.types'
import { getDict, getLang, tx } from '@/lib/i18n/lang'
import { localizeChallenge } from '@/lib/challenges/i18n'
import { getTaxonomyMaps, localizeType, localizeIndustry } from '@/lib/challenges/refs'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ just_submitted?: string }>
}

export default async function ChallengePage({ params, searchParams }: Props) {
  const { id } = await params
  const { just_submitted: justSubmitted } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: challenge },
    { data: participation },
    { data: existingSubmission },
    { data: allSubmissions },
    { count: participantCount },
    { data: participantAvatars },
    { data: otherActiveParticipations },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('challenges').select('*').eq('id', id).single(),
    (supabase as any).from('participations').select('*').eq('challenge_id', id).eq('user_id', user.id).single(),
    (supabase.from('submissions') as any).select('*').eq('challenge_id', id).eq('user_id', user.id).single(),
    (supabase.from('submissions') as any).select('*, profiles:user_id(username, avatar_url, league, plan)').eq('challenge_id', id).eq('is_draft', false).eq('validation_status', 'approved').neq('user_id', user.id).order('total_likes', { ascending: false }),
    supabaseAdmin.from('participations' as any).select('*', { count: 'exact', head: true }).eq('challenge_id', id),
    supabaseAdmin.from('participations' as any).select('profiles(id, username, full_name, avatar_url, plan)').eq('challenge_id', id).limit(100),
    (supabase as any).from('participations').select('challenge_id').eq('user_id', user.id).eq('status', 'active').gt('personal_deadline', new Date().toISOString()).neq('challenge_id', id),
  ])

  if (!profile) redirect('/login')
  if (!challenge) notFound()

  const lang = await getLang()
  const c = localizeChallenge(challenge as any, lang)
  const taxoMaps = await getTaxonomyMaps()
  const typeLabel = localizeType(c, lang, taxoMaps)
  const industryLabel = localizeIndustry(c, lang, taxoMaps)
  const p = profile as Profile
  const totalParticipants = participantCount ?? 0

  const hasParticipation = !!participation
  const deadlinePassed = hasParticipation ? new Date(participation.personal_deadline) < new Date() : false
  const participationStatus: 'none' | 'active' | 'expired' | 'submitted' = !hasParticipation
    ? 'none'
    : participation.status === 'submitted' ? 'submitted'
    : deadlinePassed || participation.status === 'expired' ? 'expired'
    : 'active'

  // Reparticipation cooldown — only meaningful when participationStatus === 'expired'.
  // During cooldown the challenge is closed for this user; afterwards they can reset
  // the participation row via POST /api/participations.
  const inCooldown =
    participationStatus === 'expired' &&
    !!participation?.personal_deadline &&
    isInCooldown(participation.personal_deadline)
  const cooldownReopensAt =
    participationStatus === 'expired' && participation?.personal_deadline
      ? cooldownEnd(participation.personal_deadline).toISOString()
      : null

  const hasOtherActive = ((otherActiveParticipations ?? []) as any[]).length > 0

  const maxAttempts = p.plan === 'pro' ? 3 : 2
  const currentAttempts = (existingSubmission as any)?.attempt_number ?? (existingSubmission ? 1 : 0)
  const attemptsLeft = maxAttempts - currentAttempts
  const canResubmit = !!participation && !deadlinePassed && attemptsLeft > 0 && participationStatus !== 'expired'

  const avatars = ((participantAvatars ?? []) as any[]).map(r => r.profiles).filter(Boolean)

  const SPECIALTY_COLOR: Record<string, string> = {
    'UX Designer':      'text-violet-700 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400',
    'UI Designer':      'text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
    'Graphic Designer': 'text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400',
  }
  const specialtyColor = SPECIALTY_COLOR[c.specialty ?? ''] ?? 'text-muted-foreground bg-muted'

  const dict = await getDict()
  const t = dict.challengeDetail

  // ── State 1: PREVIEW (no participation) ─────────────────────────────────────
  if (participationStatus === 'none') {
    return (
      <div className="p-6 max-w-[720px] mx-auto pb-16 bg-white dark:bg-background">

        <div className="mb-6">
          <Link href="/dashboard/challenges" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="size-3.5" /> {t.backToChallenges}
          </Link>
        </div>

        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {c.specialty && (
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${specialtyColor}`}>
                  {c.specialty}
                </span>
              )}
              {typeLabel && (
                <span className="text-sm font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground">
                  {typeLabel}
                </span>
              )}
              {industryLabel && (
                <span className="text-sm text-muted-foreground">{industryLabel}</span>
              )}
            </div>

            <h1 className="text-3xl font-bold leading-tight">{c.title}</h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {c.xp_reward != null && c.xp_reward > 0 && (
                <span className="flex items-center gap-1.5">
                  <XpIcon className="size-4" />
                  <strong className="text-foreground">{c.xp_reward}</strong> XP
                </span>
              )}
              {c.deadline_days != null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  <strong className="text-foreground">{c.deadline_days}</strong> {t.daysSuffix}
                </span>
              )}
              {totalParticipants > 0 && (
                <ParticipantsDialog participants={avatars} total={totalParticipants} t={t.participants} />
              )}
            </div>
          </div>

          {/* Brief (only) */}
          {c.brief && (
            <section className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 p-6 space-y-2">
              <h2 className="text-xl font-semibold"><span className="me-1">📋</span>{t.sections.brief}</h2>
              <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">{c.brief}</p>
            </section>
          )}

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 flex gap-3">
            <span className="text-xl shrink-0">⚠️</span>
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-300">
                {t.warning.title}
              </p>
              <p
                className="text-amber-800 dark:text-amber-200/90 text-sm mt-1 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: tx(t.warning.body, { days: c.deadline_days ?? 3 }) }}
              />
            </div>
          </div>

          {/* Other active blocker */}
          {hasOtherActive ? (
            <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              {t.blockedActive}
            </div>
          ) : (
            <div className="space-y-3">
              <ParticipateButton challengeId={c.id} deadlineDays={c.deadline_days ?? 3} t={t.participate} />
              <div className="text-center">
                <RulesDialog xpReward={c.xp_reward ?? 150} deadlineDays={c.deadline_days ?? 3} t={t.rules} />
              </div>
            </div>
          )}

          {/* Gallery hidden in preview state — only revealed once the user joins,
              keeps the pre-participation page focused on the brief + CTA. */}
        </div>
      </div>
    )
  }

  // ── State 2+: ACTIVE / SUBMITTED / EXPIRED — full brief + sidebar ───────────
  return (
    <div className="p-6 max-w-[1140px] mx-auto pb-16 bg-white dark:bg-background">

      <div className="mb-6">
        <Link href="/dashboard/challenges" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="size-3.5" /> Challenges
        </Link>
      </div>

      {/* Banner après soumission — synchronisé avec le vrai statut courant de la soumission
          (le query param peut devenir obsolète si l'admin valide/rejette après coup) */}
      {justSubmitted && existingSubmission && (() => {
        const sub = existingSubmission as any
        const currentStatus = sub.validation_status as string | null
        // Only show banner if URL param matches current status (otherwise it's stale)
        if (justSubmitted !== currentStatus) return null
        if (justSubmitted === 'approved') {
          return (
            <div className="bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-900/40 rounded-2xl p-4 flex items-center gap-3 mb-6">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300">{t.justSubmitted.approvedTitle}</p>
                <p className="text-sm text-green-700 dark:text-green-400/90">
                  {tx(t.justSubmitted.approvedBody, { xp: c.xp_reward ?? 150 })}
                </p>
              </div>
            </div>
          )
        }
        if (justSubmitted === 'rejected') {
          return (
            <div className="bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-900/40 rounded-2xl p-4 flex items-start gap-3 mb-6">
              <span className="text-2xl">❌</span>
              <div>
                <p className="font-semibold text-red-800 dark:text-red-300">{t.justSubmitted.rejectedTitle}</p>
                {sub.rejection_reason && (
                  <p className="text-sm text-red-700 dark:text-red-400/90">{sub.rejection_reason}</p>
                )}
              </div>
            </div>
          )
        }
        if (justSubmitted === 'pending') {
          return (
            <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 flex items-center gap-3 mb-6">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">{t.justSubmitted.pendingTitle}</p>
                <p className="text-sm text-amber-700 dark:text-amber-400/90">{t.justSubmitted.pendingBody}</p>
              </div>
            </div>
          )
        }
        return null
      })()}

      {/* 2-col layout */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-start">

        {/* ── MAIN CONTENT ── */}
        <div className="space-y-8 min-w-0">

          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {c.specialty && (
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${specialtyColor}`}>
                  {c.specialty}
                </span>
              )}
              {typeLabel && (
                <span className="text-sm font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground">
                  {typeLabel}
                </span>
              )}
              {industryLabel && (
                <span className="text-sm text-muted-foreground">{industryLabel}</span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="size-3.5" />
                {`${allSubmissions?.length ?? 0} soumissions`}
              </span>
            </div>

            <h1 className="text-3xl font-bold leading-tight">{c.title}</h1>

            {c.brief && (
              <p className="text-base text-muted-foreground leading-relaxed">{c.brief}</p>
            )}
          </div>

          <ChallengeBriefSections challenge={c} t={t.sections} />

        </div>

        {/* ── SIDEBAR ── */}
        <div className="lg:sticky lg:top-6 space-y-4">

          {participationStatus === 'active' && (
            <div className="rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">{t.sidebar.activeStatus}</span>
              </div>
              <CountdownTimer deadline={participation.personal_deadline} label={t.sidebar.deadlineLabel} t={t.countdown} />
              <Link
                href={`/dashboard/challenges/${c.id}/submit`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-green-600 text-white text-sm font-semibold h-11 px-4 hover:bg-green-700 transition-colors"
              >
                <Play className="size-4" fill="currentColor" />
                {existingSubmission ? t.sidebar.continueCta : t.sidebar.submitCta}
              </Link>
              {!(existingSubmission && !(existingSubmission as any).is_draft) && (
                <CancelParticipationButton challengeId={c.id} t={t.cancel} />
              )}
              <p className="text-[11px] text-center text-muted-foreground font-mono">
                {tx(t.sidebar.attemptsUsed, { cur: currentAttempts, max: maxAttempts })}
              </p>
            </div>
          )}

          {participationStatus === 'expired' && inCooldown && cooldownReopensAt && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-500" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{t.sidebar.cooldownStatus}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tx(t.sidebar.expiredBody, { days: c.deadline_days ?? 3 })}
              </p>
              <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <p>{t.sidebar.cooldownBody}</p>
                <CooldownCountdown reopensAt={cooldownReopensAt} template={t.sidebar.cooldownRemainingTpl} />
              </div>
            </div>
          )}

          {participationStatus === 'expired' && !inCooldown && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{t.sidebar.reopenedStatus}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.sidebar.reopenedBody}
              </p>
              {hasOtherActive ? (
                <p className="text-xs text-muted-foreground">{t.blockedActive}</p>
              ) : (
                <ParticipateButton
                  challengeId={c.id}
                  deadlineDays={c.deadline_days ?? 3}
                  t={t.participate}
                  ctaLabel={t.sidebar.reparticipateCta}
                />
              )}
            </div>
          )}

          {/* Challenge meta card */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{t.sidebar.detailsTitle}</p>
            <div className="space-y-2.5">
              {c.specialty && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t.sidebar.specialty}</span>
                  <span className="font-medium">{c.specialty}</span>
                </div>
              )}
              {typeLabel && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t.sidebar.type}</span>
                  <span className="font-medium">{typeLabel}</span>
                </div>
              )}
              {industryLabel && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t.sidebar.industry}</span>
                  <span className="font-medium">{industryLabel}</span>
                </div>
              )}
              {c.deadline_days && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t.sidebar.duration}</span>
                  <span className="font-medium">{tx(t.sidebar.durationDays, { n: c.deadline_days })}</span>
                </div>
              )}
              {totalParticipants > 0 && (
                <div className="flex items-center justify-start text-sm">
                  <ParticipantsDialog participants={avatars} total={totalParticipants} t={t.participants} />
                </div>
              )}
            </div>
          </div>

          {/* Ma soumission */}
          {existingSubmission && (
            <MySubmissionCard
              submission={existingSubmission as any}
              challengeId={c.id}
              canResubmit={canResubmit}
              participationStatus={participationStatus}
              userPlan={p.plan ?? undefined}
              t={t.mySubmission}
            />
          )}

        </div>
      </div>

      {/* Gallery — full-page width, below the 2-col layout */}
      {allSubmissions && allSubmissions.length > 0 && (
        <section className="space-y-4 pt-8 mt-8 border-t border-border">
          <h2 className="text-xl font-semibold"><span className="me-1">🖼️</span>{tx(t.otherSubmissions, { n: allSubmissions.length })}</h2>
          <SubmissionGallery
            submissions={allSubmissions}
            currentUserId={user.id}
            challengeTitle={c.title}
            t={t.gallery}
          />
        </section>
      )}
    </div>
  )
}
