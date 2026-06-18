'use client'

import { useEffect, useState } from 'react'

/**
 * BackdropFade — overlay fixe `bg-background` (blanc en clair / fond sombre en dark)
 * posé AU-DESSUS du gradient animé mais SOUS le contenu (z-0). Son opacité monte de
 * 0 → 1 quand on arrive au bloc `#features` : le fond du landing fait un fondu vers
 * le blanc à partir de cette section. Piloté par la position de la section au scroll
 * (rAF throttle). Respecte prefers-reduced-motion (état final direct).
 */
export function BackdropFade() {
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // pas d'animation au scroll : on laisse le gradient visible (opacity 0)
      return
    }
    let raf = 0
    const compute = () => {
      const el = document.getElementById('features')
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      // démarre quand le haut de Features entre par le bas (rect.top = vh),
      // fondu complet quand il atteint 45% de la hauteur d'écran.
      const start = vh
      const end = vh * 0.45
      const p = (start - rect.top) / (start - end)
      setOpacity(Math.max(0, Math.min(1, p)))
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(compute)
    }
    compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 bg-background"
      style={{ opacity }}
    />
  )
}

export default BackdropFade
