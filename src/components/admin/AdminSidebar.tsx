'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Trophy, Users, ShieldAlert, MessageSquare,
  Mail, Settings, ArrowLeft, Palette, Medal, FileCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/admin/leagues',      label: 'Ligues',         icon: Medal },
  { href: '/admin/challenges',   label: 'Challenges',     icon: Trophy },
  { href: '/admin/submissions',  label: 'Soumissions',    icon: FileCheck },
  { href: '/admin/users',        label: 'Users',          icon: Users },
  { href: '/admin/moderation',   label: 'Modération',     icon: ShieldAlert, badge: true },
  { href: '/admin/feedbacks',    label: 'Feedbacks Pro',  icon: MessageSquare },
  { href: '/admin/emails',       label: 'Emails',         icon: Mail },
  { href: '/admin/design',       label: 'Design System',  icon: Palette },
  { href: '/admin/settings',     label: 'Paramètres',     icon: Settings },
]

export function AdminSidebar({ pendingMod = 0 }: { pendingMod?: number }) {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col h-full w-56 shrink-0 border-r border-border bg-card">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">kreevo</span>
          <span className="text-[10px] font-mono bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded uppercase tracking-wider">
            admin
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all',
                active
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && pendingMod > 0 && (
                <span className="text-[10px] font-mono bg-destructive text-destructive-foreground rounded-full px-1.5 min-w-[18px] text-center">
                  {pendingMod > 99 ? '99+' : pendingMod}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border px-3 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Retour app
        </Link>
      </div>
    </aside>
  )
}
