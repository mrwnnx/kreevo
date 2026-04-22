'use server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { Clock, ChevronLeft, Users, CheckCircle2, Target, Package, AlertCircle, Star, Zap, Play } from 'lucide-react'
import Link from 'next/link'
import { SubmitForm } from '@/components/features/challenge/SubmitForm'
import { SubmissionGallery } from '@/components/features/challenge/SubmissionGallery'
import { CountdownTimer } from '@/components/features/challenge/CountdownTimer'
import { ParticipateButton } from '@/components/features/challenge/ParticipateButton'
import type { Profile, Challenge, Submission } from '@/types/database.types'

interface Props { params: Promise<{ id: string }> }

export default async function ChallengePage({ params }: Props) {
  const { id } = await params
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
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('challenges').select('*').eq('id', id).single(),
    (supabase as any).from('participations').select('*').eq('challenge_id', id).eq('user_id', user.id).single(),
    (supabase.from('submissions') as any).select('*').eq('challenge_id', id).eq('user_id', user.id).single(),
    (supabase.from('submissions') as any).select('*, profiles(username, avatar_url, league)').eq('challenge_id', id).order('likes_count', { ascending: false }),
    supabaseAdmin.from('participations' as any).select('*', { count: 'exact', head: true }).eq('challenge_id', id),
    supabaseAdmin.from('participations' as any).select('profiles(username, avatar_url)').eq('challenge_id', id).limit(6),
  ])

  console.log('[challenge page] participantCount:', participantCount, '| participantAvatars:', JSON.stringify(participantAvatars)?.slice(0, 200))

  if (!profile) redirect('/login')
  if (!challenge) notFound()

  const c = challenge as Challenge
  const p = profile as Profile
  const isClosed = c.closes_at ? new Date(c.closes_at) < new Date() : false
  const isRevealed = c.reveal_at ? new Date(c.reveal_at) <= new Date() : isClosed
  const totalParticipants = participantCount ?? 0

  const hasParticipation = !!participation
  const deadlinePassed = hasParticipation ? new Date(participation.personal_deadline) < new Date() : false
  const participationStatus: 'none' | 'active' | 'expired' | 'submitted' = !hasParticipation
    ? 'none'
    : participation.status === 'submitted' ? 'submitted'
    : deadlinePassed || participation.status === 'expired' ? 'expired'
    : 'active'

  const maxAttempts = p.plan === 'pro' ? 3 : 2
  const currentAttempts = (existingSubmission as any)?.attempt_number ?? (existingSubmission ? 1 : 0)
  const attemptsLeft = maxAttempts - currentAttempts
  const canResubmit = participationStatus === 'active' && attemptsLeft > 0

  const avatars = ((participantAvatars ?? []) as any[]).map(r => r.profiles).filter(Boolean)

  const TRACK_COLOR: Record<string, string> = {
    UX:      'text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400',
    UI:      'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
    Graphic: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20 dark:text-pink-400',
    Motion:  'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400',
  }
  const trackColor = TRACK_COLOR[c.track ?? ''] ?? 'text-muted-foreground bg-muted'

  return (
    <div className="p-6 max-w-[960px] mx-auto pb-16">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link href="/dashboard/challenges" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ChevronLeft className="size-3.5" /> Challenges
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[280px]">{c.title}</span>
      </div>

      {/* 2-col layout */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-start">

        {/* ── MAIN CONTENT ── */}
        <div className="space-y-8 min-w-0">

          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${trackColor}`}>
                {c.track}
              </span>
              <Badge variant="secondary" className="capitalize">{c.level}</Badge>
              {isClosed ? (
                <Badge variant="destructive">Fermé</Badge>
              ) : c.closes_at && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 px-2.5 py-1 rounded-full">
                  <Clock className="size-3" />
                  Ferme le {new Date(c.closes_at).toLocaleDateString('fr', { day: 'numeric', month: 'short' })}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="size-3.5" />
                {isRevealed
                  ? `${allSubmissions?.length ?? 0} soumissions`
                  : `${totalParticipants} participant${totalParticipants !== 1 ? 's' : ''}`}
              </span>
            </div>

            <h1 className="text-3xl font-bold leading-tight">{c.title}</h1>

            {c.brief && (
              <p className="text-base text-muted-foreground leading-relaxed">{c.brief}</p>
            )}
          </div>

          {/* Scenario / Context */}
          {c.context && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold">Le scénario</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.context}</p>
            </section>
          )}

          {/* Deliverable */}
          {c.deliverable && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Package className="size-4 text-muted-foreground" />
                Livrable attendu
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.deliverable}</p>
            </section>
          )}

          {/* Constraints */}
          {c.constraints && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <AlertCircle className="size-4 text-muted-foreground" />
                Contraintes
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.constraints}</p>
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
                {c.criteria.split(/[.•\n]/).filter(s => s.trim().length > 10).map((criterion, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground leading-relaxed">{criterion.trim()}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Submit form (state active) ── */}
          {participationStatus === 'active' && (
            <section id="submit" className="space-y-5 pt-2">
              <div className="h-px bg-border" />
              <div className="rounded-xl border border-border bg-zinc-50 dark:bg-zinc-900/20 p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-semibold">Ta participation — En cours</span>
                  <span className="text-xs text-muted-foreground font-mono ml-2">{currentAttempts}/{maxAttempts} soumissions</span>
                </div>
                <CountdownTimer deadline={participation.personal_deadline} label="Il te reste" compact />
              </div>

              <h2 className="text-base font-semibold">
                {existingSubmission ? 'Modifier ta soumission' : 'Soumettre ton travail'}
              </h2>
              <SubmitForm
                challengeId={c.id}
                existing={existingSubmission as Submission | null}
                isClosed={false}
                participationId={participation.id}
                attemptsLeft={attemptsLeft}
              />
            </section>
          )}

          {/* ── Resubmit (submitted + can resubmit) ── */}
          {participationStatus === 'submitted' && canResubmit && (
            <section className="space-y-3 pt-2">
              <div className="h-px bg-border" />
              <h2 className="text-sm font-semibold">Modifier ta soumission</h2>
              <SubmitForm
                challengeId={c.id}
                existing={existingSubmission as Submission | null}
                isClosed={false}
                participationId={participation.id}
                attemptsLeft={attemptsLeft}
              />
            </section>
          )}

          {/* ── Gallery ── */}
          {allSubmissions && allSubmissions.length > 0 && (
            <section className="space-y-4 pt-2">
              <div className="h-px bg-border" />
              <h2 className="text-base font-semibold">
                {isRevealed ? `${allSubmissions.length} travaux soumis` : 'Galerie'}
              </h2>
              <SubmissionGallery
                submissions={allSubmissions}
                currentUserId={user.id}
                isRevealed={isRevealed}
                challengeTitle={c.title}
              />
            </section>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <div className="lg:sticky lg:top-6 space-y-4">

          {/* STATE: none */}
          {participationStatus === 'none' && !isClosed && (
            <div className="rounded-xl border border-border overflow-hidden">
              {/* Decorative top */}
              <div className="h-24 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Target className="size-6 text-primary" />
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="font-semibold text-sm">Soumettre ton travail</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Rejoins ce challenge et soumets ton design pour recevoir du feedback et progresser.
                  </p>
                </div>
                <ParticipateButton challengeId={c.id} />
                {avatars.length > 0 && (
                  <div className="flex items-center justify-center gap-2">
                    <AvatarGroup>
                      {avatars.slice(0, 4).map((av: any, i: number) => (
                        <Avatar key={i} size="sm">
                          <AvatarImage src={av.avatar_url ?? undefined} />
                          <AvatarFallback>{av.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                      ))}
                      {totalParticipants > 4 && (
                        <AvatarGroupCount>+{totalParticipants - 4}</AvatarGroupCount>
                      )}
                    </AvatarGroup>
                    <span className="text-xs text-muted-foreground">
                      {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Zap className="size-3 text-yellow-500" />
                  <span>Gagne +150 XP à la soumission</span>
                </div>
              </div>
            </div>
          )}

          {participationStatus === 'none' && isClosed && (
            <div className="rounded-xl border border-dashed p-4 text-center space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Challenge fermé</p>
              <p className="text-xs text-muted-foreground">Ce challenge n&apos;accepte plus de nouvelles participations.</p>
              <Link
                href="/dashboard/challenges"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline mt-1"
              >
                Voir les challenges actifs →
              </Link>
            </div>
          )}

          {/* STATE: active */}
          {participationStatus === 'active' && (
            <div className="rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">Participation active</span>
              </div>
              <CountdownTimer deadline={participation.personal_deadline} label="Deadline dans" />
              <a
                href="#submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-green-600 text-white text-xs font-medium h-8 px-4 hover:bg-green-700 transition-colors"
              >
                <Play className="size-3" fill="currentColor" />
                Soumettre mon travail
              </a>
              {avatars.length > 0 && (
                <div className="flex items-center gap-2 pt-0.5">
                  <AvatarGroup>
                    {avatars.slice(0, 4).map((av: any, i: number) => (
                      <Avatar key={i} size="sm">
                        <AvatarImage src={av.avatar_url ?? undefined} />
                        <AvatarFallback>{av.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ))}
                    {totalParticipants > 4 && (
                      <AvatarGroupCount>+{totalParticipants - 4}</AvatarGroupCount>
                    )}
                  </AvatarGroup>
                  <span className="text-[11px] text-muted-foreground">
                    {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              <p className="text-[11px] text-center text-muted-foreground font-mono">
                {currentAttempts}/{maxAttempts} soumissions utilisées
              </p>
            </div>
          )}

          {/* STATE: submitted */}
          {participationStatus === 'submitted' && existingSubmission && (
            <div className="rounded-xl border border-border overflow-hidden">
              {(existingSubmission as any).cover_url && (
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={(existingSubmission as any).cover_url}
                    alt="Ta soumission"
                    className={`w-full h-full object-cover ${!isRevealed ? 'blur-md scale-105' : ''}`}
                  />
                  {!isRevealed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                      <p className="text-white text-xs font-semibold bg-black/40 px-3 py-1.5 rounded-full">
                        Reveal bientôt
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">Soumission reçue !</span>
                </div>
                {!isRevealed && c.closes_at && (
                  <div className="space-y-1">
                    <p className="text-[11px] text-muted-foreground">Reveal collectif dans</p>
                    <CountdownTimer deadline={c.closes_at} compact />
                  </div>
                )}
                {canResubmit && (
                  <p className="text-[11px] text-muted-foreground">
                    {attemptsLeft} modification{attemptsLeft > 1 ? 's' : ''} restante{attemptsLeft > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STATE: expired */}
          {participationStatus === 'expired' && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-red-500" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">Délai expiré</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tu n&apos;as pas soumis dans les 3 jours impartis.
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
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Niveau</span>
                <span className="font-medium capitalize">{c.level}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Track</span>
                <span className="font-medium">{c.track}</span>
              </div>
              {c.closes_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fermeture</span>
                  <span className="font-medium">
                    {new Date(c.closes_at).toLocaleDateString('fr', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Participants</span>
                <span className="font-medium">{totalParticipants}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
