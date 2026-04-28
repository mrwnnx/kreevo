'use server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'

import { cn } from '@/lib/utils'
import { Clock, ChevronLeft, Users, CheckCircle2, Package, AlertCircle, Zap, Play } from 'lucide-react'
import Link from 'next/link'
import { SubmissionGallery } from '@/components/features/challenge/SubmissionGallery'
import { CountdownTimer } from '@/components/features/challenge/CountdownTimer'
import { ParticipateButton } from '@/components/features/challenge/ParticipateButton'
import { ParticipantsDialog } from '@/components/features/challenge/ParticipantsDialog'
import { RulesDialog } from '@/components/features/challenge/RulesDialog'
import { MySubmissionCard } from '@/components/features/challenge/MySubmissionCard'
import type { Profile } from '@/types/database.types'

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
    (supabase.from('submissions') as any).select('*, profiles(username, avatar_url, league)').eq('challenge_id', id).eq('is_draft', false).eq('validation_status', 'approved').neq('user_id', user.id).order('likes_count', { ascending: false }),
    supabaseAdmin.from('participations' as any).select('*', { count: 'exact', head: true }).eq('challenge_id', id),
    supabaseAdmin.from('participations' as any).select('profiles(id, username, full_name, avatar_url)').eq('challenge_id', id).limit(100),
    (supabase as any).from('participations').select('challenge_id').eq('user_id', user.id).eq('status', 'active').neq('challenge_id', id),
  ])

  if (!profile) redirect('/login')
  if (!challenge) notFound()

  const c = challenge as any
  const p = profile as Profile
  const totalParticipants = participantCount ?? 0

  const hasParticipation = !!participation
  const deadlinePassed = hasParticipation ? new Date(participation.personal_deadline) < new Date() : false
  const participationStatus: 'none' | 'active' | 'expired' | 'submitted' = !hasParticipation
    ? 'none'
    : participation.status === 'submitted' ? 'submitted'
    : deadlinePassed || participation.status === 'expired' ? 'expired'
    : 'active'

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

  // ── State 1: PREVIEW (no participation) ─────────────────────────────────────
  if (participationStatus === 'none') {
    return (
      <div className="p-6 max-w-[720px] mx-auto pb-16 bg-white dark:bg-background">

        <div className="mb-6">
          <Link href="/dashboard/challenges" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="size-3.5" /> Challenges
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
              {c.challenge_type && (
                <span className="text-sm font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground">
                  {c.challenge_type}
                </span>
              )}
              {c.industry && (
                <span className="text-sm text-muted-foreground">{c.industry}</span>
              )}
            </div>

            <h1 className="text-3xl font-bold leading-tight">{c.title}</h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {c.xp_reward != null && c.xp_reward > 0 && (
                <span className="flex items-center gap-1.5">
                  <Zap className="size-4 text-amber-500" />
                  <strong className="text-foreground">{c.xp_reward}</strong> XP
                </span>
              )}
              {c.deadline_days != null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  <strong className="text-foreground">{c.deadline_days}</strong> jours
                </span>
              )}
              {totalParticipants > 0 && (
                <ParticipantsDialog participants={avatars} total={totalParticipants} />
              )}
            </div>
          </div>

          {/* Brief (only) */}
          {c.brief && (
            <section className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 p-6 space-y-2">
              <h2 className="text-base font-semibold">Brief</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{c.brief}</p>
            </section>
          )}

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 flex gap-3">
            <span className="text-xl shrink-0">⚠️</span>
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-300">
                Avant de participer
              </p>
              <p className="text-amber-800 dark:text-amber-200/90 text-sm mt-1 leading-relaxed">
                En cliquant sur &quot;Je participe&quot;, tu découvriras le brief complet
                (contexte, livrable, contraintes et critères d&apos;évaluation) et ton chrono
                de <strong>{c.deadline_days ?? 3} jours</strong> démarrera immédiatement.
                Tu ne pourras pas choisir un autre défi avant d&apos;avoir soumis ton travail.
              </p>
            </div>
          </div>

          {/* Other active blocker */}
          {hasOtherActive ? (
            <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Tu as déjà un défi en cours. Termine-le avant d&apos;en rejoindre un autre.
            </div>
          ) : (
            <div className="space-y-3">
              <ParticipateButton challengeId={c.id} deadlineDays={c.deadline_days ?? 3} />
              <div className="text-center">
                <RulesDialog xpReward={c.xp_reward ?? 150} deadlineDays={c.deadline_days ?? 3} />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── State 2+: ACTIVE / SUBMITTED / EXPIRED — full brief + sidebar ───────────
  return (
    <div className="p-6 max-w-[960px] mx-auto pb-16 bg-white dark:bg-background">

      <div className="mb-6">
        <Link href="/dashboard/challenges" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="size-3.5" /> Challenges
        </Link>
      </div>

      {/* Banner après soumission (?just_submitted=approved|rejected|pending) */}
      {justSubmitted && existingSubmission && (() => {
        const sub = existingSubmission as any
        if (justSubmitted === 'approved') {
          return (
            <div className="bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-900/40 rounded-2xl p-4 flex items-center gap-3 mb-6">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300">Travail soumis et validé !</p>
                <p className="text-sm text-green-700 dark:text-green-400/90">
                  +{c.xp_reward ?? 150} XP ajoutés à ton profil.
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
                <p className="font-semibold text-red-800 dark:text-red-300">Travail soumis mais non validé</p>
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
                <p className="font-semibold text-amber-800 dark:text-amber-300">Travail soumis — en attente de validation</p>
                <p className="text-sm text-amber-700 dark:text-amber-400/90">Un admin va examiner ton travail sous 48h.</p>
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
              {c.challenge_type && (
                <span className="text-sm font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground">
                  {c.challenge_type}
                </span>
              )}
              {c.industry && (
                <span className="text-sm text-muted-foreground">{c.industry}</span>
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

          {/* Context */}
          {c.context && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold">Le scénario</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{c.context}</p>
            </section>
          )}

          {/* Deliverable */}
          {c.deliverable && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Package className="size-4 text-muted-foreground" />
                Livrable attendu
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{c.deliverable}</p>
            </section>
          )}

          {/* Constraints */}
          {c.constraints && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <AlertCircle className="size-4 text-muted-foreground" />
                Contraintes
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{c.constraints}</p>
            </section>
          )}

          {/* Evaluation criteria */}
          {c.criteria && (
            <section className="space-y-4">
              <div>
                <h2 className="text-base font-semibold">Critères d&apos;évaluation</h2>
                <p className="text-sm text-muted-foreground mt-1">Ton travail sera évalué sur les critères suivants.</p>
              </div>
              <div className="space-y-3">
                {c.criteria.split(/[.•\n]/).filter((s: string) => s.trim().length > 10).map((criterion: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground leading-relaxed">{criterion.trim()}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Gallery */}
          {allSubmissions && allSubmissions.length > 0 && (
            <section className="space-y-4 pt-2">
              <div className="h-px bg-border" />
              <h2 className="text-base font-semibold">Autres soumissions ({allSubmissions.length})</h2>
              <SubmissionGallery
                submissions={allSubmissions}
                currentUserId={user.id}
                isRevealed={true}
                challengeTitle={c.title}
              />
            </section>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <div className="lg:sticky lg:top-6 space-y-4">

          {participationStatus === 'active' && (
            <div className="rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">Participation active</span>
              </div>
              <CountdownTimer deadline={participation.personal_deadline} label="Deadline dans" />
              <Link
                href={`/dashboard/challenges/${c.id}/submit`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-green-600 text-white text-sm font-semibold h-11 px-4 hover:bg-green-700 transition-colors"
              >
                <Play className="size-4" fill="currentColor" />
                {existingSubmission ? 'Continuer ma soumission' : 'Soumettre mon travail'}
              </Link>
              {totalParticipants > 0 && (
                <div className="pt-0.5">
                  <ParticipantsDialog participants={avatars} total={totalParticipants} />
                </div>
              )}
              <p className="text-[11px] text-center text-muted-foreground font-mono">
                {currentAttempts}/{maxAttempts} soumissions utilisées
              </p>
            </div>
          )}

          {participationStatus === 'expired' && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-red-500" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">Délai expiré</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tu n&apos;as pas soumis dans les {c.deadline_days ?? 3} jours impartis.
              </p>
              <Link
                href="/dashboard/challenges"
                className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400 hover:underline"
              >
                Voir les challenges disponibles →
              </Link>
            </div>
          )}

          {/* Challenge meta card */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Détails</p>
            <div className="space-y-2.5">
              {c.specialty && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Spécialité</span>
                  <span className="font-medium">{c.specialty}</span>
                </div>
              )}
              {c.challenge_type && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{c.challenge_type}</span>
                </div>
              )}
              {c.industry && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Industrie</span>
                  <span className="font-medium">{c.industry}</span>
                </div>
              )}
              {c.deadline_days && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Durée</span>
                  <span className="font-medium">{c.deadline_days} jours</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Participants</span>
                <span className="font-medium">{totalParticipants}</span>
              </div>
            </div>
          </div>

          {/* Ma soumission */}
          {existingSubmission && (
            <MySubmissionCard
              submission={existingSubmission as any}
              challengeId={c.id}
              canResubmit={canResubmit}
              participationStatus={participationStatus}
            />
          )}

        </div>
      </div>
    </div>
  )
}
