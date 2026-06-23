import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/button'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

/**
 * MarketingHeader — header sticky de la landing : logo (composant DS existant) + CTA.
 * Tokens DS uniquement (bg-background, border-border). Réutilise <Logo> et <Button>.
 * CTA → /signup (démarre le parcours d'inscription). Label via i18n (t.getStarted).
 */
export function MarketingHeader({ t }: { t: Dictionary['landing']['nav'] }) {
  return (
    <header className="sticky top-4 z-50 px-4 sm:top-6 sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-full border border-border bg-background/60 py-2.5 pe-2.5 ps-5 shadow-lg shadow-foreground/5 backdrop-blur-xl">
        <a href="/" aria-label="Kreevo" className="inline-flex items-center">
          <Logo className="h-6 w-auto" />
        </a>
        <nav className="hidden items-center gap-8 text-base sm:flex">
          <a href="#" className="font-medium text-foreground transition-opacity hover:opacity-70">{t.about}</a>
          <a href="/hire" className="font-medium text-foreground transition-opacity hover:opacity-70">{t.hireTalent}</a>
          <a href="/blog" className="font-medium text-foreground transition-opacity hover:opacity-70">{t.blog}</a>
        </nav>
        <Button size="lg" render={<a href="/signup" />}>
          {t.getStarted}
        </Button>
      </div>
    </header>
  )
}

export default MarketingHeader
