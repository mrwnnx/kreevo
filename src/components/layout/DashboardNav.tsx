'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Bell, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/challenges', label: 'Challenges' },
  { href: '/dashboard/leaderboard', label: 'Leagues' },
]

export function DashboardNav({ profile }: { profile: any }) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border h-16">
      <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">

        <Link href="/dashboard" className="flex-shrink-0">
          <span className="text-xl font-bold text-violet-600">Kreevo</span>
        </Link>

        <div className="flex items-center gap-1">
          {NAV_LINKS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                isActive(item.href)
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {profile?.unread_notifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          <Link
            href="/dashboard/settings"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <Link
            href={profile?.username ? `/u/${profile.username}` : '/dashboard/profile'}
            className="ml-1"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-violet-100 flex items-center justify-center text-sm font-medium text-violet-600">
              {profile?.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={profile.avatar_url}
                  alt={profile.username ?? ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile?.username?.[0]?.toUpperCase() ?? '?'
              )}
            </div>
          </Link>
        </div>

      </div>
    </nav>
  )
}
