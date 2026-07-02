'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Trophy, Users, ShieldAlert, MessageSquare,
  Mail, Settings, ArrowLeft, Palette, Medal, FileCheck, BookOpen, LayoutTemplate,
  Tag, Building2, Layers, Sparkles, Newspaper, BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'

const NAV = [
  { href: '/admin/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/admin/analytics',    label: 'Analytics',      icon: BarChart3 },
  { href: '/admin/leagues',      label: 'Ligues',         icon: Medal },
  { href: '/admin/challenges',   label: 'Challenges',     icon: Trophy },
  { href: '/admin/specialties',           label: 'Spécialités', icon: Layers,   sub: true },
  { href: '/admin/challenges/types',      label: 'Types',      icon: Tag,       sub: true },
  { href: '/admin/challenges/industries', label: 'Industries', icon: Building2, sub: true },
  { href: '/admin/submissions',  label: 'Soumissions',    icon: FileCheck },
  { href: '/admin/users',        label: 'Users',          icon: Users },
  { href: '/admin/moderation',   label: 'Modération',     icon: ShieldAlert, badge: true },
  { href: '/admin/feedbacks',    label: 'Feedbacks Pro',  icon: MessageSquare },
  { href: '/admin/hire-waitlist', label: 'Waitlist Hiring', icon: Mail },
  { href: '/admin/emails',       label: 'Emails',         icon: Mail },
  { href: '/admin/emails/templates', label: 'Templates email', icon: LayoutTemplate },
  { href: '/admin/help',         label: 'Help Center',    icon: BookOpen },
  { href: '/admin/blog',         label: 'Blog',           icon: Newspaper },
  { href: '/admin/design',       label: 'Design System',  icon: Palette },
  { href: '/admin/onboarding',   label: 'Onboarding',     icon: Sparkles },
  { href: '/admin/settings',     label: 'Paramètres',     icon: Settings },
]

export function AdminSidebar({ pendingMod = 0 }: { pendingMod?: number }) {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col h-full w-56 shrink-0 border-e border-border bg-card">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <Logo className="h-5" />
          <span className="text-[10px] font-mono bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded uppercase tracking-wider">
            admin
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {(() => {
          // Active = the longest NAV href that prefixes the current path (so /admin/emails/templates
          // highlights "Templates email", not also "Emails").
          const activeHref = NAV
            .filter(n => pathname === n.href || pathname.startsWith(n.href + '/'))
            .sort((a, b) => b.href.length - a.href.length)[0]?.href
          return NAV.map(({ href, label, icon: Icon, badge, sub }) => {
          const active = href === activeHref
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all',
                sub && 'ms-3 text-[13px]',
                active
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <Icon className={cn('shrink-0', sub ? 'size-3.5' : 'size-4')} />
              <span className="flex-1">{label}</span>
              {badge && pendingMod > 0 && (
                <span className="text-[10px] font-mono bg-destructive text-destructive-foreground rounded-full px-1.5 min-w-[18px] text-center">
                  {pendingMod > 99 ? '99+' : pendingMod}
                </span>
              )}
            </Link>
          )
          })
        })()}
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
