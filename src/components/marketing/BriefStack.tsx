'use client'

import { useEffect, useState } from 'react'
import { ChallengePreviewCard, type ChallengePreview } from '@/components/features/challenge/ChallengePreviewCard'

/**
 * BriefStack — pile de cartes challenge (carte feature « Des briefs réels »).
 * Les cartes sont empilées (front net → arrières décalés/réduits). Toutes les 4s,
 * la carte du dessus passe en bas de la pile (rotation de l'ordre, transition fluide).
 * Respecte prefers-reduced-motion (pile figée).
 */

// slots de profondeur (échelle inclut la mise à l'échelle d'affichage)
const SLOT = [
  { y: 0, scale: 1.0, rot: 0, op: 1, z: 40 },
  { y: 26, scale: 0.9, rot: -4, op: 0.9, z: 30 },
  { y: 48, scale: 0.82, rot: 4, op: 0.6, z: 20 },
  { y: 64, scale: 0.76, rot: 0, op: 0, z: 10 },
]

export function BriefStack({ items, colors }: { items: ChallengePreview[]; colors: number[] }) {
  const [order, setOrder] = useState<number[]>(() => items.map((_, i) => i))

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setOrder((o) => [...o.slice(1), o[0]]), 2500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative h-full w-full">
      {items.map((it, i) => {
        const pos = order.indexOf(i)
        const s = SLOT[Math.min(pos, SLOT.length - 1)]
        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 w-[300px] origin-center transition-all duration-700 ease-out [&>div>div:last-child]:hidden"
            style={{
              transform: `translate(-50%, -50%) translateY(${s.y}px) scale(${s.scale}) rotate(${s.rot}deg)`,
              opacity: s.op,
              zIndex: s.z,
            }}
          >
            <ChallengePreviewCard colorIndex={colors[i] ?? 0} {...it} />
          </div>
        )
      })}
    </div>
  )
}

export default BriefStack
