import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

/**
 * MarketingFooter — pied de page de la landing.
 * Gauche : logo + réseaux (Instagram, LinkedIn). Milieu : liens de navigation.
 * Bas-gauche : © + mentions légales. Tokens DS uniquement.
 * Icônes de marque en SVG inline (lucide-react ne les exporte plus).
 */

function Instagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function Linkedin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

const NAV = [
  { label: 'About', href: '#' },
  { label: 'How it works', href: '#features' },
  { label: 'Hire talent', href: '#' },
  { label: 'Blog', href: '#' },
  { label: 'Help', href: '/help' },
]

const SOCIALS = [
  { label: 'Instagram', href: 'https://instagram.com/kreevo', Icon: Instagram },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/kreevo', Icon: Linkedin },
]

export function MarketingFooter() {
  return (
    <footer className="relative z-10 border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Ligne principale : logo + réseaux (gauche) · nav (centrée) */}
        <div className="grid gap-y-4 sm:grid-cols-3 sm:items-center">
          <div className="flex items-center sm:justify-self-start">
            <Logo className="h-6 w-auto" />
          </div>

          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm sm:justify-self-center">
            {NAV.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Droite : réseaux */}
          <div className="flex items-center gap-3 sm:justify-self-end">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Bas-gauche : © + mentions légales */}
        <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>© 2026 Kreevo</span>
          <Link href="#" className="transition-colors hover:text-foreground">
            Terms
          </Link>
          <Link href="#" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default MarketingFooter
