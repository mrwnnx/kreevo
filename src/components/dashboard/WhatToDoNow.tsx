import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface WhatToDoNowProps {
  suggestedChallenge: any | null
  referralsCount: number
  profile: any
}

export function WhatToDoNow({
  suggestedChallenge,
  referralsCount,
}: WhatToDoNowProps) {
  const actions = [
    {
      rank: '🥇',
      label: suggestedChallenge
        ? `Compléter "${suggestedChallenge.title}"`
        : 'Compléter un défi',
      xp: `+${suggestedChallenge?.xp_reward || 200} XP`,
      detail: suggestedChallenge
        ? `${suggestedChallenge.deadline_days} jours · ${suggestedChallenge.challenge_type}`
        : 'Meilleure action pour monter',
      href: suggestedChallenge
        ? `/dashboard/challenges/${suggestedChallenge.id}`
        : '/dashboard/challenges',
      xpColor: 'text-violet-600',
    },
    {
      rank: '🥈',
      label: 'Commenter 3 soumissions',
      xp: '+30 XP',
      detail: '5 min · boost ton streak',
      href: '/dashboard/challenges',
      xpColor: 'text-blue-600',
    },
    {
      rank: '🥉',
      label: referralsCount < 5 ? 'Inviter un ami' : 'Partager ton profil',
      xp: '+50 XP',
      detail: 'Instantané · partage ton lien',
      href: '#invite',
      xpColor: 'text-teal-600',
    },
  ]

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-sm">🎯 Quoi faire maintenant</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Actions classées par XP gagnable
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
