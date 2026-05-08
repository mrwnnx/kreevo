import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ProBadge } from '@/components/ui/ProBadge'
import { Separator } from '@/components/ui/separator'
import {
  MapPin, Globe,
  Heart, MessageCircle, Lock, ExternalLink, Mail,
  Trophy, Zap, Star, Link as LinkIcon,
} from 'lucide-react'
import type { Profile } from '@/types/database.types'

// ── League display config (DB names) ───────────────────────────
const LEAGUE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  '7ajra':  { label: 'Stone',    color: '#475569', bg: '#F1F5F9', border: '#94A3B8' },
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
  return LEAGUE_CONFIG[league] ?? LEAGUE_CONFIG['7ajra']
}

// ── Links parser ───────────────────────────────────────────────
interface SocialLinks {
  website?: string
  linkedin?: string
  dribbble?: string
  behance?: string
  instagram?: string
}

function parseLinks(links: unknown): SocialLinks {
  if (!links || typeof links !== 'object') return {}
  return links as SocialLinks
}

// ── Rank calculation ───────────────────────────────────────────
function getRankLabel(rank: number, total: number): string {
  const pct = Math.round((rank / total) * 100)
  if (pct <= 1)  return 'Top 1%'
  if (pct <= 5)  return 'Top 5%'
  if (pct <= 10) return 'Top 10%'
  if (pct <= 25) return 'Top 25%'
  if (pct <= 50) return 'Top 50%'
  return 'Participant'
}

// ── Metadata ───────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()
  const { data: rawProfile } = await supabase
    .from('profiles').select('full_name,specialty,bio,league,avatar_url').eq('username', username).single()
  const profile = rawProfile as any

  if (!profile) return { title: 'Profile not found | Kreevo' }

  const name = profile.full_name ?? username
  const specialty = profile.specialty ? ` · ${profile.specialty}` : ''
  const league = getLeague(profile.league ?? '7ajra')

  return {
    title: `${name}${specialty} | Kreevo`,
    description: profile.bio
      ? `${profile.bio} | League ${league.label} | Kreevo designer`
      : `${name} — Designer on Kreevo. League ${league.label}.`,
    openGraph: {
      title: `${name} | Kreevo`,
      description: profile.bio ?? `${name} is a designer on Kreevo.`,
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : [],
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
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('username', username).single(),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ])

  if (!profile) notFound()

  const p = profile as Profile
  const social = parseLinks(p.links)
  const league = getLeague(p.league ?? '7ajra')
  const isPro = p.plan === 'pro' || p.plan === 'studio'

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
  const rankLabel = getRankLabel(rank, Math.max(totalUsers ?? 1, 1))
  const submissions = (allSubmissions ?? []) as any[]
  const top3 = [...submissions]
    .sort((a, b) => (b.total_claps ?? 0) - (a.total_claps ?? 0))
    .slice(0, 3)
  const filteredSubmissions =
    activeTrack === 'All'
      ? submissions
      : submissions.filter((s) => s.challenges?.specialty === activeTrack)

  return (
    <div className="min-h-screen bg-background">
      {/* ── Nav bar ────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <a href="/" className="text-sm font-bold tracking-tight">kreevo</a>
        <div className="flex items-center gap-3">
          <a href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Sign in</a>
          <a href="/signup" className="text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity">
            Join free
          </a>
        </div>
      </nav>

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
            <div className="flex items-center gap-3 flex-wrap">
              {social.website && (
                <a href={social.website} target="_blank" rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors">
                  <Globe className="size-4" />
                </a>
              )}
              {social.linkedin && (
                <a href={social.linkedin} target="_blank" rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors">
                  <LinkIcon className="size-4" />
                </a>
              )}
              {social.dribbble && (
                <a href={social.dribbble} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono">
                  <ExternalLink className="size-3.5" /> drib
                </a>
              )}
              {social.behance && (
                <a href={social.behance} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono">
                  <ExternalLink className="size-3.5" /> Bē
                </a>
              )}
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono">
                  <ExternalLink className="size-3.5" /> ig
                </a>
              )}
              {isPro && (
                <button className="flex items-center gap-1.5 text-xs font-semibold bg-foreground text-background px-3 py-1.5 rounded-md hover:opacity-80 transition-opacity ml-1">
                  <Mail className="size-3.5" /> Contact
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── STATS BAR ──────────────────────────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Zap,    label: 'Total XP',    value: p.xp.toLocaleString(), mono: true },
            { icon: Trophy, label: 'Challenges',  value: String(submissionCount ?? 0), mono: true },
            { icon: Star,   label: 'League',      value: league.label, mono: false },
            { icon: Trophy, label: 'Rank',        value: rankLabel, mono: true },
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
          <h2 className="text-base font-bold tracking-tight">Featured Work</h2>

          {isPro ? (
            top3.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-4">
                {top3.map((s: any) => (
                  <SubmissionCard key={s.id} submission={s} featured />
                ))}
              </div>
            ) : (
              <EmptyState text="No featured work yet." />
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
                <p className="text-sm font-semibold">Featured work is Pro only</p>
                <a href="/signup" className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-md font-semibold hover:opacity-90 transition-opacity">
                  Upgrade to Pro
                </a>
              </div>
            </div>
          )}
        </section>

        <Separator />

        {/* ── ALL SUBMISSIONS ────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-base font-bold tracking-tight">All Work</h2>
          <TrackFilter
            allSubmissions={submissions}
            visibleSubmissions={filteredSubmissions}
            activeTrack={activeTrack}
            username={p.username}
          />
        </section>

        {/* ── BADGES ─────────────────────────────────────────────── */}
        {badges && badges.length > 0 && (
          <>
            <Separator />
            <section className="space-y-4">
              <h2 className="text-base font-bold tracking-tight">Badges</h2>
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
              <Heart className="size-3" /> {s.total_claps ?? 0}
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
}: {
  allSubmissions: any[]
  visibleSubmissions: any[]
  activeTrack: string
  username: string
}) {
  const specialties = ['All', ...Array.from(new Set(allSubmissions.map((s: any) => s.challenges?.specialty).filter(Boolean)))] as string[]

  if (allSubmissions.length === 0) return <EmptyState text="No public work yet." />

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {specialties.map(spec => {
          const active = spec === activeTrack
          const href = spec === 'All' ? `/u/${username}` : `/u/${username}?track=${encodeURIComponent(spec)}`
          return (
            <a
              key={spec}
              href={href}
              className={
                active
                  ? 'text-xs font-mono px-3 py-1.5 rounded-full border border-foreground bg-foreground text-background transition-colors'
                  : 'text-xs font-mono px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors'
              }
            >
              {spec}
            </a>
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
        <EmptyState text="No work in this track yet." />
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
