'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * BodyPlaceholderSection — body placeholder en grande taille (semibold) avec
 * révélation au scroll : le texte démarre GRIS (pas trop clair) et chaque mot
 * devient NOIR au fil du scroll (fill mot par mot, gauche → droite).
 *
 * 100 % design system : couleur = token `text-foreground` (noir), le « gris » est
 * obtenu par l'OPACITÉ (0.28 → 1). Aucune font ni couleur inventée.
 */

const COPY = {
  // ⬇️ PLACEHOLDER — texte de grande taille à remplacer par le copy final.
  body:
    'Des briefs design réels. Un feedback IA. Un système de ligues. Tout ce qu’il te faut pour progresser pour de vrai.',
}

const GRAY_OPACITY = 0.28 // opacité de départ (gris pas trop clair)

export function BodyPlaceholderSection() {
  const ref = useRef<HTMLParagraphElement>(null)
  const [progress, setProgress] = useState(0) // 0 → 1 au fil du scroll
  const words = COPY.body.split(' ')

  useEffect(() => {
    // prefers-reduced-motion : pas d'animation → texte plein (noir).
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1)
      return
    }
    let raf = 0
    const compute = () => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      // démarre quand le texte entre par le bas (85% vh), fini quand il monte (30% vh)
      const start = vh * 0.85
      const end = vh * 0.3
      const p = (start - rect.top) / (start - end)
      setProgress(Math.max(0, Math.min(1, p)))
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

  const fill = progress * words.length // position du « front » de remplissage

  return (
    <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
      <p
        ref={ref}
        className="font-heading text-3xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-5xl"
      >
        {words.map((w, i) => {
          const wp = Math.max(0, Math.min(1, fill - i)) // 0 (gris) → 1 (noir) par mot
          const opacity = GRAY_OPACITY + (1 - GRAY_OPACITY) * wp
          return (
            <span key={i} style={{ opacity, transition: 'opacity 0.15s linear' }}>
              {w}{i < words.length - 1 ? ' ' : ''}
            </span>
          )
        })}
      </p>
    </section>
  )
}

export default BodyPlaceholderSection
