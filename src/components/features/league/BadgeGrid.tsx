'use client'

import { BADGE_DEFINITIONS } from '@/lib/utils/badges'

interface Badge {
  id: string
  badge_type: string
  created_at: string
  metadata?: Record<string, unknown>
}

interface Props {
  badges: Badge[]
}

export function BadgeGrid({ badges }: Props) {
  if (badges.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground font-mono">
        Aucun badge pour l'instant. Soumets un challenge pour débloquer le premier.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {badges.map(badge => {
        const def = BADGE_DEFINITIONS[badge.badge_type]
        if (!def) return null

        return (
          <div
            key={badge.id}
            className="group relative flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-default"
          >
            <span className="text-4xl leading-none" style={{ fontSize: 40 }}>{def.icon}</span>
            <p className="text-[11px] font-semibold text-center leading-tight">{def.label}</p>
            <p className="text-[10px] font-mono text-muted-foreground">
              {new Date(badge.created_at).toLocaleDateString('fr', { month: 'short', year: '2-digit' })}
            </p>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 hidden group-hover:block w-max max-w-[160px]">
              <div className="rounded-md bg-popover border border-border px-2.5 py-1.5 text-[11px] text-popover-foreground shadow-md text-center">
                {def.description}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
