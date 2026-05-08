'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

export function CancelParticipationButton({
  challengeId,
  t,
}: {
  challengeId: string
  t: Dictionary['challengeDetail']['cancel']
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function cancel() {
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/participations?challenge_id=${challengeId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Erreur')
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
      >
        <X className="size-3.5" />
        {t.cta}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.dialogTitle}</DialogTitle>
            <DialogDescription
              dangerouslySetInnerHTML={{ __html: t.dialogBody }}
            />
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={pending} />}>{t.keep}</DialogClose>
            <Button variant="destructive" onClick={cancel} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
