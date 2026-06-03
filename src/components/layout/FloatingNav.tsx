'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { House, Trophy, BarChart3, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/features/notifications/NotificationBell'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProBadge } from '@/components/ui/ProBadge'
import { Logo } from '@/components/ui/Logo'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/app/(auth)/actions'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LangSwitcher } from '@/components/i18n/LangSwitcher'
import type { Profile } from '@/types/database.types'
import type { Lang } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

const NAV_BASE = [
  { href: '/dashboard',             icon: House,     match: (p: string) => p === '/dashboard',                key: 'dashboard'  as const },
  { href: '/dashboard/challenges',  icon: Trophy,    match: (p: string) => p.startsWith('/dashboard/challenges'),  key: 'challenges' as const },
  { href: '/dashboard/leaderboard', icon: BarChart3, match: (p: string) => p.startsWith('/dashboard/leaderboard'), key: 'leagues'    as const },
]

// Detail routes where the mobile bottom nav doesn't belong (page-specific actions take over instead)
const HIDE_MOBILE_NAV_PATTERNS = [
  /^\/dashboard\/submissions\/[^/]+/,
  /^\/dashboard\/challenges\/[^/]+/,
  /^\/u\//,
]

interface Props {
  profile: Profile
  lang: Lang
  t: Dictionary['header']
  notifTypes: Dictionary['notificationsPage']['types']
}

export function FloatingNav({ profile, lang, t, notifTypes }: Props) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
    <div
      className={cn(
        'sm:hidden sticky top-0 z-40 flex items-center px-3 gap-2 h-14 transition-all duration-200',
        scrolled ? 'border-b' : 'border-b border-transparent'
      )}
      style={{
        background: scrolled ? 'var(--nav-bg-scrolled)' : 'var(--nav-bg)',
        borderColor: 'var(--nav-border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo — left */}
      <Link href="/dashboard" className="shrink-0 flex items-center">
        <Logo className="h-6" />
      </Link>

      {/* Spacer to push right actions to the edge */}
      <div className="flex-1" />

      {/* Right — notifications + avatar */}
      <div className="shrink-0 flex items-center gap-1">
        <NotificationBell userId={profile.id} types={notifTypes} />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 ps-1.5 pe-1.5 py-1 rounded-full hover:bg-foreground/[0.04] transition-colors outline-none">
            <Avatar className="size-7 rounded-full ring-[1.5px] ring-border">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="rounded-full text-[11px] font-bold bg-primary/15 text-primary">
                {profile.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl mt-1">
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-sm font-semibold inline-flex items-center gap-1.5">
                @{profile.username}
                <ProBadge plan={profile.plan} />
              </p>
              <p className="text-xs text-muted-foreground font-mono capitalize">{profile.plan} {t.menu.planSuffix}</p>
            </div>
            <DropdownMenuItem>
              <Link href={`/u/${profile.username}`} className="w-full text-sm font-medium">{t.menu.publicProfile}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/dashboard/profile" className="w-full text-sm font-medium">{t.menu.editProfile}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/dashboard/settings" className="w-full text-sm font-medium">{t.menu.settings}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/dashboard/notifications" className="w-full text-sm font-medium">{t.menu.notifications}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/dashboard/history" className="w-full text-sm font-medium">{t.menu.history}</Link>
            </DropdownMenuItem>
            {profile.role === 'admin' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/admin" className="w-full text-sm font-medium inline-flex items-center gap-2 text-violet-600 dark:text-violet-400">
                    <Shield className="size-3.5" /> {t.menu.switchToAdmin}
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 space-y-2">
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Language</p>
              <LangSwitcher current={lang} variant="pill" />
            </div>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <p className="text-sm text-muted-foreground mb-2">{t.menu.appearance}</p>
              <ThemeToggle />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <form action={signOut} className="w-full">
                <button type="submit" className="w-full text-start text-sm">{t.menu.signOut}</button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    {/* Mobile-only floating bottom nav — hidden on detail pages */}
    {!HIDE_MOBILE_NAV_PATTERNS.some((re) => re.test(pathname)) && (
    <div
      className={cn(
        'sm:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-1 px-2 py-2 rounded-full shadow-lg border border-border',
        'bg-background/95 backdrop-blur-md transition-opacity duration-300',
        mounted ? 'opacity-100' : 'opacity-0',
      )}
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      {NAV_BASE.map(({ href, key, icon: Icon, match }) => {
        const active = match(pathname)
        const label = t.nav[key]
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 rounded-full px-4 py-2 transition-all duration-150 min-w-[64px]',
              active
                ? 'bg-foreground text-background shadow-sm'
                : 'text-zinc-500 hover:text-foreground dark:text-zinc-400',
            )}
          >
            <Icon className="size-5 shrink-0" strokeWidth={active ? 2.4 : 1.8} />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        )
      })}
    </div>
    )}
    </>
  )
}
