import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, Clock, Users } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getDict, getLang, tx } from '@/lib/i18n/lang'
import { localizeChallenge } from '@/lib/challenges/i18n'
import { getTaxonomyMaps, localizeType, localizeIndustry } from '@/lib/challenges/refs'
import { ChallengeBriefSections } from '@/components/features/challenge/ChallengeBriefSections'
import { SubmissionGallery } from '@/components/features/challenge/SubmissionGallery'

export const dynamic = 'force-dynamic'

type ChallengeRow = {
  id: string
  title: string
  brief: string
  context: string | null
  deliverable: string | null
  constraints: string | null
  criteria: string | null
  specialty: string | null
  challenge_type: string | null
  industry: string | null
  emoji: string | null
  xp_reward: number | null
  deadline_days: number | null
  updated_at: string
  is_published: boolean
}

type SubmissionRow = {
  id: string
  cover_url: string
  is_visible: boolean
  total_likes: number | null
  comments_count: number
  user_id: string
  created_at: string
  profiles: { username: string; avatar_url: string | null; league: string; plan: string | null } | null
}

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const lang = await getLang()
  const { data } = await (supabaseAdmin as any)
    .from('challenges')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  const raw = data as { is_published?: boolean } | null
  if (!raw || !raw.is_published) {
    return { title: 'Challenge — Kreevo' }
  }
  const row = localizeChallenge(data, lang) as { title: string; brief: string }

  const description = row.brief.length > 160 ? row.brief.slice(0, 157) + '…' : row.brief

  return {
    title: `${row.title} | Kreevo`,
    description,
    alternates: { canonical: `/challenges/${id}` },
    openGraph: {
      title: `${row.title} | Kreevo`,
      description,
      url: `/challenges/${id}`,
      siteName: 'Kreevo',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${row.title} | Kreevo`,
      description,
    },
  }
}

function specialtyEmoji(specialty: string | null, fallback: string | null): string {
  if (fallback) return fallback
  if (!specialty) return '🎯'
  if (/ux/i.test(specialty)) return '📱'
  if (/ui/i.test(specialty)) return '🎨'
  if (/graphic/i.test(specialty)) return '✏️'
  return '🎯'
}

export default async function PublicChallengeDetailPage({ params }: Props) {
  const { id } = await params
  const dict = await getDict()
  const lang = await getLang()
  const t = dict.publicChallenges
  const td = dict.challengeDetail

  // Anonymous client to detect logged-in viewer (no redirect, no gating).
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  const isLoggedIn = !!user

  // Fetch challenge + community signals in parallel.
  const [{ data: challengeData }, { data: submissionsData }, { count: participantsCount }] = await Promise.all([
    (supabaseAdmin as any)
      .from('challenges')
      .select('*')
      .eq('id', id)
      .maybeSingle(),
    (supabaseAdmin as any)
      .from('submissions')
      .select('id, cover_url, is_visible, total_likes, comments_count, user_id, created_at, profiles:user_id(username, avatar_url, league, plan)')
      .eq('challenge_id', id)
      .eq('is_draft', false)
      .eq('validation_status', 'approved')
      .order('total_likes', { ascending: false }),
    (supabaseAdmin as any)
      .from('participations')
      .select('id', { count: 'exact', head: true })
      .eq('challenge_id', id),
  ])

  const challengeRaw = challengeData as ChallengeRow | null
  if (!challengeRaw || !challengeRaw.is_published) notFound()
  const challenge = localizeChallenge(challengeRaw, lang)
  const taxoMaps = await getTaxonomyMaps()
  const typeLabel = localizeType(challenge, lang, taxoMaps)
  const industryLabel = localizeIndustry(challenge, lang, taxoMaps)

  const rawSubmissions = (submissionsData ?? []) as SubmissionRow[]
  // Gallery's Submission shape uses `profiles?: {...}` (undefined-friendly), so
  // we normalize the Supabase null into undefined before passing.
  const submissions = rawSubmissions.map((s) => ({
    ...s,
    profiles: s.profiles ?? undefined,
  }))
  const ctaHref = isLoggedIn ? `/dashboard/challenges/${challenge.id}` : `/signup?next=/challenges/${challenge.id}`
  const ctaLabel = isLoggedIn ? t.detail.ctaParticipateLoggedIn : t.detail.ctaParticipateLoggedOut

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal public nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <Link href="/" className="text-base font-bold tracking-tight">kreevo</Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {dict.landing.nav.signIn}
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-full hover:opacity-85 transition-opacity"
          >
            {dict.landing.nav.getStarted} <ArrowRight className="size-3" />
          </Link>
        </div>
      </nav>

      <main className="max-w-[1080px] mx-auto px-6 py-8 sm:py-12 space-y-10">
        {/* Breadcrumb */}
        <Link
          href="/challenges"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" /> {t.detail.backToList}
        </Link>

        {/* 2-col layout */}
        <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-start">
          {/* MAIN */}
          <div className="space-y-8 min-w-0">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap text-sm">
                {challenge.specialty && (
                  <span className="font-semibold px-3 py-1 rounded-full bg-muted text-foreground">
                    {challenge.specialty}
                  </span>
                )}
                {typeLabel && (
                  <span className="font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground">
                    {typeLabel}
                  </span>
                )}
                {industryLabel && (
                  <span className="text-muted-foreground">{industryLabel}</span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground ms-auto">
                  <Users className="size-3.5" />
                  {tx(t.detail.participantsCount, { n: participantsCount ?? 0 })}
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-4xl leading-none mt-1">{specialtyEmoji(challenge.specialty, challenge.emoji)}</div>
                <div className="space-y-3 min-w-0">
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">{challenge.title}</h1>
                  {challenge.brief && (
                    <p className="text-base text-muted-foreground leading-relaxed">{challenge.brief}</p>
                  )}
                </div>
              </div>
            </div>

            <ChallengeBriefSections challenge={challenge} t={td.sections} />

            {/* Community submissions */}
            <section className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl font-semibold"><span className="me-1">🖼️</span>{t.detail.submissionsHeading}</h2>
              {submissions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  {t.detail.submissionsEmpty}
                </div>
              ) : (
                <SubmissionGallery
                  submissions={submissions}
                  currentUserId={null}
                  challengeTitle={challenge.title}
                  t={td.gallery}
                />
              )}
            </section>
          </div>

          {/* SIDEBAR — sticky CTA */}
          <aside className="lg:sticky lg:top-6 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div className="space-y-2">
                {challenge.xp_reward != null && challenge.xp_reward > 0 && (
                  <div className="inline-flex items-center gap-1.5 text-sm font-mono font-semibold">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/xp-flash.svg" alt="" className="size-4" />
                    +{challenge.xp_reward} XP
                  </div>
                )}
                {challenge.deadline_days != null && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-3.5" />
                    {challenge.deadline_days} {t.cardDays}
                  </div>
                )}
              </div>

              <Link
                href={ctaHref}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm h-11 px-4 hover:opacity-90 transition-opacity"
              >
                {ctaLabel} <ArrowRight className="size-4" />
              </Link>

              {!isLoggedIn && (
                <p className="text-xs text-muted-foreground leading-relaxed">{t.detail.ctaHint}</p>
              )}
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-border/50 px-6 py-6 mt-12 flex items-center justify-between">
        <span className="text-xs font-bold tracking-tight">kreevo</span>
        <p className="text-xs font-mono text-muted-foreground">© {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
