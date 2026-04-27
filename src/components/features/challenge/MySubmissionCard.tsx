'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

interface Submission {
  id: string
  cover_url: string | null
  title: string | null
  is_draft: boolean
  validation_status: string | null
  rejection_reason: string | null
  validated_at: string | null
}

const CONTEST_WINDOW_HOURS = 24

export function MySubmissionCard({
  submission,
  challengeId,
  canResubmit,
  participationStatus,
}: {
  submission: Submission
  challengeId: string
  canResubmit: boolean
  participationStatus: string
}) {
  const status = submission.validation_status ?? 'pending'
  const isDraft = !!submission.is_draft

  // Contest window check
  const validatedAt = submission.validated_at ? new Date(submission.validated_at) : null
  const hoursSinceRejection = validatedAt
    ? (Date.now() - validatedAt.getTime()) / 1000 / 3600
    : null
  const canContest = status === 'rejected' && hoursSinceRejection !== null && hoursSinceRejection < CONTEST_WINDOW_HOURS

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {submission.cover_url && (
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img src={submission.cover_url} alt={submission.title ?? 'Ma soumission'} className="w-full h-full object-cover" />
          <StatusBadge isDraft={isDraft} status={status} />
        </div>
      )}

      <div className="p-3 space-y-2">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Ma soumission</p>
        {submission.title && <p className="text-sm font-semibold leading-snug line-clamp-2">{submission.title}</p>}

        {!isDraft && <StatusInline status={status} rejectionReason={submission.rejection_reason} />}

        {canContest && (
          <ContestButton submissionId={submission.id} hoursLeft={CONTEST_WINDOW_HOURS - (hoursSinceRejection ?? 0)} />
        )}

        {(canResubmit || isDraft) && participationStatus !== 'expired' && status !== 'approved' && (
          <Link
            href={`/dashboard/challenges/${challengeId}/submit`}
            className="inline-flex w-full items-center justify-center gap-1 rounded-full border border-border text-xs font-medium h-8 px-3 hover:bg-muted transition-colors"
          >
            {isDraft ? 'Continuer' : 'Modifier'}
          </Link>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ isDraft, status }: { isDraft: boolean; status: string }) {
  let label = 'Publié'
  let cls = 'bg-green-600/90 text-white'

  if (isDraft) { label = 'Brouillon'; cls = 'bg-amber-500/90 text-white' }
  else if (status === 'pending') { label = 'En validation'; cls = 'bg-zinc-700/90 text-white' }
  else if (status === 'approved') { label = 'Validée'; cls = 'bg-green-600/90 text-white' }
  else if (status === 'rejected') { label = 'Rejetée'; cls = 'bg-red-600/90 text-white' }
  else if (status === 'on_hold') { label = 'En vérification'; cls = 'bg-amber-600/90 text-white' }

  return (
    <span className={cn('absolute top-2 left-2 text-[11px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm', cls)}>
      {label}
    </span>
  )
}

function StatusInline({ status, rejectionReason }: { status: string; rejectionReason: string | null }) {
  if (status === 'approved') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400">
        <CheckCircle2 className="size-3.5" />
        <span>Soumission validée</span>
      </div>
    )
  }
  if (status === 'pending') {
    return (
      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <Clock className="size-3.5 mt-px shrink-0" />
        <span>⏳ En cours de validation. Un admin va examiner ton travail sous 48h.</span>
      </div>
    )
  }
  if (status === 'rejected') {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-red-700 dark:text-red-400">
          <AlertCircle className="size-3.5" />
          <span className="font-semibold">Soumission rejetée</span>
        </div>
        {rejectionReason && (
          <p className="text-[11px] text-muted-foreground leading-relaxed">{rejectionReason}</p>
        )}
      </div>
    )
  }
  if (status === 'on_hold') {
    return (
      <div className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
        <AlertCircle className="size-3.5 mt-px shrink-0" />
        <span>Ta soumission a été signalée par la communauté. Un admin va la vérifier.</span>
      </div>
    )
  }
  return null
}

function ContestButton({ submissionId, hoursLeft }: { submissionId: string; hoursLeft: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit() {
    if (!message.trim()) {
      setError('Message requis')
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/submissions/${submissionId}/contest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      })
      const data = await res.json()
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
        className="text-xs font-medium text-primary hover:underline"
      >
        Contester cette décision · {Math.max(0, Math.floor(hoursLeft))}h restantes
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contester le rejet</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Explique pourquoi tu penses que ton travail mérite d&apos;être validé.
              Un admin examinera ta contestation.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={1000}
              placeholder="Mon argument…"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={pending} />}>Annuler</DialogClose>
            <Button onClick={submit} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Envoyer la contestation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
