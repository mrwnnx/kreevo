import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

/**
 * Brand footer for public / standalone pages (e.g. the public portfolio at /u/[username]).
 * `label` is the localized lead-in (e.g. "Powered by" / "Créé avec"). The Logo inherits
 * `currentColor`, so it follows the surrounding text color in light/dark mode.
 */
export function PoweredByFooter({ label }: { label: string }) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-4xl px-6 py-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <span>{label}</span>
        <Link
          href="/"
          aria-label="Kreevo"
          className="inline-flex items-center text-foreground/80 hover:text-foreground transition-colors"
        >
          <Logo className="h-4" />
        </Link>
      </div>
    </footer>
  )
}
