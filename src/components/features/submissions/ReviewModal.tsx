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
import { cn } from '@/lib/utils'

const MIN_CONTENT = 10

interface ReviewModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (data: { content: string }) => Promise<void>
}

export function ReviewModal({ open, onOpenChange, onSubmit }: ReviewModalProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = content.trim().length >= MIN_CONTENT && !loading

  async function submit() {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      await onSubmit({ content: content.trim() })
      setContent('')
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
          <DialogTitle>Laisser un commentaire</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Écris ton commentaire… (min 10 caractères)"
              className={cn(
                'w-full resize-none rounded-xl border border-border bg-transparent p-3 text-sm',
                'placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors',
              )}
              autoFocus
            />
            <p className={cn('text-xs', content.length < MIN_CONTENT ? 'text-muted-foreground' : 'text-emerald-500')}>
              {content.length < MIN_CONTENT ? `${MIN_CONTENT - content.length} caractères min` : `${content.length} / 500`}
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={loading} />}>Annuler</DialogClose>
          <Button onClick={submit} disabled={!canSubmit}>
            {loading ? 'Publication…' : 'Publier →'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
