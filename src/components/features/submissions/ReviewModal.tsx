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
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_CLAPS_REVIEW = 10
const MIN_CONTENT = 10

const StarMini = ({ filled, className }: { filled: boolean; className?: string }) => (
  <Star
    className={cn(className, filled ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-600')}
    strokeWidth={1.5}
  />
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
              Ta note <span className="text-muted-foreground font-normal">({claps}/{maxSelectable})</span>
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
                    aria-label={`${n} étoiles`}
                  >
                    <StarMini filled={n <= activeValue} className="w-full h-full" />
                  </button>
                )
              })}
            </div>
            {remainingClaps < MAX_CLAPS_REVIEW && (
              <p className="text-[11px] text-muted-foreground">
                {remainingClaps === 0 ? 'Tu as déjà donné toutes tes étoiles.' : `Tu as déjà donné ${MAX_CLAPS_REVIEW - remainingClaps} étoiles.`}
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
