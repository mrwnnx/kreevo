'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * FallingBadges — badges qui « tombent » du haut de la carte et se posent en bas.
 * Déclenché quand la carte entre dans le viewport (IntersectionObserver), avec un
 * léger rebond + stagger. Respecte prefers-reduced-motion (badges statiques).
 * Les @keyframes `kvDrop` sont définies par le parent (StatsSection) — hors du <p>.
 * Root = <span> (valide à l'intérieur du <p> de MarketingStatCard).
 */
export function FallingBadges({ items }: { items: readonly string[] }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [state, setState] = useState<'hidden' | 'play' | 'static'>('hidden')

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setState('static')
      return
    }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setState('play'); io.disconnect() } },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <span ref={ref} className="flex flex-wrap items-end gap-2">
      {items.map((it, i) => (
        <span
          key={it}
          className="rounded-full bg-background px-4 py-2 text-base font-semibold text-foreground"
          style={
            state === 'play'
              ? { animation: 'kvDrop 0.6s cubic-bezier(.2,.9,.3,1) both', animationDelay: `${i * 0.12}s` }
              : { opacity: state === 'static' ? 1 : 0 }
          }
        >
          {it}
        </span>
      ))}
    </span>
  )
}

export default FallingBadges
