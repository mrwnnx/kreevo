'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, X, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

/**
 * HireMediaSection — 2 blocs média alternés (image droite puis gauche, mobile = image
 * au-dessus) + 2 modals explicatifs (3 tabs verticaux + image/texte à droite).
 * Modal = custom simple (state + overlay portal + Escape + click-outside), pas de
 * dépendance. Tokens projet uniquement (bg-card, rounded-[24px], primary…).
 * Textes via i18n (prop `t` = dict.landing.hire) ; contenu des modals = placeholder.
 */

type HireT = Dictionary['landing']['hire']
type Tab = { label: string; title: string; body: string }

/* Placeholder d'image (les vraies images porteront la couleur). */
function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-[20px] bg-muted text-muted-foreground/40',
        className,
      )}
    >
      <ImageIcon className="size-10" />
    </div>
  )
}

/* Modal custom : portal + overlay + Escape + click-outside. */
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* overlay — click-outside ferme */}
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-black/40 supports-backdrop-filter:backdrop-blur-sm"
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[24px] border border-border bg-card p-6 shadow-xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute end-4 top-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground">{title}</h3>
        <div className="mt-6">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

/* Panneau à 3 tabs verticaux + image/texte à droite (state local). */
function TabsPanel({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(0)
  const t = tabs[active]
  return (
    <div className="grid gap-6 md:grid-cols-[200px_1fr]">
      {/* Tabs verticaux */}
      <div className="flex flex-col gap-2">
        {tabs.map((tab, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={cn(
              'rounded-2xl border px-4 py-3 text-start text-sm font-medium transition-colors',
              i === active
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Image + texte du tab actif */}
      <div>
        <ImagePlaceholder className="aspect-[16/10] w-full" />
        <h4 className="mt-4 font-heading text-lg font-semibold tracking-tight text-foreground">{t.title}</h4>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.body}</p>
      </div>
    </div>
  )
}

/* Un bloc média (carte neutre, texte d'un côté, image de l'autre, fullscreen en bas à gauche). */
function MediaBlock({
  title,
  body,
  imageRight,
  image,
  onOpen,
}: {
  title: string
  body: string
  imageRight: boolean
  image?: string
  onOpen: () => void
}) {
  const orderCls = imageRight ? 'md:order-2' : 'md:order-1'
  return (
    <div className="relative rounded-[24px] border border-foreground/10 bg-background/35 p-6 backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-b before:from-background/40 before:to-transparent sm:p-8">
      <div className="relative z-10 grid items-stretch gap-6 md:grid-cols-2 md:gap-10">
        {/* Image (1ère dans le DOM → au-dessus sur mobile) */}
        {image ? (
          <div className={cn('overflow-hidden rounded-[20px] bg-muted', orderCls)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt="Designer au travail"
              loading="lazy"
              className="aspect-[4/5] w-full object-cover object-[50%_25%]"
            />
          </div>
        ) : (
          <ImagePlaceholder className={cn('aspect-[4/5] w-full', orderCls)} />
        )}

        {/* Texte + fullscreen (icône en bas à droite, alignée avec le bas de l'image) */}
        <div className={cn('flex h-full flex-col', imageRight ? 'md:order-1' : 'md:order-2')}>
          <h3 className="max-w-sm font-heading text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">{title}</h3>
          <p className="mt-5 max-w-sm text-lg leading-relaxed text-muted-foreground sm:text-xl">{body}</p>
          <button
            type="button"
            onClick={onOpen}
            aria-label="Voir en grand"
            className="mt-auto inline-flex size-10 items-center justify-center self-start rounded-full border border-border text-muted-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            <Maximize2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function HireMediaSection({ t }: { t: HireT }) {
  const [openModal, setOpenModal] = useState<1 | 2 | null>(null)

  // Tabs des modals = placeholder traduit (à remplir ensuite).
  const modalTabs: Tab[] = [
    { label: t.modalTab1, title: t.modalPhTitle, body: t.modalPhBody },
    { label: t.modalTab2, title: t.modalPhTitle, body: t.modalPhBody },
    { label: t.modalTab3, title: t.modalPhTitle, body: t.modalPhBody },
  ]

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="space-y-6">
        <MediaBlock
          title={t.media1Title}
          body={t.media1Body}
          imageRight
          image="/hire/hire-brief.webp"
          onOpen={() => setOpenModal(1)}
        />
        <MediaBlock title={t.media2Title} body={t.media2Body} imageRight={false} onOpen={() => setOpenModal(2)} />
      </div>

      <Modal open={openModal === 1} onClose={() => setOpenModal(null)} title={t.media1Title}>
        <TabsPanel tabs={modalTabs} />
      </Modal>
      <Modal open={openModal === 2} onClose={() => setOpenModal(null)} title={t.media2Title}>
        <TabsPanel tabs={modalTabs} />
      </Modal>
    </section>
  )
}

export default HireMediaSection
