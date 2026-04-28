'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export function ImageLightbox({
  src,
  alt,
  className,
  thumbnailClassName,
}: {
  src: string
  alt?: string
  className?: string
  thumbnailClassName?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn('group block w-full h-full overflow-hidden cursor-zoom-in', className)}
        aria-label="Agrandir l'image"
      >
        <img
          src={src}
          alt={alt ?? ''}
          className={cn('w-full h-full object-cover transition-transform duration-300 group-hover:scale-105', thumbnailClassName)}
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[95vw] w-auto p-0 overflow-hidden bg-transparent border-0 shadow-none"
          showCloseButton={false}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="block max-h-[90vh] cursor-zoom-out"
            aria-label="Fermer"
          >
            <img
              src={src}
              alt={alt ?? ''}
              className="max-w-[95vw] max-h-[90vh] w-auto h-auto object-contain rounded-xl"
            />
          </button>
        </DialogContent>
      </Dialog>
    </>
  )
}
