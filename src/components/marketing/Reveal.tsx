'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Reveal — slide-up + fade-in (800ms) à l'entrée dans le viewport.
 * IntersectionObserver, joué une seule fois. Respecte prefers-reduced-motion
 * (rendu direct à l'état final, sans animation). Tokens/transform only.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: 'opacity 800ms ease-out, transform 800ms ease-out',
        transitionDelay: `${delay}ms`,
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(32px)',
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}

export default Reveal
