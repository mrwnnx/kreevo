'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const MAX_CLAPS_REVIEW = 10
const MIN_CONTENT = 10

const ClapMini = ({ filled, className }: { filled: boolean; className?: string }) => (
  <svg viewBox="0 0 51.2 51.2" xmlns="http://www.w3.org/2000/svg" className={className}>
    {filled ? (
      <>
        <path d="m26.56 15.61 3.55 3.56a2.26 2.26 0 0 0 -.11.69v3.84l-7.28-7.28a2.34 2.34 0 0 1 3.83-.81z" fill="#43cfc8" />
        <path d="m17.49 17.79a2.33 2.33 0 1 1 3.3-3.3l1.94 1.93 7.27 7.28v-3.84a2.26 2.26 0 0 1 .11-.69 2.2 2.2 0 0 1 2.06-1.52 2.24 2.24 0 0 1 2.08 1.35c.54 1.92 1.07 3.89 1.46 5.88a27.06 27.06 0 0 1 .55 6.82 7 7 0 0 1 -2 4.54l-3.11 3.11a9.19 9.19 0 0 1 -4.69 2.14 8.6 8.6 0 0 1 -7.46-2.37l-9.2-9.21a2.33 2.33 0 0 1 3.3-3.3l-2.21-2.22a2.32 2.32 0 0 1 0-3.3 2.34 2.34 0 0 1 3.3 0l-2-2a2.34 2.34 0 0 1 0-3.3 2.34 2.34 0 0 1 3.3 0z" fill="#fdde59" />
        <path d="m40 20.16c1.16 4.1 2.28 8.43 2 12.7a7 7 0 0 1 -2 4.54l-3.11 3.11a9 9 0 0 1 -10.46 1 9.19 9.19 0 0 0 4.69-2.14l3.11-3.11a7 7 0 0 0 2-4.54 27.06 27.06 0 0 0 -.55-6.82l.09-3.9a2.2 2.2 0 0 1 2.16-2.2 2.19 2.19 0 0 1 2.07 1.36z" fill="#43cfc8" />
      </>
    ) : (
      <path
        fill="currentColor"
        d="m40.76 19.86a3 3 0 0 0 -5.49-.14l-.27-1a3 3 0 0 0 -5-.84l-2.86-2.88a3.23 3.23 0 0 0 -4.44 0 1.25 1.25 0 0 1 -.09.12l-1.24-1.24a3.21 3.21 0 0 0 -4.44 0 3.3 3.3 0 0 0 -.79 1.38l-.1-.1a3.23 3.23 0 0 0 -4.44 0 3.16 3.16 0 0 0 0 4.44l.11.1a3.12 3.12 0 0 0 -1.37.79 3.11 3.11 0 0 0 0 4.43l.32.32a3.06 3.06 0 0 0 -1.42.76 3.15 3.15 0 0 0 0 4.44l9.21 9.21a9.34 9.34 0 0 0 6.62 2.73 9.67 9.67 0 0 0 1.2-.08 9.33 9.33 0 0 0 4.61 1.22 10.15 10.15 0 0 0 6.58-2.48l3.11-3.04a7.83 7.83 0 0 0 2.27-5.05c.26-4.39-.84-8.83-2.08-13.09zm-16.92-3.68a1.57 1.57 0 0 1 2.16 0l3.24 3.25a3.37 3.37 0 0 0 0 .44v1.9l-5.47-5.47a1 1 0 0 1 .07-.12zm-4.25 22.37-9.21-9.21a1.52 1.52 0 0 1 0-2.16 1.56 1.56 0 0 1 2.16 0s0 0 0 0l5 5a.82.82 0 0 0 1.14 0 .81.81 0 0 0 0-1.14l-7.19-7.19a1.51 1.51 0 0 1 -.49-1.11 1.48 1.48 0 0 1 .46-1.08 1.53 1.53 0 0 1 2.16 0l7.19 7.2a.82.82 0 0 0 1.14 0 .81.81 0 0 0 0-1.14l-9.22-9.22a1.5 1.5 0 0 1 -.45-1.08 1.54 1.54 0 0 1 .45-1.09 1.57 1.57 0 0 1 2.16 0l2 2 7.18 7.19a.81.81 0 0 0 1.14-1.14l-7.19-7.19a1.52 1.52 0 0 1 0-2.16 1.55 1.55 0 0 1 2.17 0l9.21 9.21a.82.82 0 0 0 .88.17.81.81 0 0 0 .49-.74v-3.81a1.35 1.35 0 0 1 .07-.44 1.4 1.4 0 0 1 1.32-1 1.43 1.43 0 0 1 1.29.8c.6 2.15 1.08 4 1.45 5.81a26.38 26.38 0 0 1 .53 6.62 6.12 6.12 0 0 1 -1.81 4l-3.02 3.12a8.33 8.33 0 0 1 -4.29 2 7.73 7.73 0 0 1 -6.72-2.22zm21.65-5.74a6.21 6.21 0 0 1 -1.81 4l-3.06 3.09a8.26 8.26 0 0 1 -7.53 1.77 10.47 10.47 0 0 0 2.85-1.67l3.1-3.11a7.73 7.73 0 0 0 2.28-5.06 27.39 27.39 0 0 0 -.55-6.93l.06-3.9a1.41 1.41 0 0 1 1.42-1.42 1.39 1.39 0 0 1 1.26.8c1.18 4.21 2.23 8.33 1.98 12.43zm-20.54-21.14a.8.8 0 1 0 1.15-1.12l-1.69-1.76a.81.81 0 0 0 -1.16 1.12zm4-.46a.8.8 0 0 0 .8-.8v-2a.8.8 0 1 0 -1.6 0v2a.8.8 0 0 0 .77.8zm3.38.7a.82.82 0 0 0 .56-.23l1.67-1.68a.8.8 0 0 0 -1.12-1.14l-1.7 1.66a.79.79 0 0 0 0 1.13.78.78 0 0 0 .56.26z"
      />
    )}
  </svg>
)

