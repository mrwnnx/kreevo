import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { getDict } from '@/lib/i18n/lang'
import { siteUrl } from '@/lib/site'
import { Badge } from '@/components/ui/badge'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { MovingGradientBackground } from '@/components/marketing/MovingGradientBackground'
import { HireMediaSection } from '@/components/hire/HireMediaSection'
import { HireWaitlistCta } from '@/components/hire/HireWaitlistCta'

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDict()
  const t = dict.landing.hire
  return {
    title: `${t.heroTitle} — Kreevo`,
    description: t.heroBody,
    alternates: { canonical: '/hire' },
    openGraph: {
      title: t.heroTitle,
      description: t.heroBody,
      url: siteUrl('/hire'),
      siteName: 'Kreevo',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: t.heroTitle, description: t.heroBody },
  }
}

/* Carte type FeaturesSection : panneau déco + texte centré. */
function ReasonCard({
  emoji,
  title,
  children,
}: {
  emoji: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[24px] bg-card p-3">
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-[12px] bg-secondary text-5xl sm:text-6xl">
        {emoji}
      </div>
      <div className="px-3 pb-4 pt-5 text-center">
        <h3 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-foreground">{title}</h3>
        <p className="mx-auto mt-2 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </div>
  )
}

export default async function HirePage() {
  const dict = await getDict()
  const t = dict.landing.hire

  const reasons = [
    { emoji: '🏆', title: t.reasonLeagueTitle, body: t.reasonLeagueBody },
    { emoji: '✅', title: t.reasonVerifiedTitle, body: t.reasonVerifiedBody },
    { emoji: '🛡️', title: t.reasonLivingTitle, body: t.reasonLivingBody },
  ]
  const steps = [
    { n: 1, title: t.step1Title, body: t.step1Body },
    { n: 2, title: t.step2Title, body: t.step2Body },
    { n: 3, title: t.step3Title, body: t.step3Body },
  ]

  return (
    <main className="relative min-h-screen overflow-x-clip bg-background">
      <MovingGradientBackground />

      <div className="relative z-10">
        <MarketingHeader t={dict.landing.nav} />

        {/* 1 — HERO */}
        <section className="mx-auto max-w-3xl px-4 pt-24 pb-12 text-center sm:px-6 sm:pt-32">
          <Badge variant="secondary" className="mb-5">{t.badge}</Badge>
          <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            {t.heroTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t.heroBody}
          </p>
          <div className="mt-8 flex justify-center">
            <HireWaitlistCta t={t} />
          </div>
        </section>

        {/* 2.5 — BLOCS MÉDIA ALTERNÉS + MODALS */}
        <HireMediaSection t={t} />

        {/* 3 — POURQUOI LE TALENT KREEVO */}
        <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="mb-8 text-center font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t.whyTitle}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {reasons.map((r) => (
              <ReasonCard key={r.title} emoji={r.emoji} title={r.title}>
                {r.body}
              </ReasonCard>
            ))}
          </div>
        </section>

        {/* 4 — COMMENT ÇA MARCHE */}
        <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="mb-8 text-center font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t.howTitle}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="rounded-[24px] border border-border bg-card p-7 text-center sm:p-8">
                <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                  {s.n}
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold tracking-tight text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5 — CTA FINAL */}
        <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="rounded-[28px] border border-border bg-card p-10 text-center sm:p-12">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {t.ctaTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted-foreground">{t.ctaBody}</p>
            <div className="mt-7 flex flex-col items-center gap-3">
              <HireWaitlistCta t={t} />
              <a
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
                {t.backHome}
              </a>
            </div>
          </div>
        </section>

        <MarketingFooter />
      </div>
    </main>
  )
}
