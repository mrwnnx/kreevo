import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock, ChevronLeft, Target, Package, AlertCircle, Star, Users } from 'lucide-react'
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
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('challenges').select('*').eq('id', id).single(),
    (supabase as any).from('participations').select('*').eq('challenge_id', id).eq('user_id', user.id).single(),
    (supabase.from('submissions') as any).select('*').eq('challenge_id', id).eq('user_id', user.id).single(),
    (supabase.from('submissions') as any).select('*, profiles(username, avatar_url, league)').eq('challenge_id', id).order('likes_count', { ascending: false }),
    (supabase as any).from('participations').select('*', { count: 'exact', head: true }).eq('challenge_id', id),
  ])

  if (!profile) redirect('/login')
  if (!challenge) notFound()

  const c = challenge as Challenge
  const p = profile as Profile
  const isClosed = c.closes_at ? new Date(c.closes_at) < new Date() : false
  const isRevealed = c.reveal_at ? new Date(c.reveal_at) <= new Date() : isClosed
  const totalParticipants = participantCount ?? 0

  // Resolve participation state
  const hasParticipation = !!participation
  const deadlinePassed = hasParticipation
    ? new Date(participation.personal_deadline) < new Date()
    : false
  const participationStatus: 'none' | 'active' | 'expired' | 'submitted' = !hasParticipation
    ? 'none'
    : participation.status === 'submitted'
    ? 'submitted'
    : deadlinePassed || participation.status === 'expired'
    ? 'expired'
    : 'active'

  // Attempt limits: Free=2, Pro=3
  const maxAttempts = p.plan === 'pro' ? 3 : 2
  const currentAttempts = (existingSubmission as any)?.attempt_number ?? (existingSubmission ? 1 : 0)
  const attemptsLeft = maxAttempts - currentAttempts
  const canResubmit = participationStatus === 'active' && attemptsLeft > 0

  return (
    <div className="pb-10">
      
      <div className="p-6 max-w-4xl mx-auto space-y-6">

        {/* Back */}
        <Link href="/dashboard/challenges" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="size-4" /> All Challenges
        </Link>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-medium text-violet-600 uppercase tracking-wide mb-1">{c.track}</p>
              <h1 className="text-3xl font-bold">{c.title}</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="capitalize">{c.level}</Badge>
              {isClosed ? (
                <Badge variant="destructive">Fermé</Badge>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                  <Clock className="size-3.5" />
                  {c.closes_at ? `Ferme le ${new Date(c.closes_at).toLocaleDateString('fr', { day: 'numeric', month: 'short' })}` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Participant counter */}
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" />
            <span>
              {isRevealed
                ? `${allSubmissions?.length ?? 0} travaux soumis`
                : `${totalParticipants} designer${totalParticipants !== 1 ? 's' : ''} ${totalParticipants !== 1 ? 'participent' : 'participe'}`}
            </span>
          </div>
        </div>

        <Separator />

        {/* Brief */}
        <div className="grid md:grid-cols-2 gap-6">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <span className="size-6 rounded-md bg-violet-100 flex items-center justify-center text-xs">📋</span>
              Brief
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{c.brief}</p>
          </section>

          {c.context && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <span className="size-6 rounded-md bg-blue-100 flex items-center justify-center text-xs">🔍</span>
                Context
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.context}</p>
            </section>
          )}

          {c.deliverable && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Package className="size-4 text-green-600" />
                Deliverable
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.deliverable}</p>
            </section>
          )}

          {c.constraints && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="size-4 text-orange-500" />
                Constraints
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.constraints}</p>
            </section>
          )}

          {c.criteria && (
            <section className="space-y-2 md:col-span-2">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Star className="size-4 text-yellow-500" />
                Evaluation Criteria
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.criteria}</p>
            </section>
          )}
        </div>

        <Separator />

        {/* Participation section — 4 states */}
        <section className="space-y-4">

          {/* STATE 1 — Pas participé */}
          {participationStatus === 'none' && !isClosed && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Rejoins ce challenge</h2>
              <ParticipateButton challengeId={c.id} />
            </div>
          )}

          {participationStatus === 'none' && isClosed && (
            <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
              Ce challenge est fermé aux nouvelles participations.
            </div>
          )}

          {/* STATE 2 — Participé, deadline en cours */}
          {participationStatus === 'active' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-semibold">Ta participation — En cours</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    Soumission {currentAttempts}/{maxAttempts}
                  </span>
                </div>

                <CountdownTimer
                  deadline={participation.personal_deadline}
                  label="Il te reste"
                />

                <p className="text-xs text-muted-foreground">
                  Deadline personnelle : {new Date(participation.personal_deadline).toLocaleDateString('fr', {
                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>

              <h2 className="text-lg font-semibold">
                {existingSubmission ? 'Modifier ta soumission' : 'Soumettre ton travail'}
              </h2>
              <SubmitForm
                challengeId={c.id}
                existing={existingSubmission as Submission | null}
                isClosed={false}
                participationId={participation.id}
                attemptsLeft={attemptsLeft}
              />
            </div>
          )}

          {/* STATE 3 — Deadline expirée, pas soumis */}
          {participationStatus === 'expired' && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-red-500" />
                <span className="text-sm font-semibold text-red-700">Délai expiré</span>
              </div>
              <p className="text-sm text-red-600">
                Tu n&apos;as pas soumis dans les 3 jours impartis.<br />
                Rejoins le prochain challenge pour continuer à progresser !
              </p>
              <Link
                href="/dashboard/challenges"
                className="inline-flex items-center gap-2 text-sm font-medium text-red-700 underline underline-offset-2"
              >
                Voir les challenges disponibles →
              </Link>
            </div>
          )}

          {/* STATE 4 — Soumis */}
          {participationStatus === 'submitted' && existingSubmission && (
            <div className="space-y-4">
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-lg">✅</span>
                  <span className="text-sm font-semibold text-green-700">
                    Soumission reçue ! {attemptsLeft > 0 && canResubmit && `(${attemptsLeft} modification${attemptsLeft > 1 ? 's' : ''} restante${attemptsLeft > 1 ? 's' : ''})`}
                  </span>
                </div>

                {(existingSubmission as any).cover_url && (
                  <div className="relative overflow-hidden rounded-lg border">
                    <img
                      src={(existingSubmission as any).cover_url}
                      alt="Votre soumission"
                      className={`w-full max-h-48 object-cover ${!isRevealed ? 'blur-md' : ''}`}
                    />
                    {!isRevealed && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-white font-semibold bg-black/40 px-4 py-2 rounded-full text-sm backdrop-blur-sm">
                          Reveal collectif bientôt
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {!isRevealed && c.closes_at && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Reveal dans</p>
                    <CountdownTimer deadline={c.closes_at} compact />
                  </div>
                )}
              </div>

              {canResubmit && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold">Modifier ta soumission</h2>
                  <SubmitForm
                    challengeId={c.id}
                    existing={existingSubmission as Submission | null}
                    isClosed={false}
                    participationId={participation.id}
                    attemptsLeft={attemptsLeft}
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {/* Gallery */}
        {allSubmissions && allSubmissions.length > 0 && (
          <>
            <Separator />
            <section>
              <h2 className="text-lg font-semibold mb-4">
                {isRevealed ? `${allSubmissions.length} travaux` : 'Galerie'}
              </h2>
              <SubmissionGallery
                submissions={allSubmissions}
                currentUserId={user.id}
                isRevealed={isRevealed}
                challengeTitle={c.title}
              />
            </section>
          </>
        )}
      </div>
    </div>
  )
}
