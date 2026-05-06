'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, AlertCircle, Clock, Loader2, Sparkles, Lock } from 'lucide-react'
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
  ai_feedback?: AIFeedback | null
}

interface AIFeedback {
  score: number
  summary: string
  strengths: string[]
  improvements: string[]
}

const CONTEST_WINDOW_HOURS = 24

export function MySubmissionCard({
  submission,
  challengeId,
  canResubmit,
  participationStatus,
  userPlan,
}: {
  submission: Submission
  challengeId: string
  canResubmit: boolean
  participationStatus: string
  userPlan?: string
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

        {status === 'approved' && (
          <FeedbackPanel
            submissionId={submission.id}
            initialFeedback={submission.ai_feedback ?? null}
            userPlan={userPlan}
          />
        )}
      </div>
    </div>
  )
}

function FeedbackPanel({
  submissionId,
  initialFeedback,
  userPlan,
}: {
  submissionId: string
  initialFeedback: AIFeedback | null
  userPlan?: string
}) {
  const [feedback, setFeedback] = useState<AIFeedback | null>(initialFeedback)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isPro = userPlan === 'pro' || userPlan === 'studio'

  function fetchFeedback() {
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/submissions/${submissionId}/ai-feedback`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erreur')
        return
      }
      setFeedback(data.feedback)
    })
  }

  if (!isPro && !feedback) {
    return (
      <div className="rounded-lg border border-dashed border-violet-300 dark:border-violet-900/40 bg-violet-50/50 dark:bg-violet-900/10 p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-400">
          <Lock className="size-3.5" /> Feedback IA détaillé
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Score, points forts et axes d&apos;amélioration. Réservé aux comptes Pro.
        </p>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center justify-center gap-1 rounded-full bg-violet-600 text-white text-xs font-semibold h-8 px-3 w-full hover:opacity-90"
        >
          Passer Pro
        </Link>
      </div>
    )
  }

  if (!feedback) {
    return (
      <Button
        type="button"
        onClick={fetchFeedback}
        disabled={pending}
        variant="outline"
        className="w-full h-8 gap-1.5 text-xs"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
        {pending ? 'Analyse en cours…' : 'Demander un feedback IA'}
        {error && <span className="text-destructive">{error}</span>}
      </Button>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card/50 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Sparkles className="size-3.5 text-violet-500" /> Feedback IA
        </div>
        <span className="text-xs font-mono font-bold tabular-nums">
          {feedback.score}<span className="text-muted-foreground font-normal">/10</span>
        </span>
      </div>
      {feedback.summary && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">{feedback.summary}</p>
      )}
      {feedback.strengths.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">Points forts</p>
          <ul className="text-[11px] text-foreground/80 leading-relaxed space-y-0.5">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="flex gap-1.5"><span className="text-green-500 shrink-0">+</span><span>{s}</span></li>
            ))}
          </ul>
        </div>
      )}
      {feedback.improvements.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">À améliorer</p>
          <ul className="text-[11px] text-foreground/80 leading-relaxed space-y-0.5">
            {feedback.improvements.map((s, i) => (
              <li key={i} className="flex gap-1.5"><span className="text-amber-500 shrink-0">→</span><span>{s}</span></li>
            ))}
          </ul>
        </div>
      )}
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
