'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChallengePreviewCard, type ChallengePreview } from '@/components/features/challenge/ChallengePreviewCard'

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

/* Destination au clic d'une carte (placeholder, à brancher comme le CTA — ex. /signup). */
const CARD_HREF = '#start'

const COPY = {
  title: 'Practice made perfect',
  // ⬇️ PLACEHOLDER — remplace par le copy final.
  body:
    '[Body placeholder] Des briefs design réels, un feedback IA et un système de ligues pour progresser et construire ton portfolio. Pour les designers UX/UI et graphic.',
  cta: 'Get started',
}

/* Aperçus — VRAIS challenges publiés (mix UX/UI + graphic). Remplaçables par un fetch live. */
const CHALLENGES: ChallengePreview[] = [
  { title: 'Univers de marque gaming — lancement mondial', brief: 'Crée l’univers visuel complet pour le lancement mondial d’un jeu AAA.', specialty: 'Graphic Designer', type: 'Brand Identity', xp: 1500, deadlineDays: 45 },
  { title: 'Redesign OS mobile — paradigme IA-first', brief: 'Imagine le redesign complet d’un OS mobile centré sur l’IA générative.', specialty: 'UX Designer', type: 'Redesign', xp: 1500, deadlineDays: 45 },
  { title: 'Design system génératif — IA-driven', brief: 'Crée un design system dont les composants s’adaptent dynamiquement via IA.', specialty: 'UI Designer', type: 'Design System', xp: 1500, deadlineDays: 45 },
  { title: 'Écosystème produit IA — vision stratégique', brief: 'Conçois la vision UX stratégique d’un écosystème de produits IA pour une entreprise Fortune 500.', specialty: 'UX Designer', type: 'UX Case Study', xp: 1500, deadlineDays: 45 },
  { title: 'Identité de marque pays — tourisme', brief: 'Crée l’identité de marque nationale d’un pays pour attirer touristes et investisseurs.', specialty: 'Graphic Designer', type: 'Brand Identity', xp: 1200, deadlineDays: 30 },
  { title: 'Futur de l’interface bancaire — vision 2030', brief: 'Imagine et conçois l’interface bancaire du futur pour 2030, IA générative intégrée.', specialty: 'UX Designer', type: 'Prototype', xp: 1200, deadlineDays: 30 },
  { title: 'Design system open-source gouvernance', brief: 'Crée un design system open-source complet avec sa gouvernance communautaire.', specialty: 'UI Designer', type: 'Design System', xp: 1200, deadlineDays: 30 },
  { title: 'Plateforme IA santé — éthique & expérience', brief: 'Conçois une plateforme de diagnostic IA médicale en intégrant les enjeux éthiques.', specialty: 'UX Designer', type: 'UX Case Study', xp: 1200, deadlineDays: 30 },
  { title: 'Brand universe marque luxe — omnicanal', brief: 'Développe l’univers de marque complet d’une maison de mode de luxe pour tous les canaux.', specialty: 'Graphic Designer', type: 'Brand Identity', xp: 900, deadlineDays: 30 },
  { title: 'Super-app voyage — expérience bout-en-bout', brief: 'Conçois l’expérience complète d’une super-app de voyage de bout en bout.', specialty: 'UX Designer', type: 'UX Case Study', xp: 900, deadlineDays: 30 },
  { title: 'Design System multi-marque entreprise', brief: 'Architecte un design system d’entreprise gérant 4 marques sous une fondation commune.', specialty: 'UI Designer', type: 'Design System', xp: 900, deadlineDays: 30 },
  { title: 'Identité motion brand crypto', brief: 'Crée une identité de marque animée pour un exchange crypto nouvelle génération.', specialty: 'Graphic Designer', type: 'Motion', xp: 700, deadlineDays: 21 },
  { title: 'Packaging produit bien-être premium', brief: 'Conçois le packaging d’une gamme de suppléments bien-être pour une marque D2C premium.', specialty: 'Graphic Designer', type: 'Packaging', xp: 500, deadlineDays: 14 },
  { title: 'Social Media Kit agence immobilière', brief: 'Conçois un kit de templates réseaux sociaux pour une agence immobilière premium.', specialty: 'Graphic Designer', type: 'Social Media Kit', xp: 350, deadlineDays: 10 },
  { title: 'Packaging gamme cosmétiques', brief: 'Crée le packaging d’une gamme de 3 produits cosmétiques naturels.', specialty: 'Graphic Designer', type: 'Packaging', xp: 320, deadlineDays: 7 },
  { title: 'Packaging café premium', brief: 'Crée le packaging d’une gamme de cafés premium single origin.', specialty: 'Graphic Designer', type: 'Packaging', xp: 320, deadlineDays: 7 },
]

/* Wrap centré : ramène n'importe quel angle dans [−TOTAL/2, +TOTAL/2). */
function wrapAngle(a: number): number {
  return ((a + TOTAL / 2) % TOTAL + TOTAL) % TOTAL - TOTAL / 2
}
function zForAngle(angle: number): number {
  // centre (angle≈0) devant ; bords derrière
  return 1000 + Math.round(Math.cos((angle * Math.PI) / 180) * 1000)
}

export function HeroSection({ items = CHALLENGES }: { items?: ChallengePreview[] }) {
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
    <section className="relative w-full overflow-hidden">
      {/* ── Bloc centré (inchangé) ── */}
      <div className="mx-auto max-w-2xl px-4 pt-16 text-center sm:px-6 sm:pt-24">
        <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
          {COPY.title}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {COPY.body}
        </p>
        <div className="mt-8 flex justify-center">
          <Button size="lg" render={<a href="#start" />}>
            {COPY.cta}
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
                <ChallengePreviewCard colorIndex={i} {...it} />
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
