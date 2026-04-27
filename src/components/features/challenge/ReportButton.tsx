'use client'

import { useState, useEffect, useTransition } from 'react'
import { Flag, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const REPORT_WINDOW_HOURS = 24

const REASONS = [
  { id: 'not_design', label: 'Ce n\'est pas un travail de design' },
  { id: 'off_brief',  label: 'Ça ne correspond pas au brief' },
  { id: 'inappropriate', label: 'Contenu inapproprié' },
]

export function ReportButton({
  submissionId,
  submissionCreatedAt,
}: {
  submissionId: string
  submissionCreatedAt: string
}) {
  const [open, setOpen] = useState(false)
  const [reported, setReported] = useState(false)
  const [reason, setReason] = useState<string>(REASONS[0].id)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Check if already reported
  useEffect(() => {
    fetch(`/api/submissions/${submissionId}/report`)
      .then((r) => r.json())
      .then((d) => setReported(!!d.reported))
      .catch(() => {})
  }, [submissionId])

  // Within 24h window?
  const hoursSince = (Date.now() - new Date(submissionCreatedAt).getTime()) / 1000 / 3600
  if (hoursSince > REPORT_WINDOW_HOURS) return null

  function submit() {
    setError(null)
    const reasonLabel = REASONS.find((r) => r.id === reason)?.label ?? reason
    startTransition(async () => {
      const res = await fetch(`/api/submissions/${submissionId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reasonLabel }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erreur')
        return
      }
      setOpen(false)
      setReported(true)
    })
  }

  if (reported) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 text-xs font-mono text-muted-foreground'
      )}>
        <Check className="size-3" /> Signalé
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-red-500 transition-colors"
        title="Signaler"
      >
        <Flag className="size-3" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler cette soumission</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pourquoi signales-tu cette soumission ?
            </p>
            <div className="space-y-2">
              {REASONS.map((r) => (
                <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="report-reason"
                    value={r.id}
                    checked={reason === r.id}
                    onChange={() => setReason(r.id)}
                  />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={pending} />}>Annuler</DialogClose>
            <Button onClick={submit} disabled={pending} variant="destructive">
              {pending && <Loader2 className="size-4 animate-spin" />}
              Signaler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
