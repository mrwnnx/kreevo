import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ProBadge } from '@/components/ui/ProBadge'
import { Separator } from '@/components/ui/separator'
import {
  MapPin,
  Heart, MessageCircle, Lock, ExternalLink, Mail,
  Trophy, Star,
} from 'lucide-react'
import { XpIcon } from '@/components/ui/XpIcon'
import type { Profile } from '@/types/database.types'
import { getDict } from '@/lib/i18n/lang'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'
import { SocialLogo } from '@/components/onboarding/SocialLogo'
import { defForKey } from '@/components/onboarding/socials'
import { profilePageSchema } from '@/lib/seo/jsonld'

// ── League display config (DB names) ───────────────────────────
const LEAGUE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  Stone:    { label: 'Stone',    color: '#475569', bg: '#F1F5F9', border: '#94A3B8' },
  Bronze:   { label: 'Bronze',   color: '#92400E', bg: '#FEF3C7', border: '#B45309' },
  Silver:   { label: 'Silver',   color: '#374151', bg: '#F3F4F6', border: '#9CA3AF' },
  Gold:     { label: 'Gold',     color: '#92400E', bg: '#FFFBEB', border: '#F59E0B' },
  Platinum: { label: 'Platinum', color: '#0E7490', bg: '#ECFEFF', border: '#22D3EE' },
  Diamond:  { label: 'Diamond',  color: '#1E40AF', bg: '#EFF6FF', border: '#3B82F6' },
  Master:   { label: 'Master',   color: '#5B21B6', bg: '#F5F3FF', border: '#8B5CF6' },
  Legend:   { label: 'Legend',   color: '#991B1B', bg: '#FEF2F2', border: '#EF4444' },
}

function getLeague(league: string) {
  return LEAGUE_CONFIG[league] ?? LEAGUE_CONFIG.Stone
}

// ── Links parser ───────────────────────────────────────────────
function parseLinks(links: unknown): Record<string, string> {
  if (!links || typeof links !== 'object') return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(links as Record<string, unknown>)) {
    if (typeof v === 'string' && v.trim().length > 0) out[k] = v
  }
  return out
}

// ── Rank calculation ───────────────────────────────────────────
function getRankLabel(rank: number, total: number): string {
  const pct = Math.round((rank / total) * 100)
  if (pct <= 1)  return 'top1'
  if (pct <= 5)  return 'top5'
  if (pct <= 10) return 'top10'
  if (pct <= 25) return 'top25'
  if (pct <= 50) return 'top50'
  return 'participant'
}

// ── Metadata ───────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()
  const { data: rawProfile } = await supabase
    .from('profiles').select('full_name,specialty,bio,league,avatar_url').eq('username', username).single()
  const profile = rawProfile as any

  if (!profile) {
    const dict = await getDict()
    return { title: dict.publicProfile.notFoundFull }
  }

  const name = profile.full_name ?? username
  const specialty = profile.specialty ? ` · ${profile.specialty}` : ''
  const league = getLeague(profile.league ?? 'Stone')

  const ogTitle = `${name} | Kreevo`
  const ogDescription = profile.bio ?? `${name} is a designer on Kreevo.`

  return {
    title: `${name}${specialty} | Kreevo`,
    description: profile.bio
      ? `${profile.bio} | League ${league.label} | Kreevo designer`
      : `${name} — Designer on Kreevo. League ${league.label}.`,
    alternates: {
      canonical: `/u/${username}`,
    },
    // `images` intentionally omitted — Next resolves the colocated
    // opengraph-image.tsx file automatically and produces a richer card
    // (avatar + name + league color) than the bare avatar URL would.
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: `/u/${username}`,
      siteName: 'Kreevo',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
    },
  }
}

