'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChallengePreviewCard, type ChallengePreview } from '@/components/features/challenge/ChallengePreviewCard'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

/**
 * HeroSection — hero de la landing Kreevo.
 *
 * Bloc centré (titre/body/CTA) intact, puis une ROUE de cartes draggable, full-width.
 * - Roue virtuelle rayon R, centre TRÈS sous l'écran : chaque carte dans un wrapper avec
 *   transform-origin au centre de la roue (50% Rpx) → rotate(angle) la pose tangente, tout seul.
 * - Drag (pointer events souris+tactile) → 1 seul state `rotation` ; inertie rAF + friction.
 * - Boucle infinie : angle wrappé sur [−TOTAL/2, +TOTAL/2] (TOTAL = count·step) → R=2000 fait
 *   sortir les cartes vers ±90° (hors écran), aucune carte qui « pop ».
 * - Scroll mobile préservé : touch-action: pan-y + verrou directionnel (capture seulement si
 *   |dx| > |dy| après un seuil), sinon la page scrolle nativement.
 *
 * ⚠️ ChallengePreviewCard RÉUTILISÉE telle quelle (wrappée). Tokens DS, fade via var(--background).
 */

/* ── Tous les réglages ici ─────────────────────────────────────────────── */
const WHEEL = {
  R: 6000,            // rayon de la roue (px). ↑ R = cartes plus droites (moins d'inclinaison) → ne se chevauchent pas.
  step: 4,            // ° entre 2 cartes (pilote inclinaison ET espacement ≈ R·sin(step) ≈ 419px). ↓ step = moins penché.
  count: 30,          // nb de cartes posées (remplissage + marge pour le wrap).
  cardW: 350,         // largeur d'une carte (px). Espacement centres ≈ 419px → cartes larges + gap, sans contact.
  topOffset: 16,      // décalage du sommet de la roue depuis le haut de la zone (px).
  friction: 0.94,     // inertie : vitesse *= friction par frame.
  sensitivity: 0.05,  // ° de rotation par px de drag.
  dragThreshold: 8,   // px avant de décider drag-horizontal vs scroll-vertical.
  edgeFade: false,    // dégradés latéraux vers var(--background) (désactivés).
  autoRotate: false,  // pas de spin auto au repos (roue figée tant qu'on ne drague pas).
  autoSpeed: 0.03,    // °/frame du spin auto (très lent).
  scrollDrive: true,  // la roue tourne quand on scrolle la page.
  scrollSensitivity: 0.02, // ° de rotation par px de scroll vertical.
} as const

const TOTAL = WHEEL.count * WHEEL.step

/* Destination au clic d'une carte → démarre le parcours d'inscription. */
const CARD_HREF = '/signup'

/* Méta des cartes (indépendant de la langue) : emoji + xp + deadline.
   Le texte (title/brief/specialty/type) vient de l'i18n (t.cards), fusionné par index.
   ⚠️ emoji baké ici (et pas dérivé de `specialty`) pour rester correct dans toutes les langues. */
const CARD_META: { emoji: string; xp: number; deadlineDays: number }[] = [
  { emoji: '✏️', xp: 1500, deadlineDays: 45 },
  { emoji: '📱', xp: 1500, deadlineDays: 45 },
  { emoji: '🎨', xp: 1500, deadlineDays: 45 },
  { emoji: '📱', xp: 1500, deadlineDays: 45 },
  { emoji: '✏️', xp: 1200, deadlineDays: 30 },
  { emoji: '📱', xp: 1200, deadlineDays: 30 },
  { emoji: '🎨', xp: 1200, deadlineDays: 30 },
  { emoji: '📱', xp: 1200, deadlineDays: 30 },
  { emoji: '✏️', xp: 900, deadlineDays: 30 },
  { emoji: '📱', xp: 900, deadlineDays: 30 },
  { emoji: '🎨', xp: 900, deadlineDays: 30 },
  { emoji: '✏️', xp: 700, deadlineDays: 21 },
  { emoji: '✏️', xp: 500, deadlineDays: 14 },
  { emoji: '✏️', xp: 350, deadlineDays: 10 },
  { emoji: '✏️', xp: 320, deadlineDays: 7 },
  { emoji: '✏️', xp: 320, deadlineDays: 7 },
]

/* Wrap centré : ramène n'importe quel angle dans [−TOTAL/2, +TOTAL/2). */
function wrapAngle(a: number): number {
  return ((a + TOTAL / 2) % TOTAL + TOTAL) % TOTAL - TOTAL / 2
}
function zForAngle(angle: number): number {
  // centre (angle≈0) devant ; bords derrière
  return 1000 + Math.round(Math.cos((angle * Math.PI) / 180) * 1000)
}

