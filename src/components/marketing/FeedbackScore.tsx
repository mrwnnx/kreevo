'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * FeedbackScore — chiffre de score qui se « recharge » (0 → `to`) à CHAQUE cycle
 * de l'animation `.kv-score` (4s), capté via les événements animationiteration.
 * Synchro garantie avec le bob de la carte (même période/phase, démarrés au mount).
 * Décompte en JS (easeOutCubic) → fiable sur tous les navigateurs.
 * SSR / no-JS / prefers-reduced-motion : affiche directement la valeur finale.
 */
export function FeedbackScore({ to, className }: { to: number; className?: string }) {
  const [val, setVal] = useState(to)
  const rafRef = useRef(0)

  const run = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVal(to)
      return
    }
    cancelAnimationFrame(rafRef.current)
    const DURATION = 1100
    let start = 0
    const tick = (ts: number) => {
      if (!start) start = ts
      const p = Math.min(1, (ts - start) / DURATION)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
      setVal(Math.round(to * eased))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  // 1er décompte au montage (la 1re « respiration » de la carte se joue aussi au montage)
  useEffect(() => {
    run()
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <span className={className} onAnimationIteration={run}>
      {val}
    </span>
  )
}

export default FeedbackScore
