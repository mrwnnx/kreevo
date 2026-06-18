import type { Metadata } from 'next'
import { getLang } from '@/lib/i18n/lang'
import { organizationSchema, websiteSchema } from '@/lib/seo/jsonld'
import { HeroSection } from '@/components/marketing/HeroSection'
import { BodyPlaceholderSection } from '@/components/marketing/BodyPlaceholderSection'
import { StatsSection } from '@/components/marketing/StatsSection'
import { MovingGradientBackground } from '@/components/marketing/MovingGradientBackground'

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
  const m = LANDING_META[lang as keyof typeof LANDING_META] ?? LANDING_META.fr
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
      locale: lang === 'en' ? 'en_US' : lang === 'ar' ? 'ar_AR' : 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
      title: m.title,
      description: m.description,
    },
  }
}

export default function Home() {
  const orgLd = organizationSchema()
  const siteLd = websiteSchema()

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }} />

      {/* Fond à gradient animé (derrière le contenu) */}
      <MovingGradientBackground />

      <div className="relative z-10">
        <HeroSection />
        <BodyPlaceholderSection />
        <StatsSection />
      </div>
    </main>
  )
}
