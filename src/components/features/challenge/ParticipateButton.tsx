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
import { tx } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

export function ParticipateButton({
  challengeId,
  deadlineDays,
  t,
  ctaLabel,
}: {
  challengeId: string
  deadlineDays: number
  t: Dictionary['challengeDetail']['participate']
  /** Optional override for the trigger button label (e.g. "Reparticiper" instead of "Je participe"). */
  ctaLabel?: string
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
        setError(data.error ?? t.genericError)
        setLoading(false)
        return
      }
      setOpen(false)
      router.refresh()
    } catch {
      setError(t.genericError)
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
        {ctaLabel ?? t.cta} <ArrowRight className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p
              className="text-sm"
              dangerouslySetInnerHTML={{ __html: tx(t.dialogBody, { days: deadlineDays }) }}
            />
            <p className="text-sm text-muted-foreground">
              {t.dialogNote}
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={loading} />}>
              {t.cancel}
            </DialogClose>
            <Button onClick={handleParticipate} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {t.confirm}
              <ArrowRight className="size-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
