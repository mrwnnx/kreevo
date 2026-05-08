'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { House, Trophy, BarChart3, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/features/notifications/NotificationBell'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProBadge } from '@/components/ui/ProBadge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/app/(auth)/actions'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LangSwitcher } from '@/components/i18n/LangSwitcher'
import type { Profile } from '@/types/database.types'
import { leagueLabel, leagueColor } from '@/lib/utils/xp'
import type { Lang } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

const NAV_BASE = [
  { href: '/dashboard',             icon: House,     match: (p: string) => p === '/dashboard',                key: 'dashboard'  as const },
  { href: '/dashboard/challenges',  icon: Trophy,    match: (p: string) => p.startsWith('/dashboard/challenges'),  key: 'challenges' as const },
  { href: '/dashboard/leaderboard', icon: BarChart3, match: (p: string) => p.startsWith('/dashboard/leaderboard'), key: 'leagues'    as const },
]

interface Props {
  profile: Profile
  lang: Lang
  t: Dictionary['header']
}

export function FloatingNav({ profile, lang, t }: Props) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const league = profile.league ?? '7ajra'

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
        'sticky top-0 z-40 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 h-14 transition-all duration-200',
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
      <Link href="/dashboard" className="shrink-0 flex items-baseline gap-1">
        <span className="text-sm font-bold tracking-tight">kreevo</span>
        <span className="hidden sm:inline text-[9px] font-mono text-muted-foreground uppercase tracking-widest">beta</span>
      </Link>

      {/* Nav links — centered absolutely on the viewport (desktop only) */}
      <div
        className={cn(
          'hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 transition-opacity duration-300',
          mounted ? 'opacity-100' : 'opacity-0'
        )}
      >
        {NAV_BASE.map(({ href, key, match }) => {
          const active = match(pathname)
          const label = t.nav[key]
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                'rounded-full px-3 py-1.5 transition-colors duration-150',
                active
                  ? 'text-foreground font-semibold'
                  : 'text-zinc-500 hover:text-foreground dark:text-zinc-400 dark:hover:text-white'
              )}
            >
              <span className="text-base leading-none">{label}</span>
            </Link>
          )
        })}
      </div>

      {/* Spacer to push right actions to the edge */}
      <div className="flex-1" />

      {/* Right — notifications + avatar */}
      <div className="shrink-0 flex items-center gap-1">
        <NotificationBell userId={profile.id} />

        {/* League chip — masqué sur mobile */}
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border mr-1">
          <span
            className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full leading-none"
            style={{ background: leagueColor(league) + '18', color: leagueColor(league) }}
          >
            {leagueLabel(league)}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 pl-1.5 pr-1.5 sm:pr-2.5 py-1 rounded-full hover:bg-foreground/[0.04] transition-colors outline-none">
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <Zap className="size-3 text-violet-500" />
              {profile.xp.toLocaleString()} XP
            </span>
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
                <button type="submit" className="w-full text-left text-sm">{t.menu.signOut}</button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    {/* Mobile-only floating bottom nav */}
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
    </>
  )
}
