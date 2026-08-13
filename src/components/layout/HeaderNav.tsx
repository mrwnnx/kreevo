'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GLASS_SURFACE, GLASS_GRADIENT } from '@/components/layout/GlassShell'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

/**
 * Route de l'accueil refondue — seule page où le menu est masqué (les cartes y
 * tiennent ce rôle). `/dashboard`, l'ancien accueil, garde le menu tant qu'il
 * existe : sans sidebar il n'aurait plus aucune navigation.
 */
const HOME_PATHS = ['/dashboard-v2']

/**
 * HeaderNav — navigation centrale du header, affichée sur toutes les pages
 * SAUF l'accueil (où les cartes tiennent déjà ce rôle).
 */
export function HeaderNav({ isAdmin, t }: { isAdmin: boolean; t: Dictionary['header'] }) {
  const pathname = usePathname()
  if (HOME_PATHS.includes(pathname)) return null

  const items = [
    { href: '/dashboard-v2', label: t.nav.home, match: (p: string) => HOME_PATHS.includes(p) },
    { href: '/dashboard/challenges', label: t.nav.challenges, match: (p: string) => p.startsWith('/dashboard/challenges') },
    { href: '/dashboard/leaderboard', label: t.nav.leagues, match: (p: string) => p.startsWith('/dashboard/leaderboard') },
    { href: '/discover', label: t.nav.discover, match: (p: string) => p.startsWith('/discover') },
    ...(isAdmin
      ? [{ href: '/dashboard/solo', label: t.nav.solo, match: (p: string) => p.startsWith('/dashboard/solo') }]
      : []),
  ]

  return (
    <nav
      aria-label={t.nav.dashboard}
      className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex"
    >
      {items.map(({ href, label, match }) => {
        const active = match(pathname)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={
              active
                ? `${GLASS_SURFACE} rounded-full px-4 py-2 text-[13px] font-semibold text-[#2b2c36]`
                : 'rounded-full px-4 py-2 text-[13px] font-semibold text-[#556971] transition-colors hover:bg-white/40'
            }
            style={active ? GLASS_GRADIENT : undefined}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export default HeaderNav
