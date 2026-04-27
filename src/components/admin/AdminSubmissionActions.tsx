'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function AdminSubmissionActions({
  submissionId,
  status,
  hasReports,
  pendingContestId,
}: {
  submissionId: string
  status: string
  hasReports: boolean
  pendingContestId?: string | null
}) {
  const router = useRouter()
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  async function call(url: string, action: string) {
    setError(null)
    const fb = feedback.trim()
    if (action === 'reject' && !fb) {
      setError('Feedback obligatoire pour rejeter')
      return
    }
    if (action === 'reject_report' && !fb) {
      setError('Feedback obligatoire pour rejeter')
      return
    }

    startTransition(async () => {
      const body: Record<string, unknown> = {}
      if (action === 'approve') body.action = 'approve'
      if (action === 'reject') { body.action = 'reject'; body.feedback = fb }
      if (action === 'validate_report') { body.action = 'validate' }
      if (action === 'reject_report') { body.action = 'reject'; body.feedback = fb }
      if (action === 'approve_contest') { body.action = 'approve'; body.response = fb || 'Validée' }
      if (action === 'reject_contest') { body.action = 'reject'; body.response = fb || 'Rejetée' }

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erreur')
        return
      }
      router.refresh()
    })
  }

  return (
    <section className="rounded-2xl border border-border p-5 space-y-4">
      <h2 className="text-base font-semibold">Actions admin</h2>

      {(status === 'rejected' || status === 'on_hold') && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Cette soumission est actuellement {status === 'on_hold' ? 'en vérification (signalée)' : 'rejetée'}.
        </p>
      )}

      <div>
        <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">
          Feedback / Réponse (obligatoire pour rejet)
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={3}
          placeholder="Explique ta décision…"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {status !== 'approved' && (
          <Button
            onClick={() => call(`/api/admin/submissions/${submissionId}/validate`, 'approve')}
            disabled={pending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            ✅ Approuver
          </Button>
        )}
        {status !== 'rejected' && (
          <Button
            variant="destructive"
            onClick={() => call(`/api/admin/submissions/${submissionId}/validate`, 'reject')}
            disabled={pending}
          >
            ❌ Rejeter
          </Button>
        )}
        {status === 'on_hold' && hasReports && (
          <>
            <Button
              variant="outline"
              onClick={() => call(`/api/admin/submissions/${submissionId}/resolve-report`, 'validate_report')}
              disabled={pending}
            >
              Maintenir (rejeter signalement)
            </Button>
            <Button
              variant="outline"
              onClick={() => call(`/api/admin/submissions/${submissionId}/resolve-report`, 'reject_report')}
              disabled={pending}
            >
              Confirmer signalement (rejeter)
            </Button>
          </>
        )}
        {pendingContestId && (
          <>
            <Button
              variant="outline"
              onClick={() => call(`/api/admin/contests/${pendingContestId}/resolve`, 'approve_contest')}
              disabled={pending}
              className="border-green-400 text-green-700 dark:text-green-400"
            >
              ✅ Approuver contestation
            </Button>
            <Button
              variant="outline"
              onClick={() => call(`/api/admin/contests/${pendingContestId}/resolve`, 'reject_contest')}
              disabled={pending}
              className="border-red-400 text-red-700 dark:text-red-400"
            >
              ❌ Rejeter contestation
            </Button>
          </>
        )}
      </div>
    </section>
  )
}
