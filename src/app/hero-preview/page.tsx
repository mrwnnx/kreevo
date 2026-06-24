import { getDict } from '@/lib/i18n/lang'
import { MovingGradientBackground } from '@/components/marketing/MovingGradientBackground'
import { BackdropFade } from '@/components/marketing/BackdropFade'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { HeroSection } from '@/components/marketing/HeroSection'
import { FeaturesSection } from '@/components/marketing/FeaturesSection'
import { PricingSection } from '@/components/marketing/PricingSection'

/**
 * Preview DEV (non commitée) — landing en contexte + FeaturesSection sous le hero.
 * Sert uniquement à valider visuellement la nouvelle section.
 */
export default async function HeroPreview() {
  const dict = await getDict()
  const t = dict.landing
  return (
    <main className="relative min-h-screen overflow-x-clip bg-background">
      <MovingGradientBackground />
      <BackdropFade />
      <div className="relative z-10">
        <MarketingHeader t={t.nav} />
        <HeroSection t={t} />
        <FeaturesSection />
        <PricingSection />
      </div>
    </main>
  )
}
