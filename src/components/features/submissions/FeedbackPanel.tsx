'use client'

import { useEffect, useState } from 'react'
import { Sparkles, ThumbsUp, AlertCircle, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Feedback {
  summary: string
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  score: number
}

interface FeedbackPageT {
  generating: string
  generatingHint: string
  generationError: string
  retry: string
  summaryLabel: string
  strengthsLabel: string
  weaknessesLabel: string
  suggestionsLabel: string
  scoreLabel: string
}

interface Props {
  submissionId: string
  initialFeedback: Feedback | null
  t: FeedbackPageT
}

export function FeedbackPanel({ submissionId, initialFeedback, t }: Props) {
  const [feedback, setFeedback] = useState<Feedback | null>(initialFeedback)
  const [loading, setLoading] = useState(!initialFeedback)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/submissions/${submissionId}/feedback`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? 'Failed')
      }
      const data = await res.json()
      setFeedback(data.feedback as Feedback)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialFeedback) generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="size-12 mx-auto rounded-full bg-violet-100 dark:bg-violet-900/30 inline-flex items-center justify-center animate-pulse">
          <Sparkles className="size-6 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <p className="text-base font-semibold">{t.generating}</p>
          <p className="text-sm text-muted-foreground mt-1">{t.generatingHint}</p>
        </div>
      </div>
    )
  }

  if (error || !feedback) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm text-destructive">{t.generationError}</p>
        <Button onClick={generate}>{t.retry}</Button>
      </div>
    )
  }

  const scoreColor =
    feedback.score >= 80 ? 'text-emerald-600 dark:text-emerald-400'
    : feedback.score >= 60 ? 'text-violet-600 dark:text-violet-400'
    : feedback.score >= 40 ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400'

  return (
    <div className="space-y-6">
      {/* Score + summary */}
      <div className="rounded-2xl border border-border bg-card p-5 flex items-start gap-5">
        <div className="shrink-0 text-center">
          <div className={cn('text-5xl font-bold leading-none', scoreColor)}>{feedback.score}</div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mt-1">
            {t.scoreLabel}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            {t.summaryLabel}
          </p>
          <p className="text-sm leading-relaxed">{feedback.summary}</p>
        </div>
      </div>

      <Section
        icon={<ThumbsUp className="size-4 text-emerald-600 dark:text-emerald-400" />}
        label={t.strengthsLabel}
        items={feedback.strengths}
        accent="emerald"
      />

      <Section
        icon={<AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />}
        label={t.weaknessesLabel}
        items={feedback.weaknesses}
        accent="amber"
      />

      <Section
        icon={<Lightbulb className="size-4 text-violet-600 dark:text-violet-400" />}
        label={t.suggestionsLabel}
        items={feedback.suggestions}
        accent="violet"
      />
    </div>
  )
}

function Section({
  icon, label, items, accent,
}: {
  icon: React.ReactNode
  label: string
  items: string[]
  accent: 'emerald' | 'amber' | 'violet'
}) {
  if (items.length === 0) return null
  const dot = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    violet: 'bg-violet-500',
  }[accent]
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      </div>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
            <span className={cn('size-1.5 rounded-full mt-2 shrink-0', dot)} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