export function HeroSection({ t }: { t: Dictionary['landing'] }) {
  // Fusionne le texte i18n (t.cards) avec la méta lang-independent (CARD_META).
  const items: ChallengePreview[] = t.cards.map((c, i) => ({
    ...c,
    emoji: CARD_META[i]?.emoji,
    xp: CARD_META[i]?.xp,
    deadlineDays: CARD_META[i]?.deadlineDays,
  }))
  // count cartes en bouclant sur les vraies données
  const cards = Array.from({ length: WHEEL.count }, (_, i) => items[i % items.length])

  const wrapEls = useRef<Array<HTMLDivElement | null>>([])
  const rotation = useRef(0)
  const velocity = useRef(0)
  const dragging = useRef(false)
  const lockDir = useRef<'none' | 'x' | 'y'>('none')
  const startX = useRef(0)
  const startY = useRef(0)
  const lastX = useRef(0)
  const moved = useRef(false) // true dès qu'on drague → bloque le clic-navigation
  const lastScrollY = useRef(0)
  const reduced = useRef(false)
  const [grabbing, setGrabbing] = useState(false)

  /* Applique rotation → transform de chaque wrapper (impératif, transform-only, pas de re-render). */
  const apply = () => {
    for (let i = 0; i < WHEEL.count; i++) {
      const el = wrapEls.current[i]
      if (!el) continue
      const angle = wrapAngle(i * WHEEL.step + rotation.current)
      el.style.transform = `rotate(${angle}deg)`
      el.style.zIndex = String(zForAngle(angle))
    }
  }

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const tick = () => {
      if (!dragging.current) {
        if (Math.abs(velocity.current) > 0.01) {
          rotation.current += velocity.current
          velocity.current *= WHEEL.friction
          apply()
        } else {
          velocity.current = 0
          if (WHEEL.autoRotate && !reduced.current) {
            rotation.current += WHEEL.autoSpeed
            apply()
          }
        }
      }
      raf = requestAnimationFrame(tick)
    }
    apply()
    raf = requestAnimationFrame(tick)

    // Scroll → rotation de la roue (delta de scrollY × sensibilité).
    lastScrollY.current = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const dy = y - lastScrollY.current
      lastScrollY.current = y
      if (WHEEL.scrollDrive && !dragging.current) {
        rotation.current += dy * WHEEL.scrollSensitivity
        apply()
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  /* ── Drag (pointer events) ── */
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true
    lockDir.current = 'none'
    moved.current = false
    velocity.current = 0
    startX.current = e.clientX
    startY.current = e.clientY
    lastX.current = e.clientX
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current

    if (lockDir.current === 'none') {
      if (Math.hypot(dx, dy) > WHEEL.dragThreshold) {
        if (Math.abs(dx) > Math.abs(dy)) {
          lockDir.current = 'x'
          moved.current = true // c'est un drag → on neutralisera le clic
          e.currentTarget.setPointerCapture?.(e.pointerId)
          setGrabbing(true)
        } else {
          // geste vertical → on relâche : la page scrolle nativement (touch-action: pan-y)
          lockDir.current = 'y'
          dragging.current = false
          return
        }
      } else {
        return
      }
    }

    if (lockDir.current === 'x') {
      const fdx = e.clientX - lastX.current
      lastX.current = e.clientX
      const dRot = fdx * WHEEL.sensitivity
      rotation.current += dRot
      velocity.current = reduced.current ? 0 : dRot
      apply()
    }
  }
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false
    lockDir.current = 'none'
    setGrabbing(false)
    try { e.currentTarget.releasePointerCapture?.(e.pointerId) } catch { /* noop */ }
  }

  return (
    <section className="relative isolate w-full overflow-hidden">
      {/* ── Bloc centré (inchangé) ── */}
      <div className="mx-auto max-w-2xl px-4 pt-28 text-center sm:px-6 sm:pt-40">
        <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
          {t.hero.title}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t.hero.body}
        </p>
        <div className="mt-8 flex justify-center">
          <Button size="lg" render={<a href="/signup" />}>
            {t.hero.cta}
          </Button>
        </div>
      </div>

      {/* ── Roue draggable, full-width ── */}
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className={`relative mt-14 h-[420px] w-full select-none sm:mt-20 sm:h-[540px] ${grabbing ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ touchAction: 'pan-y' }}
      >
        {cards.map((it, i) => {
          const angle0 = wrapAngle(i * WHEEL.step) // SSR : rotation 0
          return (
            <div
              key={i}
              ref={(el) => { wrapEls.current[i] = el }}
              className="absolute"
              style={{
                top: WHEEL.topOffset,
                left: '50%',
                width: WHEEL.cardW,
                marginLeft: -WHEEL.cardW / 2,
                transformOrigin: `50% ${WHEEL.R}px`, // = centre de la roue
                transform: `rotate(${angle0}deg)`,
                zIndex: zForAngle(angle0),
                willChange: 'transform',
              }}
            >
              <a
                href={CARD_HREF}
                draggable={false}
                onClick={(e) => { if (moved.current) e.preventDefault() }} // drag → pas de navigation
                className="block"
                style={{ cursor: 'inherit' }} // garde le curseur grab de la roue
              >
                <ChallengePreviewCard colorIndex={i} xpLabel={t.card.xp} daysSuffix={t.card.daysSuffix} {...it} />
              </a>
            </div>
          )
        })}

        {/* Fades latéraux → var(--background) (token réel). Pas de fade en bas. */}
        {WHEEL.edgeFade && (
          <>
            <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[16%] bg-gradient-to-r from-background to-transparent" style={{ zIndex: 5000 }} />
            <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[16%] bg-gradient-to-l from-background to-transparent" style={{ zIndex: 5000 }} />
          </>
        )}
      </div>
    </section>
  )
}

export default HeroSection
