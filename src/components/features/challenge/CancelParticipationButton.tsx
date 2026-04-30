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

export function CancelParticipationButton({ challengeId }: { challengeId: string }) {
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
        Annuler ma participation
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler ta participation ?</DialogTitle>
            <DialogDescription>
              Le chrono sera arrêté et les <strong>+50 XP</strong> de participation te seront retirés.
              Si tu as un brouillon, il sera supprimé. Tu pourras choisir un autre défi
              ou revenir sur celui-ci plus tard.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={pending} />}>Garder ma participation</DialogClose>
            <Button variant="destructive" onClick={cancel} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Oui, annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
