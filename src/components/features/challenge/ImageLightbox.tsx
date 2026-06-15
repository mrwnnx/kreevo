'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface Props {
  src: string
  alt?: string
  className?: string
  thumbnailClassName?: string
  openLabel?: string
  closeLabel?: string
  /** Optional gallery — when provided (length > 1), opens with ←/→ navigation. */
  images?: string[]
  /** Index of `src` in `images`. Used to position the carousel on open. */
  index?: number
  prevLabel?: string
  nextLabel?: string
  /** Optional caption under the enlarged image. Omitted by existing callers → no caption rendered. */
  title?: string
  meta?: string
}

export function ImageLightbox({
  src,
  alt,
  className,
  thumbnailClassName,
  openLabel = 'Agrandir l\'image',
  closeLabel = 'Fermer',
  images,
  index = 0,
  prevLabel = 'Image précédente',
  nextLabel = 'Image suivante',
  title,
  meta,
}: Props) {
  const gallery = images && images.length > 1 ? images : null
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(index)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    if (open) setActiveIdx(index)
  }, [open, index])

  function goPrev() {
    if (!gallery) return
    setActiveIdx((i) => (i - 1 + gallery.length) % gallery.length)
  }
  function goNext() {
    if (!gallery) return
    setActiveIdx((i) => (i + 1) % gallery.length)
  }

  useEffect(() => {
    if (!open || !gallery) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        e.stopPropagation()
        goPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        e.stopPropagation()
        goNext()
      }
    }
    // capture phase — runs before Base UI dialog focus-trap can swallow the keys
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, gallery])

  const currentSrc = gallery ? gallery[activeIdx] : src

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }
  function onTouchEnd(e: React.TouchEvent) {
    const startX = touchStartX.current
    touchStartX.current = null
    if (startX == null || !gallery) return
    const endX = e.changedTouches[0]?.clientX ?? startX
    const delta = endX - startX
    if (Math.abs(delta) < 50) return
    if (delta > 0) goPrev()
    else goNext()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn('group block w-full h-full overflow-hidden cursor-zoom-in', className)}
        aria-label={openLabel}
      >
        <img
          src={src}
          alt={alt ?? ''}
          className={cn('w-full h-full object-cover transition-transform duration-300 group-hover:scale-105', thumbnailClassName)}
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[80vw] w-auto p-0 overflow-visible bg-transparent border-0 shadow-none"
          showCloseButton={false}
        >
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              className="block cursor-zoom-out touch-pan-y"
              aria-label={closeLabel}
            >
              <img
                src={currentSrc}
                alt={alt ?? ''}
                className="max-w-[80vw] max-h-[85vh] w-auto h-auto object-contain rounded-xl select-none"
                draggable={false}
              />
            </button>

            {(title || meta) && (
              <div className="max-w-[80vw] rounded-2xl bg-black/70 px-4 py-2 text-center backdrop-blur-sm">
                {title && <p className="text-sm font-semibold text-white">{title}</p>}
                {meta && <p className="mt-0.5 text-[11px] font-mono text-white/70">{meta}</p>}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Nav controls portaled to body to escape DialogContent's transform containing block */}
      {open && gallery && typeof document !== 'undefined' && createPortal(
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label={prevLabel}
            className="fixed start-3 sm:start-6 top-1/2 -translate-y-1/2 size-11 rounded-full bg-white/95 text-zinc-900 inline-flex items-center justify-center hover:bg-white shadow-lg transition-colors z-[100]"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label={nextLabel}
            className="fixed end-3 sm:end-6 top-1/2 -translate-y-1/2 size-11 rounded-full bg-white/95 text-zinc-900 inline-flex items-center justify-center hover:bg-white shadow-lg transition-colors z-[100]"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 text-white text-xs font-mono backdrop-blur-sm z-[100]">
            {activeIdx + 1} / {gallery.length}
          </div>
        </>,
        document.body,
      )}
    </>
  )
}
