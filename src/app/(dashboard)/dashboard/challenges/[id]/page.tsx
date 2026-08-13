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
import { GLASS_SURFACE, GLASS_GRADIENT } from '@/components/layout/GlassShell'
import { MySubmissionCard } from '@/components/features/challenge/MySubmissionCard'
import { CancelParticipationButton } from '@/components/features/challenge/CancelParticipationButton'
import { ChallengeBriefSections } from '@/components/features/challenge/ChallengeBriefSections'
import { CooldownCountdown } from '@/components/features/challenge/CooldownCountdown'
import { cooldownEnd, isInCooldown } from '@/lib/utils/participation-cooldown'
import { specialtyMismatch } from '@/lib/challenges/specialty'
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
    supabase.from('challenges').select('*, specialties(name_fr, name_en, name_ar)').eq('id', id).single(),
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

  // PHASE 4 — gate cross-spé : si le challenge n'est pas de la spé du user, on
  // remplace le bouton « Je participe » par un bloc d'info (la participation reste
  // bloquée côté serveur de toute façon). Les soumissions legacy déjà en base restent
  // consultables. specialty_id NULL côté user → aussi traité comme « autre spé ».
  const isOtherSpecialty = !!specialtyMismatch(p.specialty_id, (challenge as any).specialty_id)
  const challengeSpecialtyRow = (challenge as any).specialties as
    { name_fr: string | null; name_en: string | null; name_ar: string | null } | null
  const challengeSpecialtyLabel =
    (lang === 'ar' ? challengeSpecialtyRow?.name_ar
      : lang === 'en' ? challengeSpecialtyRow?.name_en
      : challengeSpecialtyRow?.name_fr) || c.specialty || ''
  const otherSpecialtyNotice = (
    <div className="rounded-2xl border border-dashed p-6 text-center space-y-3">
      <p className="text-sm font-semibold">{t.wrongSpecialtyTitle}</p>
      <p
        className="text-xs text-muted-foreground leading-relaxed"
        dangerouslySetInnerHTML={{ __html: tx(t.wrongSpecialtyBody, { specialty: challengeSpecialtyLabel }) }}
      />
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full hover:opacity-85 transition-opacity"
      >
        {t.noSpecialtyCta}
      </Link>
    </div>
  )

  // ── State 1: PREVIEW (no participation) ─────────────────────────────────────
  if (participationStatus === 'none') {
    return (
      <div className="mx-auto flex max-w-[720px] flex-col gap-[32px] p-6 pb-16">

        {/* ── En-tête (Figma 492:2995) ── */}
        <div className="flex w-full flex-col items-start justify-center gap-[16px]">
          <Link
            href="/dashboard/challenges"
            className="flex items-center gap-[2px] text-[#71717a] transition-colors hover:text-[#2b2c36]"
          >
            <ChevronLeft className="size-[15.781px]" />
            <span className="text-[14px] font-bold leading-[1.2]">{t.backToChallenges}</span>
            <span className="text-[14px] font-normal leading-[1.2]">/</span>
            <span className="text-[14px] font-normal leading-[1.2]">{t.sections.brief}</span>
          </Link>

          <div className="flex w-full flex-col items-start gap-[8px]">
            <h1 className="text-[40px] font-semibold leading-[1.2] text-[#2b2c36]">{c.title}</h1>

            <div className="flex flex-wrap items-center gap-[16px] text-[12px] text-[#71717a]">
              {c.xp_reward != null && c.xp_reward > 0 && (
                <span className="flex items-center gap-[4px]">
                  <XpIcon className="size-4" />
                  {c.xp_reward} XP
                </span>
              )}
              {c.deadline_days != null && (
                <span className="flex items-center gap-[6px]">
                  <Clock className="size-4" />
                  {c.deadline_days} {t.daysSuffix}
                </span>
              )}
              {totalParticipants > 0 && (
                <ParticipantsDialog participants={avatars} total={totalParticipants} t={t.participants} />
              )}
            </div>
          </div>

        </div>

        {/* ── Carte Brief (Figma 492:4852) ── */}
        <div
          className={`${GLASS_SURFACE} flex w-full items-start justify-center overflow-clip rounded-[32px]`}
          style={GLASS_GRADIENT}
        >
          <div className="flex min-w-px flex-[1_0_0] flex-col items-start gap-[16px] rounded-[32px] border-[0.986px] border-[#dcdce8] p-[16px]">
            <div className="flex w-full flex-col items-start gap-[8px]">
              <p className="w-full text-[16px] font-semibold text-[#2b2c36]">{t.sections.brief}</p>
              {c.brief && (
                <p className="w-full whitespace-pre-line text-[14px] font-normal leading-[1.2] text-[#484848]">
                  {c.brief}
                </p>
              )}
              {(c.specialty || typeLabel || industryLabel) && (
                <div className="flex w-full flex-wrap items-start gap-[8px]">
                  {[c.specialty, typeLabel, industryLabel].filter(Boolean).map((tag) => (
                    <span
                      key={tag as string}
                      className={`${GLASS_SURFACE} flex items-center justify-center rounded-[7.891px]`}
                      style={GLASS_GRADIENT}
                    >
                      <span className="flex flex-col items-start rounded-[7.891px] border-[0.986px] border-[#dcdce8] p-[7.891px] text-[12px] font-normal leading-[1.2] text-[#484848]">
                        {tag as string}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Encart « Avant de participer » (Figma 492:5050) — verre teinté jaune */}
            <div
              className="flex w-full items-start justify-center overflow-clip rounded-[16px] border-[1.973px] border-white shadow-[0px_3.945px_44.385px_0px_rgba(0,0,0,0.1)] backdrop-blur-[59.18px]"
              style={{
                backgroundImage:
                  'linear-gradient(191.43deg, rgba(254,237,170,0.51) 23.035%, rgba(254,237,170,0.117) 119.63%)',
              }}
            >
              <div className="flex min-w-px flex-[1_0_0] flex-col items-start gap-[8px] rounded-[16px] border-[0.986px] border-[#dcdce8] p-[16px]">
                <p className="w-full text-[16px] font-semibold text-[#2b2c36]">{t.warning.title}</p>
                <p
                  className="w-full text-[14px] font-normal leading-[1.2] text-[#484848]"
                  dangerouslySetInnerHTML={{ __html: tx(t.warning.body, { days: c.deadline_days ?? 3 }) }}
                />
              </div>
            </div>

            {/* Actions — en pied de carte, sous « Avant de participer ». */}
            {isOtherSpecialty ? (
              otherSpecialtyNotice
            ) : hasOtherActive ? (
              <div className="w-full rounded-[16px] border border-[#dcdce8] bg-white/40 p-4 text-sm text-[#484848] backdrop-blur-[59.18px]">
                {t.blockedActive}
              </div>
            ) : (
              <div className="flex w-full flex-wrap items-center justify-end gap-[8px]">
                <RulesDialog compact xpReward={c.xp_reward ?? 150} deadlineDays={c.deadline_days ?? 3} t={t.rules} />
                <ParticipateButton compact challengeId={c.id} deadlineDays={c.deadline_days ?? 3} t={t.participate} />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── State 2+: ACTIVE / SUBMITTED / EXPIRED — full brief + sidebar ───────────
  return (
    <div className="mx-auto max-w-[1140px] p-6 pb-16">

      <div className="mb-6">
        <Link
          href="/dashboard/challenges"
          className="flex w-fit items-center gap-[2px] text-[#71717a] transition-colors hover:text-[#2b2c36]"
        >
          <ChevronLeft className="size-[15.781px]" />
          <span className="text-[14px] font-bold leading-[1.2]">{t.backToChallenges}</span>
          <span className="text-[14px] font-normal leading-[1.2]">/</span>
          <span className="text-[14px] font-normal leading-[1.2]">{t.sections.brief}</span>
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

            <h1 className="text-[40px] font-semibold leading-[1.2] text-[#2b2c36]">{c.title}</h1>

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
              {isOtherSpecialty ? (
                otherSpecialtyNotice
              ) : hasOtherActive ? (
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
          <div className={`${GLASS_SURFACE} space-y-3 rounded-[16px] p-4`} style={GLASS_GRADIENT}>
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
              t={t.mySubmission}
            />
          )}

        </div>
      </div>

      {/* Gallery — full-page width, below the 2-col layout */}
      {allSubmissions && allSubmissions.length > 0 && (
        <section className="mt-8 space-y-4 border-t border-[#dcdce8] pt-8">
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
