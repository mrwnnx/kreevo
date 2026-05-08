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
import { tx } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

const MIN_CONTENT = 10

type ReviewT = Dictionary['submissionDetail']['review']

const FALLBACK_T: ReviewT = {
  title: 'Laisser un commentaire',
  placeholder: 'Écris ton commentaire… (min 10 caractères)',
  minHint: '{n} caractères min',
  counter: '{n} / 500',
  cancel: 'Annuler',
  publish: 'Publier →',
  publishing: 'Publication…',
  genericError: 'Une erreur est survenue.',
}

interface ReviewModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (data: { content: string }) => Promise<void>
  t?: ReviewT
}

export function ReviewModal({ open, onOpenChange, onSubmit, t = FALLBACK_T }: ReviewModalProps) {
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
      setError(t.genericError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder={t.placeholder}
              className={cn(
                'w-full resize-none rounded-xl border border-border bg-transparent p-3 text-sm',
                'placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors',
              )}
              autoFocus
            />
            <p className={cn('text-xs', content.length < MIN_CONTENT ? 'text-muted-foreground' : 'text-emerald-500')}>
              {content.length < MIN_CONTENT
                ? tx(t.minHint, { n: MIN_CONTENT - content.length })
                : tx(t.counter, { n: content.length })}
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={loading} />}>{t.cancel}</DialogClose>
          <Button onClick={submit} disabled={!canSubmit}>
            {loading ? t.publishing : t.publish}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
