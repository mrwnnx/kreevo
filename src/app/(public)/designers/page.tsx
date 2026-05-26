import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { XpIcon } from '@/components/ui/XpIcon'
import { getDict, getLang } from '@/lib/i18n/lang'

export const dynamic = 'force-dynamic'

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

const PAGE_META = {
  fr: {
    title: 'Designers Kreevo — Profils, ligues, XP | Kreevo',
    description:
      'Découvre les designers Kreevo qui relèvent des challenges UX/UI, branding et graphique. Profils publics, ligues, XP — explore la communauté.',
  },
  en: {
    title: 'Kreevo designers — Profiles, leagues, XP | Kreevo',
    description:
      'Meet the Kreevo designers tackling real UX/UI, branding and graphic challenges. Public profiles, leagues, XP — explore the community.',
  },
} as const

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang()
  const m = PAGE_META[lang] ?? PAGE_META.fr
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: '/designers' },
    openGraph: {
      title: m.title,
      description: m.description,
      url: '/designers',
      siteName: 'Kreevo',
      type: 'website',
      locale: lang === 'en' ? 'en_US' : 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
      title: m.title,
      description: m.description,
    },
  }
}

type DesignerProfile = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  specialty: string | null
  job_title: string | null
  league: string | null
  xp: number | null
  plan: string | null
}

type ApprovedRow = { user_id: string }

export default async function PublicDesignersPage() {
  const dict = await getDict()
  const t = dict.publicDesigners

  // Same eligibility as sitemap: ≥1 approved submission + onboarded + not suspended.
  const { data: approvedData } = await (supabaseAdmin as any)
    .from('submissions')
    .select('user_id')
    .eq('validation_status', 'approved')

  const approvedRows = (approvedData ?? []) as ApprovedRow[]
  const approvedUserIds = Array.from(new Set(approvedRows.map((r) => r.user_id)))

  let designers: DesignerProfile[] = []
  let submissionsByUser: Record<string, number> = {}

  if (approvedUserIds.length > 0) {
    submissionsByUser = approvedRows.reduce<Record<string, number>>((acc, r) => {
      acc[r.user_id] = (acc[r.user_id] ?? 0) + 1
      return acc
    }, {})

    const { data: profileData } = await (supabaseAdmin as any)
      .from('profiles')
      .select('id, username, full_name, avatar_url, specialty, job_title, league, xp, plan')
      .in('id', approvedUserIds)
      .eq('onboarding_completed', true)
      .eq('is_suspended', false)
      .order('xp', { ascending: false, nullsFirst: false })
      .limit(120)

    designers = (profileData ?? []) as DesignerProfile[]
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <Link href="/" className="text-base font-bold tracking-tight">kreevo</Link>
        <div className="flex items-center gap-4">
          <Link href="/challenges" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {dict.publicChallenges.title}
          </Link>
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

      <main className="max-w-[1080px] mx-auto px-6 py-12 sm:py-16 space-y-12">
        <section className="space-y-6 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">{t.title}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">{t.subtitle}</p>

          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-6 py-3 rounded-full hover:opacity-85 transition-opacity"
            >
              {t.heroCta} <ArrowRight className="size-4" />
            </Link>
            <span className="text-xs text-muted-foreground font-mono">{t.heroCtaHint}</span>
          </div>
        </section>

        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground font-mono">{designers.length}</span>
          {' '}{t.countLabel}
        </div>

        {designers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            {t.empty}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {designers.map((d) => {
              const league = LEAGUE_CONFIG[d.league ?? 'Stone'] ?? LEAGUE_CONFIG.Stone
              const initials = (d.full_name ?? d.username ?? '?').trim().charAt(0).toUpperCase()
              const count = submissionsByUser[d.id] ?? 0
              return (
                <Link
                  key={d.id}
                  href={`/u/${d.username}`}
                  className="group rounded-[20px] border border-border bg-card p-5 flex flex-col gap-3 hover:border-foreground/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-12 shrink-0 rounded-2xl bg-muted overflow-hidden flex items-center justify-center border border-border">
                      {d.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.avatar_url} alt={d.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-base font-bold text-muted-foreground">{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{d.full_name ?? d.username}</p>
                      <p className="text-xs font-mono text-muted-foreground truncate">@{d.username}</p>
                    </div>
                  </div>

                  {(d.specialty || d.job_title) && (
                    <p className="text-xs text-muted-foreground truncate">
                      {d.job_title ?? d.specialty}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <span
                      className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border"
                      style={{ color: league.color, background: league.bg, borderColor: league.border }}
                    >
                      {league.label}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-mono font-semibold text-foreground">
                        <XpIcon className="size-3" />
                        {(d.xp ?? 0).toLocaleString()}
                      </span>
                      {count > 0 && (
                        <span className="font-mono">{count} {count === 1 ? t.cardWork : t.cardWorks}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-border/50 px-6 py-6 mt-12 flex items-center justify-between">
        <span className="text-xs font-bold tracking-tight">kreevo</span>
        <p className="text-xs font-mono text-muted-foreground">© {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
