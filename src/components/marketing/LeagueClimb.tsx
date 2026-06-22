'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { LeagueIcon } from '@/components/features/league/LeagueIcon'
import { LEAGUE_ICONS } from '@/lib/utils/xp'

/**
 * LeagueClimb — mini-classement animé (carte feature « Monte les ligues »).
 * « Toi » (surligné) grimpe 3ᵉ → 2ᵉ → 1ᵉ ; arrivé 1ᵉ, promotion vers la ligue
 * suivante, puis on repart 3ᵉ dans la nouvelle ligue (boucle). 100% tokens DS.
 * Cycle piloté par un compteur (setInterval 1500ms) → phase = tick%4, ligue = tick/4.
 * Respecte prefers-reduced-motion (état figé : toi 1ᵉ).
 */

const LEAGUES = ['Gold', 'Platinum', 'Diamond'] as const
const ROW_H = 48 // hauteur d'un slot (ligne 40px + 8px d'espace)

type Person = { id: 'a' | 'b' | 'you'; name: string; initial: string; color: string }
const PEOPLE: Person[] = [
  { id: 'a', name: 'Sarah', initial: 'S', color: 'bg-rose-500' },
  { id: 'b', name: 'Mehdi', initial: 'M', color: 'bg-sky-500' },
  { id: 'you', name: 'Toi', initial: 'T', color: 'bg-violet-500' },
]

// rangs par phase : 0 = toi 3ᵉ, 1 = toi 2ᵉ, 2 = toi 1ᵉ, 3 = toi 1ᵉ (promotion)
const RANKS: Record<number, Record<Person['id'], number>> = {
  0: { a: 1, b: 2, you: 3 },
  1: { a: 1, b: 3, you: 2 },
  2: { a: 2, b: 3, you: 1 },
  3: { a: 2, b: 3, you: 1 },
}
const SLOT_XP: Record<number, string> = { 1: '2 480', 2: '2 150', 3: '1 920' }

export function LeagueClimb({ icons }: { icons: Record<string, string> }) {
  const [tick, setTick] = useState(0)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReduced(true)
      setTick(2) // figé : toi 1ᵉ
      return
    }
    const id = setInterval(() => setTick((t) => t + 1), 1500)
    return () => clearInterval(id)
  }, [])

  const phase = reduced ? 2 : tick % 4
  const leagueIdx = reduced ? 0 : Math.floor(tick / 4) % LEAGUES.length
  const league = LEAGUES[leagueIdx]
  const promote = phase === 3
  const ranks = RANKS[phase]

  return (
    <div className="mx-auto w-full max-w-[250px] rounded-2xl border border-border bg-card p-3 shadow-sm">
      {/* Header ligue (flash à la promotion) */}
      <div className="mb-3 flex items-center justify-center gap-2">
        <div
          className={cn(
            'flex size-8 items-center justify-center rounded-full bg-card ring-1 ring-border transition-all duration-500',
            promote && 'scale-110 ring-2 ring-league-gold',
          )}
        >
          <LeagueIcon icon={icons[league] || LEAGUE_ICONS[league]} size="lg" />
        </div>
        <span className="text-sm font-bold text-foreground">Ligue {league}</span>
        {promote && (
          <span className="ms-1 rounded-full bg-league-gold/20 px-2 py-0.5 text-[10px] font-bold text-foreground">
            Promu ↑
          </span>
        )}
      </div>

      {/* Classement : 3 lignes absolues, position = rang (transition fluide) */}
      <div className="relative h-[136px]">
        {PEOPLE.map((p) => {
          const rank = ranks[p.id]
          const isYou = p.id === 'you'
          return (
            <div
              key={p.id}
              className={cn(
                'absolute inset-x-0 flex h-10 items-center gap-2 rounded-lg px-2.5 transition-all duration-700 ease-out',
                isYou ? 'z-10 bg-primary/10 ring-1 ring-primary/25' : '',
              )}
              style={{ transform: `translateY(${(rank - 1) * ROW_H}px)` }}
            >
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                  rank === 1 ? 'bg-league-gold/25 text-foreground' : 'bg-secondary text-muted-foreground',
                )}
              >
                {rank}
              </span>
              <span className={cn('relative size-6 shrink-0 overflow-hidden rounded-full ring-1 ring-border', p.color)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(p.name)}&backgroundColor=transparent`}
                  alt={p.name}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </span>
              <span className="truncate text-xs font-semibold text-foreground">{p.name}</span>
              <span className="ms-auto text-[11px] font-semibold text-muted-foreground">{SLOT_XP[rank]} XP</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default LeagueClimb