interface ReviewModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (data: { title: string; content: string; claps: number }) => Promise<void>
  remainingClaps: number
}

export function ReviewModal({ open, onOpenChange, onSubmit, remainingClaps }: ReviewModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [claps, setClaps] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const maxSelectable = Math.min(MAX_CLAPS_REVIEW, remainingClaps)
  const activeValue = hovered || claps
  const canSubmit = title.trim().length > 0 && content.trim().length >= MIN_CONTENT && !loading

  async function submit() {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      await onSubmit({ title: title.trim(), content: content.trim(), claps })
      // reset
      setTitle('')
      setContent('')
      setClaps(0)
      onOpenChange(false)
    } catch {
      setError('Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Laisse une review</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="review-title" className="text-sm">Titre</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Donne un titre court à ta review"
              maxLength={80}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="review-content" className="text-sm">Review</Label>
            <textarea
              id="review-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Donne un feedback constructif... (min 10 caractères)"
              className={cn(
                'w-full resize-none rounded-xl border border-border bg-transparent p-3 text-sm',
                'placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors',
              )}
            />
            <p className={cn('text-xs', content.length < MIN_CONTENT ? 'text-muted-foreground' : 'text-emerald-500')}>
              {content.length < MIN_CONTENT ? `${MIN_CONTENT - content.length} caractères min` : `${content.length} / 500`}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">
              Tes claps <span className="text-muted-foreground font-normal">({claps}/{maxSelectable})</span>
            </Label>
            <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
              {Array.from({ length: MAX_CLAPS_REVIEW }, (_, i) => i + 1).map((n) => {
                const disabled = n > maxSelectable
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={disabled}
                    onClick={() => setClaps(claps === n ? n - 1 : n)}
                    onMouseEnter={() => !disabled && setHovered(n)}
                    className={cn(
                      'w-8 h-8 transition-transform duration-100',
                      !disabled && 'cursor-pointer hover:scale-110',
                      disabled && 'opacity-30 cursor-not-allowed',
                      n <= activeValue && !disabled && 'scale-105',
                    )}
                    aria-label={`${n} claps`}
                  >
                    <ClapMini filled={n <= activeValue} className="w-full h-full text-zinc-300 dark:text-zinc-600" />
                  </button>
                )
              })}
            </div>
            {remainingClaps < MAX_CLAPS_REVIEW && (
              <p className="text-[11px] text-muted-foreground">
                {remainingClaps === 0 ? 'Tu as déjà donné tous tes claps.' : `Tu as déjà donné ${MAX_CLAPS_REVIEW - remainingClaps} claps.`}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={loading} />}>Annuler</DialogClose>
          <Button onClick={submit} disabled={!canSubmit}>
            {loading ? 'Publication…' : 'Publier ma review →'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
