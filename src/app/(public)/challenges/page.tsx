import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Clock } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getDict, getLang } from '@/lib/i18n/lang'
import { localizeChallenges } from '@/lib/challenges/i18n'

export const dynamic = 'force-dynamic'

type ChallengeRow = {
  id: string
  title: string
  brief: string
  specialty: string | null
  challenge_type: string | null
  industry: string | null
  emoji: string | null
  xp_reward: number | null
  deadline_days: number | null
  updated_at: string
}

const PAGE_META = {
  fr: {
    title: 'Challenges design — Briefs réels, XP, ligues | Kreevo',
    description:
      'Explore la bibliothèque Kreevo de challenges design : UX/UI, branding, graphique. Choisis un brief, soumets ton travail, gagne de l\'XP et grimpe les ligues.',
  },
  en: {
    title: 'Design challenges — Real briefs, XP, leagues | Kreevo',
    description:
      'Browse the Kreevo library of design challenges: UX/UI, branding, graphic. Pick a brief, submit your work, earn XP, and climb the leagues.',
  },
} as const

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang()
  const m = PAGE_META[lang as keyof typeof PAGE_META] ?? PAGE_META.fr
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: '/challenges' },
    openGraph: {
      title: m.title,
      description: m.description,
      url: '/challenges',
      siteName: 'Kreevo',
      type: 'website',
      locale: lang === 'en' ? 'en_US' : lang === 'ar' ? 'ar_AR' : 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
      title: m.title,
      description: m.description,
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

export default async function PublicChallengesPage() {
  const dict = await getDict()
  const lang = await getLang()
  const t = dict.publicChallenges

  const { data } = await (supabaseAdmin as any)
    .from('challenges')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const challenges = localizeChallenges((data ?? []) as ChallengeRow[], lang)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal public nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <Link href="/" className="text-base font-bold tracking-tight">kreevo</Link>
        <div className="flex items-center gap-4">
          <Link href="/designers" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {dict.publicDesigners.title}
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
        {/* Hero */}
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

        {/* Counter */}
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground font-mono">{challenges.length}</span>
          {' '}{t.countLabel}
        </div>

        {/* Grid OR empty state */}
        {challenges.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            {t.empty}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((c) => (
              <Link
                key={c.id}
                href={`/challenges/${c.id}`}
                className="group rounded-[20px] border border-border bg-card p-5 flex flex-col gap-4 hover:border-foreground/30 hover:shadow-sm transition-all"
              >
                <div className="text-3xl leading-none">{specialtyEmoji(c.specialty, c.emoji)}</div>
                <div className="space-y-2 flex-1">
                  <h2 className="text-lg font-semibold leading-snug text-foreground">{c.title}</h2>
                  <p className="text-sm text-muted-foreground leading-snug line-clamp-3">{c.brief}</p>
                </div>
                {(c.specialty || c.challenge_type || c.industry) && (
                  <div className="flex flex-wrap gap-1.5">
                    {[c.specialty, c.challenge_type, c.industry].filter(Boolean).map((tag) => (
                      <span key={tag as string} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-sm pt-2 border-t border-border/60">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    {c.xp_reward != null && c.xp_reward > 0 && (
                      <span className="inline-flex items-center gap-1 font-mono font-semibold text-foreground">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/xp-flash.svg" alt="" className="size-3.5" />
                        {c.xp_reward} {t.cardXp}
                      </span>
                    )}
                    {c.deadline_days != null && (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Clock className="size-3" />
                        {c.deadline_days} {t.cardDays}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-6 mt-12 flex items-center justify-between">
        <span className="text-xs font-bold tracking-tight">kreevo</span>
        <p className="text-xs font-mono text-muted-foreground">© {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
