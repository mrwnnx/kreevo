/**
 * Help Center layout — wraps all /help pages.
 * - Reads `lang` cookie (fr default) via getHelpLang()
 * - Renders top header (logo + lang switcher)
 * - Renders bottom footer (contact CTA + back to home)
 *
 * Routes:
 *   /help                          → homepage (hero + categories + popular)
 *   /help/[category]               → category articles list
 *   /help/[category]/[article]     → article detail
 *   /help/search                   → search results
 *   /help/contact                  → contact form
 */

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LanguageSwitcher } from '@/components/help/LanguageSwitcher'
import { getHelpLang, HELP_T } from '@/lib/help/lang'
import { Logo } from '@/components/ui/Logo'

export default async function HelpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const lang = await getHelpLang()
  const t = HELP_T[lang]

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Skip link — visible only when focused (keyboard) */}
      <a
        href="#help-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-full focus:text-sm focus:font-semibold"
      >
        {lang === 'en' ? 'Skip to content' : 'Aller au contenu'}
      </a>

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-3 sm:gap-4">
          <Link
            href="/help"
            className="shrink-0 flex items-center gap-1.5"
            aria-label={t.siteName}
          >
            <Logo className="h-4" />
            <span className="hidden sm:inline text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              help
            </span>
          </Link>

          <div className="ms-auto flex items-center gap-2">
            <LanguageSwitcher current={lang} />
          </div>
        </div>
      </header>

      {/* Main */}
      <main id="help-main" className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="rounded-[24px] border border-border bg-background p-6 sm:p-8 text-center space-y-3 mb-10">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              {t.contactTitle}
            </h2>
            <p className="text-sm text-muted-foreground">{t.contactBody}</p>
            <Link
              href="/help/contact"
              className="inline-flex items-center justify-center bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-85 transition-opacity"
            >
              {t.contactCta}
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              {t.backHome}
            </Link>
            <p>© {new Date().getFullYear()} Kreevo</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
