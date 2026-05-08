import { HelpSearchBar } from './HelpSearchBar'
import type { HelpDictionary } from '@/lib/help/lang'

export function HelpHero({ t }: { t: HelpDictionary }) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-violet-50 via-background to-background dark:from-violet-950/30">
      <div className="max-w-[860px] mx-auto px-6 py-16 sm:py-24 text-center space-y-6">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
          {t.heroTitle}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-[560px] mx-auto">
          {t.heroSubtitle}
        </p>
        <div className="max-w-[560px] mx-auto pt-2">
          <HelpSearchBar placeholder={t.searchPlaceholder} size="lg" />
        </div>
      </div>
    </section>
  )
}
