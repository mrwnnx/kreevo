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
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

const REPORT_WINDOW_HOURS = 24

type ReportT = Dictionary['submissionDetail']['report']

const FALLBACK_T: ReportT = {
  tooltip: 'Signaler',
  reportedLabel: 'Signalé',
  dialogTitle: 'Signaler cette soumission',
  dialogPrompt: 'Pourquoi signales-tu cette soumission ?',
  reasonNotDesign: 'Ce n\'est pas un travail de design',
  reasonOffBrief: 'Ça ne correspond pas au brief',
  reasonInappropriate: 'Contenu inapproprié',
  cancel: 'Annuler',
  submit: 'Signaler',
  genericError: 'Erreur',
}

export function ReportButton({
  submissionId,
  submissionCreatedAt,
  t = FALLBACK_T,
}: {
  submissionId: string
  submissionCreatedAt: string
  t?: ReportT
}) {
  const REASONS = [
    { id: 'not_design', label: t.reasonNotDesign },
    { id: 'off_brief',  label: t.reasonOffBrief },
    { id: 'inappropriate', label: t.reasonInappropriate },
  ]

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
        setError(data.error ?? t.genericError)
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
        <Check className="size-3" /> {t.reportedLabel}
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-red-500 transition-colors"
        title={t.tooltip}
      >
        <Flag className="size-3" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.dialogTitle}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t.dialogPrompt}
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
            <DialogClose render={<Button variant="outline" disabled={pending} />}>{t.cancel}</DialogClose>
            <Button onClick={submit} disabled={pending} variant="destructive">
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
