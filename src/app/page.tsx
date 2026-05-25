import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Trophy, Sparkles, TrendingUp } from 'lucide-react'
import { getDict, getLang } from '@/lib/i18n/lang'
import { organizationSchema, websiteSchema } from '@/lib/seo/jsonld'

const LANDING_META = {
  fr: {
    title: 'Kreevo — Challenges design hebdomadaires & système de ligues',
    description:
      "Des challenges design hebdomadaires inspirés du monde réel, du feedback IA sur chaque soumission, et un système de ligues qui classe ta progression de Stone à Legend.",
  },
  en: {
    title: 'Kreevo — Weekly design challenges & league system',
    description:
      'Weekly real-world design challenges, AI feedback on every submission, and a league system that ranks your progress from Stone to Legend.',
  },
} as const

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang()
  const m = LANDING_META[lang] ?? LANDING_META.fr
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: '/' },
    openGraph: {
      title: m.title,
      description: m.description,
      url: '/',
      siteName: 'Kreevo',
      type: 'website',
      locale: lang === 'en' ? 'en_US' : 'fr_FR',
    },
  }
}

const LEAGUES = [
  { name: 'Stone',    cls: 'league-stone',    bg: 'league-bg-stone',    icon: '○' },
  { name: 'Bronze',   cls: 'league-bronze',   bg: 'league-bg-bronze',   icon: '◐' },
  { name: 'Silver',   cls: 'league-silver',   bg: 'league-bg-silver',   icon: '◑' },
  { name: 'Gold',     cls: 'league-gold',     bg: 'league-bg-gold',     icon: '◕' },
  { name: 'Platinum', cls: 'league-platinum', bg: 'league-bg-platinum', icon: '●' },
  { name: 'Diamond',  cls: 'league-diamond',  bg: 'league-bg-diamond',  icon: '◆' },
  { name: 'Master',   cls: 'league-master',   bg: 'league-bg-master',   icon: '◇' },
  { name: 'Legend',   cls: 'league-legend',   bg: 'league-bg-legend',   icon: '★' },
]

export default async function Home() {
  const dict = await getDict()
  const t = dict.landing

  const features = [
    { icon: Trophy, accent: 'text-league-gold', ...t.features.monthly },
    { icon: Sparkles, accent: 'text-primary', ...t.features.leagues },
    { icon: TrendingUp, accent: 'text-league-platinum', ...t.features.progress },
  ]

  const orgLd = organizationSchema()
  const siteLd = websiteSchema()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }}
      />

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-border/50">
        <span className="text-base font-bold tracking-tight">kreevo</span>
        <div className="flex items-center gap-6">
          <Link href="/dashboard/challenges" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-wider">
            {t.nav.challenges}
          </Link>
          <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {t.nav.signIn}
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-full hover:opacity-85 transition-opacity glow-primary"
          >
            {t.nav.getStarted} <ArrowRight className="size-3" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative px-8 pt-24 pb-20 max-w-5xl mx-auto overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/8 text-primary text-xs font-mono px-3 py-1.5 rounded-full mb-8 tracking-wide">
            <span className="size-1.5 rounded-full bg-primary animate-pulse inline-block" />
            {t.hero.badge}
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[0.9] mb-6 text-foreground">
            {t.hero.titleLine1}<br />
            <span className="text-primary">{t.hero.titleLine2}</span><br />
            {t.hero.titleLine3}
          </h1>

          <p className="text-base text-muted-foreground max-w-lg mb-10 leading-relaxed">
            {t.hero.subtitle}
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-6 py-3 rounded-full hover:opacity-85 transition-opacity glow-primary"
            >
              {t.hero.ctaPrimary} <ArrowRight className="size-4" />
            </Link>
            <span className="text-xs text-muted-foreground font-mono">{t.hero.ctaHint}</span>
          </div>
        </div>
      </section>

      {/* ── League system ───────────────────────────────────── */}
      <section className="px-8 py-16 border-y border-border/50">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-8">
            {t.leagues.label}
          </p>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {LEAGUES.map((l) => (
              <div
                key={l.name}
                className={`${l.bg} border border-border/50 rounded-lg px-3 py-4 text-center space-y-2 hover:border-current/30 transition-colors`}
              >
                <span className={`text-2xl font-mono ${l.cls}`}>{l.icon}</span>
                <p className={`text-xs font-mono font-bold uppercase tracking-wider ${l.cls}`}>
                  {l.name}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 font-mono">
            {t.leagues.caption}
          </p>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="px-8 py-20 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, tag, title, desc, accent }) => (
            <div key={title} className="card-sharp rounded-lg p-4 space-y-4 hover:border-primary/30 transition-colors group">
              <div className="flex items-center justify-between">
                <Icon className={`size-5 ${accent}`} />
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest border border-border px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="px-8 pb-24 max-w-5xl mx-auto">
        <div className="relative rounded-xl border border-primary/20 bg-primary/5 px-10 py-12 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <p className="text-xs font-mono text-primary uppercase tracking-widest mb-4">{t.cta.label}</p>
          <h2 className="text-3xl font-bold tracking-tight mb-3">{t.cta.title}</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
            {t.cta.subtitle}
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-8 py-3 rounded-full hover:opacity-85 transition-opacity glow-primary"
          >
            {t.cta.button} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-border/50 px-8 py-6 flex items-center justify-between">
        <span className="text-xs font-bold tracking-tight">kreevo</span>
        <p className="text-xs font-mono text-muted-foreground">© 2026</p>
      </footer>
    </div>
  )
}
