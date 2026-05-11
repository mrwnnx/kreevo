'use client'

import { Sparkles, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface FeedbackProT {
  modalTitle: string
  modalIntro: string
  benefit1: string
  benefit2: string
  benefit3: string
  cta: string
  cancel: string
}

interface Props {
  open: boolean
  onOpenChange: (next: boolean) => void
  upgradeHref?: string
  t: FeedbackProT
}

export function ProUpsellModal({ open, onOpenChange, upgradeHref = '/dashboard/settings#plan', t }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="size-10 rounded-full bg-violet-100 dark:bg-violet-900/30 inline-flex items-center justify-center mb-2">
            <Sparkles className="size-5 text-violet-600 dark:text-violet-400" />
          </div>
          <DialogTitle>{t.modalTitle}</DialogTitle>
          <DialogDescription>{t.modalIntro}</DialogDescription>
        </DialogHeader>

        <ul className="space-y-2.5 my-2">
          {[t.benefit1, t.benefit2, t.benefit3].map((text, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <Check className="size-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button onClick={() => { window.location.href = upgradeHref }}>
            {t.cta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