// ── Page ───────────────────────────────────────────────────────
export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>
  searchParams: Promise<{ track?: string }>
}) {
  const { username } = await params
  const sp = await searchParams
  const activeTrack = sp.track?.trim() || 'All'
  const supabase = await createClient()

  const [
    { data: profile },
    { count: totalUsers },
    { data: { user: viewer } },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('username', username).single(),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.auth.getUser(),
  ])

  if (!profile) notFound()

  const p = profile as Profile
  const social = parseLinks(p.links)
  const league = getLeague(p.league ?? 'Stone')
  const isPro = p.plan === 'pro' || p.plan === 'studio'

  // Resolve the viewer's own profile to render the logged-in nav (avatar) and the own-profile banner.
  const isLoggedIn = !!viewer
  const isOwnProfile = isLoggedIn && viewer.id === p.id
  let viewerProfile: { username: string; avatar_url: string | null } | null = null
  if (isLoggedIn) {
    if (isOwnProfile) {
      viewerProfile = { username: p.username, avatar_url: p.avatar_url ?? null }
    } else {
      const { data: vp } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', viewer.id)
        .single()
      if (vp) viewerProfile = { username: (vp as any).username, avatar_url: (vp as any).avatar_url ?? null }
    }
  }

  const [
    { data: allSubmissions, count: submissionCount },
    { data: badges },
    { data: rankData },
  ] = await Promise.all([
    supabase
      .from('submissions')
      .select('*, challenges(title, specialty, challenge_type, industry)', { count: 'exact' })
      .eq('user_id', p.id)
      .eq('is_visible', true)
      .eq('is_draft', false)
      .eq('validation_status', 'approved')
      .order('created_at', { ascending: false }),
    supabase.from('badges').select('*').eq('user_id', p.id),
    supabase
      .from('profiles')
      .select('id')
      .gte('xp', p.xp)
      .neq('id', p.id),
  ])

  const rank = (rankData?.length ?? 0) + 1
  const dict = await getDict()
  const t = dict.publicProfile

  // Build Person/ProfilePage JSON-LD — fields with no real value are omitted by the helper.
  const badgeAwards = ((badges ?? []) as Array<{ badge_type: string }>)
    .map((b) => b.badge_type.replace(/_/g, ' '))
  const profileLd = profilePageSchema({
    username: p.username,
    name: p.full_name ?? p.username,
    avatarUrl: p.avatar_url,
    jobTitle: p.job_title,
    city: p.city,
    country: p.country,
    sameAs: Object.values(social),
    awards: badgeAwards,
  })
  const rankKey = getRankLabel(rank, Math.max(totalUsers ?? 1, 1))
  const rankLabel = t.rankLabels[rankKey as keyof typeof t.rankLabels]
  const submissions = (allSubmissions ?? []) as any[]
  const top3 = [...submissions]
    .sort((a, b) => (b.total_likes ?? 0) - (a.total_likes ?? 0))
    .slice(0, 3)
  const filteredSubmissions =
    activeTrack === 'All'
      ? submissions
      : submissions.filter((s) => s.challenges?.specialty === activeTrack)

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileLd) }}
      />
      {/* ── Nav bar ────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <Link href={isLoggedIn ? '/dashboard' : '/'} className="text-sm font-bold tracking-tight">kreevo</Link>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                {t.navDashboard}
              </Link>
              <Link
                href={viewerProfile ? `/u/${viewerProfile.username}` : '/dashboard'}
                className="block size-8 rounded-full bg-muted overflow-hidden ring-2 ring-background hover:opacity-80 transition-opacity"
                aria-label={t.navMyProfile}
                title={t.navMyProfile}
              >
                {viewerProfile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={viewerProfile.avatar_url} alt={viewerProfile.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-muted-foreground">
                    {viewerProfile?.username?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
              <Link href="/signup" className="text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity">
                Join free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Own-profile banner — visible only when the viewer is looking at their own /u page */}
      {isOwnProfile && (
        <div className="border-b border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 px-6 py-2.5">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 text-xs">
            <span className="text-amber-800 dark:text-amber-300">{t.ownProfileBanner}</span>
            <Link href="/dashboard/settings" className="font-semibold text-amber-900 dark:text-amber-200 hover:underline whitespace-nowrap">
              {t.ownProfileManage} →
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <section className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          <Avatar className="size-24 rounded-2xl shrink-0 border-2 border-border">
            <AvatarImage src={p.avatar_url ?? undefined} />
            <AvatarFallback className="rounded-2xl text-2xl font-bold bg-primary/10 text-primary">
              {(p.full_name ?? p.username)[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">
                  {p.full_name ?? p.username}
                </h1>
                {/* League badge */}
                <span
                  className="text-xs font-mono font-medium px-2 py-0.5 rounded-full border"
                  style={{ color: league.color, background: league.bg, borderColor: league.border }}
                >
                  {league.label}
                </span>
                {/* Pro badge */}
                {isPro && (
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Pro Member
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-mono mt-0.5 inline-flex items-center gap-1.5">
                @{p.username}
                <ProBadge plan={p.plan} />
              </p>
              {p.job_title && (
                <p className="text-sm font-medium text-foreground mt-1">{p.job_title}</p>
              )}
            </div>

            {/* Specialty + location */}
            <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
              {p.specialty && <span className="font-medium text-foreground">{p.specialty}</span>}
              {(p.city || p.country) && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {[p.city, p.country].filter(Boolean).join(', ')}
                </span>
              )}
            </div>

            {/* Bio */}
            {p.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">{p.bio}</p>
            )}

            {/* Social links + Contact */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {Object.entries(social).map(([key, url]) => {
                const def = defForKey(key)
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={def.name}
                    title={def.name}
                  >
                    <SocialLogo def={def} variant="soft" />
                  </a>
                )
              })}
              {isPro && (
                <button className="flex items-center gap-1.5 text-xs font-semibold bg-foreground text-background px-3 py-1.5 rounded-md hover:opacity-80 transition-opacity ml-1">
                  <Mail className="size-3.5" /> {t.contact}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── STATS BAR ──────────────────────────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: XpIcon, label: t.stats.totalXp,    value: (p.xp ?? 0).toLocaleString(), mono: true },
            { icon: Trophy, label: t.stats.challenges, value: String(submissionCount ?? 0), mono: true },
            { icon: Star,   label: t.stats.league,     value: league.label, mono: false },
            { icon: Trophy, label: t.stats.rank,       value: rankLabel, mono: true },
          ].map(({ icon: Icon, label, value, mono }) => (
            <div key={label} className="border border-border rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="size-3.5" /> {label}
              </div>
              <p className={`text-xl font-semibold ${mono ? 'font-mono' : ''}`}>{value}</p>
            </div>
          ))}
        </section>

        {/* ── TOP 3 PROJETS ──────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-base font-bold tracking-tight">{t.featuredWork}</h2>

          {isPro ? (
            top3.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-4">
                {top3.map((s: any) => (
                  <SubmissionCard key={s.id} submission={s} featured />
                ))}
              </div>
            ) : (
              <EmptyState text={t.empty.noFeatured} />
            )
          ) : (
            <div className="relative">
              {/* Blurred preview */}
              {submissions.slice(0, 3).length > 0 && (
                <div className="grid md:grid-cols-3 gap-4 opacity-30 blur-sm pointer-events-none select-none">
                  {submissions.slice(0, 3).map((s: any) => (
                    <SubmissionCard key={s.id} submission={s} featured />
                  ))}
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-sm rounded-xl border border-dashed border-border">
                <Lock className="size-5 text-muted-foreground" />
                <p className="text-sm font-semibold">{t.featuredProGate}</p>
                <Link href="/signup" className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-md font-semibold hover:opacity-90 transition-opacity">
                  {t.upgradeProCta}
                </Link>
              </div>
            </div>
          )}
        </section>

        <Separator />

        {/* ── ALL SUBMISSIONS ────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-base font-bold tracking-tight">{t.allWork}</h2>
          <TrackFilter
            allSubmissions={submissions}
            visibleSubmissions={filteredSubmissions}
            activeTrack={activeTrack}
            username={p.username}
            t={t}
          />
        </section>

        {/* ── BADGES ─────────────────────────────────────────────── */}
        {badges && badges.length > 0 && (
          <>
            <Separator />
            <section className="space-y-4">
              <h2 className="text-base font-bold tracking-tight">{t.badges}</h2>
              <div className="flex flex-wrap gap-3">
                {badges.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-2 border border-border rounded-lg px-3 py-2">
                    <span className="text-lg">{b.metadata?.icon ?? '🏅'}</span>
                    <div>
                      <p className="text-xs font-semibold capitalize">{b.badge_type.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {new Date(b.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────

function SubmissionCard({ submission: s, featured }: { submission: any; featured?: boolean }) {
  return (
    <div className="group border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
      {s.cover_url ? (
        <div className="aspect-video bg-muted overflow-hidden">
          <img
            src={s.cover_url}
            alt={s.challenges?.title ?? 'Submission'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-video bg-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground font-mono">No preview</span>
        </div>
      )}
      <div className="p-3 space-y-2">
        <p className="text-xs font-semibold leading-snug truncate">
          {s.challenges?.title ?? 'Challenge'}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground">
            {[s.challenges?.specialty, s.challenges?.challenge_type, s.challenges?.industry].filter(Boolean).join(' · ')}
          </span>
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Heart className="size-3" /> {s.total_likes ?? 0}
            </span>
            <span className="flex items-center gap-0.5">
              <MessageCircle className="size-3" /> {s.comments_count ?? 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function TrackFilter({
  allSubmissions,
  visibleSubmissions,
  activeTrack,
  username,
  t,
}: {
  allSubmissions: any[]
  visibleSubmissions: any[]
  activeTrack: string
  username: string
  t: Dictionary['publicProfile']
}) {
  const specialties = ['All', ...Array.from(new Set(allSubmissions.map((s: any) => s.challenges?.specialty).filter(Boolean)))] as string[]

  if (allSubmissions.length === 0) return <EmptyState text={t.empty.noPublic} />

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {specialties.map(spec => {
          const active = spec === activeTrack
          const href = spec === 'All' ? `/u/${username}` : `/u/${username}?track=${encodeURIComponent(spec)}`
          const label = spec === 'All' ? t.trackAll : spec
          return (
            <Link
              key={spec}
              href={href}
              className={
                active
                  ? 'text-xs font-mono px-3 py-1.5 rounded-full border border-foreground bg-foreground text-background transition-colors'
                  : 'text-xs font-mono px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors'
              }
            >
              {label}
            </Link>
          )
        })}
      </div>
      {visibleSubmissions.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {visibleSubmissions.map((s: any) => (
            <SubmissionCard key={s.id} submission={s} />
          ))}
        </div>
      ) : (
        <EmptyState text={t.empty.noTrack} />
      )}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}
