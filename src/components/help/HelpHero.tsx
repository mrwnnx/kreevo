import { HelpSearchBar } from './HelpSearchBar'
import type { HelpDictionary } from '@/lib/help/lang'

export function HelpHero({ t }: { t: HelpDictionary }) {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-[860px] mx-auto px-6 py-16 sm:py-24 text-center space-y-6">
        <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight text-[#2b2c36] sm:text-5xl">
          {t.heroTitle}
        </h1>
        <p className="mx-auto max-w-[560px] text-base leading-[1.4] text-[#484848] sm:text-lg">
          {t.heroSubtitle}
        </p>
        <div className="max-w-[560px] mx-auto pt-2">
          <HelpSearchBar placeholder={t.searchPlaceholder} size="lg" />
        </div>
      </div>
    </section>
  )
}
