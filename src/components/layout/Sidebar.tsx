'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, Trophy, BarChart3, Bell, ScrollText, ChevronRight, Shield } from 'lucide-react'
import { XpIcon } from '@/components/ui/XpIcon'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProBadge } from '@/components/ui/ProBadge'
import { LeagueIcon } from '@/components/features/league/LeagueIcon'
import { getLeagueStyle } from '@/lib/utils/league-style'
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

interface Props {
  profile: Profile
  unreadCount: number
  leagueIcon: string | null
  lang: Lang
  t: Dictionary['header']
}

export function Sidebar({ profile, unreadCount, leagueIcon, lang, t }: Props) {
  const pathname = usePathname()

  const displayName =
    profile.full_name?.trim() ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() ||
    `@${profile.username}`

  const leagueStyle = getLeagueStyle(profile.league)

  const items = [
    { href: '/dashboard',               icon: House,       label: t.nav.dashboard,    match: (p: string) => p === '/dashboard' },
    { href: '/dashboard/challenges',    icon: Trophy,      label: t.nav.challenges,   match: (p: string) => p.startsWith('/dashboard/challenges') },
    { href: '/dashboard/leaderboard',   icon: BarChart3,   label: t.nav.leagues,      match: (p: string) => p.startsWith('/dashboard/leaderboard') },
    { href: '/dashboard/notifications', icon: Bell,        label: t.menu.notifications, match: (p: string) => p.startsWith('/dashboard/notifications'), badge: unreadCount },
    { href: '/dashboard/history',       icon: ScrollText,  label: t.menu.history,     match: (p: string) => p.startsWith('/dashboard/history') },
  ]

  return (
    <aside className="hidden sm:flex fixed top-0 start-0 z-30 h-screen w-72 flex-col border-e border-border bg-zinc-50 dark:bg-zinc-900/40">
      {/* Logo */}
      <div className="px-5 h-14 flex items-center gap-1.5 border-b border-border shrink-0">
        <Link href="/dashboard" className="flex items-center gap-1.5">
          <Logo className="h-4" />
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">beta</span>
        </Link>
      </div>

      {/* Profile card */}
      <div className="px-3 py-3 border-b border-border shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full rounded-xl border border-border bg-background hover:bg-foreground/[0.03] transition-colors outline-none p-2.5 space-y-2.5">
            {/* Row 1 — avatar + name + plan */}
            <div className="flex items-center gap-2.5">
              <Avatar className="size-9 rounded-full ring-[1.5px] ring-border shrink-0">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="rounded-full text-xs font-bold bg-primary/15 text-primary">
                  {profile.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-start">
                <p className="text-sm font-semibold truncate inline-flex items-center gap-1">
                  {displayName}
                  <ProBadge plan={profile.plan} />
                </p>
                <p className="text-[11px] text-muted-foreground font-mono capitalize truncate">
                  {profile.plan} {t.menu.planSuffix}
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </div>

            {/* Row 2 — league icon + name + XP */}
            <div className="flex items-center gap-2 ps-0.5">
              {leagueIcon ? (
                <LeagueIcon icon={leagueIcon} size="md" />
              ) : (
                <span className="text-base leading-none">{leagueStyle.emoji}</span>
              )}
              <span className={cn('text-xs font-semibold', leagueStyle.textPrimary)}>
                {leagueStyle.name}
              </span>
              <span className="ms-auto inline-flex items-center gap-0.5 text-xs font-mono text-muted-foreground">
                <XpIcon className="size-3" />
                {(profile.xp ?? 0).toLocaleString()} XP
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" sideOffset={12} className="w-56 rounded-xl">
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

      {/* Nav items */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {items.map(({ href, icon: Icon, label, match, badge }) => {
          const active = match(pathname)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-muted text-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={active ? 2.4 : 1.8} />
              <span className="flex-1 truncate">{label}</span>
              {badge != null && badge > 0 && (
                <span className="ms-auto size-5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
