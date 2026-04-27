'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Loader2, ArrowRight } from 'lucide-react'

export function ParticipateButton({
  challengeId,
  deadlineDays,
}: {
  challengeId: string
  deadlineDays: number
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleParticipate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/participations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erreur')
        setLoading(false)
        return
      }
      setOpen(false)
      router.refresh()
    } catch {
      setError('Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        size="lg"
        onClick={() => setOpen(true)}
        className="w-full text-base h-12 gap-2"
      >
        Je participe <ArrowRight className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tu es prêt ?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm">
              En confirmant, ton chrono de{' '}
              <strong>{deadlineDays} jours</strong> démarre immédiatement.
              Tu découvriras le brief complet et tu devras soumettre ton
              travail avant la deadline.
            </p>
            <p className="text-sm text-muted-foreground">
              Tu ne pourras pas choisir un autre défi tant que tu n&apos;as pas
              soumis.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={loading} />}>
              Annuler
            </DialogClose>
            <Button onClick={handleParticipate} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Oui, je participe
              <ArrowRight className="size-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
