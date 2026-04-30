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
import type { Profile } from '@/types/database.types'
import { leagueLabel, leagueColor } from '@/lib/utils/xp'

const NAV = [
  { href: '/dashboard',             label: 'Dashboard',  icon: House,     match: (p: string) => p === '/dashboard' },
  { href: '/dashboard/challenges',  label: 'Challenges', icon: Trophy,    match: (p: string) => p.startsWith('/dashboard/challenges') },
  { href: '/dashboard/leaderboard', label: 'Leagues',    icon: BarChart3, match: (p: string) => p.startsWith('/dashboard/leaderboard') },
]

export function FloatingNav({ profile }: { profile: Profile }) {
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
    <div
      className={cn(
        'sticky top-0 z-40 flex items-center px-6 gap-4 h-14 transition-all duration-200',
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
        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">beta</span>
      </Link>

      {/* Nav pill — center */}
      <div className="flex-1 flex justify-center">
        <div
          className={cn(
            'flex items-center gap-0.5 px-1.5 py-1.5 rounded-full transition-opacity duration-300',
            mounted ? 'opacity-100' : 'opacity-0'
          )}
          style={{ background: 'var(--nav-pill-bg)' }}
        >
          {NAV.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-150',
                  active
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-zinc-500 hover:text-foreground hover:bg-foreground/[0.06] dark:text-zinc-400 dark:hover:text-white'
                )}
              >
                <Icon className="size-[15px] shrink-0" strokeWidth={active ? 2.4 : 1.8} />
                <span className="text-[13px] font-medium leading-none">{label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Right — notifications + avatar */}
      <div className="shrink-0 flex items-center gap-1">
        <NotificationBell userId={profile.id} />

        {/* League chip */}
        <div className="flex items-center gap-2 pl-3 border-l border-border mr-1">
          <span
            className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full leading-none"
            style={{ background: leagueColor(league) + '18', color: leagueColor(league) }}
          >
            {leagueLabel(league)}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full hover:bg-foreground/[0.04] transition-colors outline-none">
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
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
          <DropdownMenuContent align="end" className="w-48 rounded-xl mt-1">
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-sm font-semibold inline-flex items-center gap-1.5">
                @{profile.username}
                <ProBadge plan={profile.plan} />
              </p>
              <p className="text-xs text-muted-foreground font-mono capitalize">{profile.plan} plan</p>
            </div>
            <DropdownMenuItem>
              <Link href={`/u/${profile.username}`} className="w-full text-sm font-medium">Profil public</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/dashboard/profile" className="w-full text-sm font-medium">Modifier le profil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/dashboard/settings" className="w-full text-sm font-medium">Paramètres</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/dashboard/notifications" className="w-full text-sm font-medium">Notifications</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <p className="text-sm text-muted-foreground mb-2">Apparence</p>
              <ThemeToggle />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <form action={signOut} className="w-full">
                <button type="submit" className="w-full text-left text-sm">Se déconnecter</button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
