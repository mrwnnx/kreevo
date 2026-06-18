import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/button'

/**
 * MarketingHeader — header sticky de la landing : logo (composant DS existant) + CTA.
 * Tokens DS uniquement (bg-background, border-border). Réutilise <Logo> et <Button>.
 */
export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <a href="/" aria-label="Kreevo" className="inline-flex items-center">
          <Logo className="h-6 w-auto" />
        </a>
        <Button size="lg" render={<a href="#start" />}>
          Get started
        </Button>
      </div>
    </header>
  )
}

export default MarketingHeader
