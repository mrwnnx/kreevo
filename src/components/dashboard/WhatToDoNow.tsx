import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { tx } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

interface WhatToDoNowProps {
  suggestedChallenge: any | null
  referralsCount: number
  profile: any
  t: Dictionary['dashboard']['whatToDoNow']
}

export function WhatToDoNow({
  suggestedChallenge,
  referralsCount,
  t,
}: WhatToDoNowProps) {
  const actions = [
    {
      rank: '🥇',
      label: suggestedChallenge
        ? tx(t.complete, { title: suggestedChallenge.title })
        : t.completeAny,
      xp: tx(t.xp, { n: suggestedChallenge?.xp_reward || 200 }),
      detail: suggestedChallenge
        ? tx(t.daysType, { days: suggestedChallenge.deadline_days, type: suggestedChallenge.challenge_type })
        : t.bestAction,
      href: suggestedChallenge
        ? `/dashboard/challenges/${suggestedChallenge.id}`
        : '/dashboard/challenges',
      xpColor: 'text-violet-600',
    },
    {
      rank: '🥈',
      label: t.commentSubmissions,
      xp: tx(t.xp, { n: 30 }),
      detail: t.commentDetail,
      href: '/dashboard/challenges',
      xpColor: 'text-blue-600',
    },
    {
      rank: '🥉',
      label: referralsCount < 5 ? t.inviteFriend : t.shareProfile,
      xp: tx(t.xp, { n: 50 }),
      detail: t.shareDetail,
      href: '#invite',
      xpColor: 'text-teal-600',
    },
  ]

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-sm">{t.title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t.subtitle}
        </p>
      </div>

      <div className="divide-y divide-border">
        {actions.map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className="flex items-center gap-3 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors duration-150 group"
          >
            <span className="text-xl flex-shrink-0">{action.rank}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-violet-600 transition-colors">
                {action.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{action.detail}</p>
            </div>
            <span className={`text-sm font-bold flex-shrink-0 ${action.xpColor}`}>
              {action.xp}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:text-violet-600 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
