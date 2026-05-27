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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 auto-rows-min">
        {/* Hero skeleton — score + summary placeholder */}
        <div
          className="lg:col-span-12 rounded-3xl border border-violet-200/70 dark:border-violet-900/40 p-6 sm:p-8 flex items-start gap-6"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.10), rgba(139,92,246,0.02) 60%)' }}
        >
          <div className="shrink-0 flex flex-col items-center gap-3">
            <div className="size-16 rounded-2xl bg-violet-200/40 dark:bg-violet-800/30 inline-flex items-center justify-center">
              <Sparkles className="size-7 text-violet-500 animate-pulse" />
            </div>
            <SkeletonLine widthPct={50} delayMs={0} />
          </div>
          <div className="flex-1 min-w-0 space-y-3 pt-1">
            <SkeletonLine widthPct={28} delayMs={0} />
            <div className="space-y-2 pt-2">
              <SkeletonLine widthPct={96} delayMs={150} />
              <SkeletonLine widthPct={88} delayMs={300} />
              <SkeletonLine widthPct={72} delayMs={450} />
            </div>
            <p className="text-xs text-muted-foreground pt-2">{t.generating}</p>
          </div>
        </div>

        <SkeletonSection accent="emerald" className="lg:col-span-7" delayBase={600} />
        <SkeletonSection accent="amber" className="lg:col-span-5" delayBase={900} />
        <SkeletonSection accent="violet" className="lg:col-span-12" delayBase={1200} lines={4} />
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 auto-rows-min">
      {/* Hero — score + summary (full width) */}
      <div
        className="lg:col-span-12 rounded-3xl border border-violet-200/70 dark:border-violet-900/40 p-6 sm:p-8 flex items-start gap-6"
        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.10), rgba(139,92,246,0.02) 60%)' }}
      >
        <div className="shrink-0 text-center">
          <div className={cn('text-5xl sm:text-6xl font-bold leading-none', scoreColor)}>{feedback.score}</div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mt-2">
            {t.scoreLabel}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            {t.summaryLabel}
          </p>
          <p className="text-base sm:text-lg leading-relaxed">{feedback.summary}</p>
        </div>
      </div>

      {/* Row 2 — strengths (wider) + weaknesses (narrower) */}
      <Section
        icon={<ThumbsUp className="size-4 text-emerald-600 dark:text-emerald-400" />}
        label={t.strengthsLabel}
        items={feedback.strengths}
        accent="emerald"
        className="lg:col-span-7"
      />

      <Section
        icon={<AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />}
        label={t.weaknessesLabel}
        items={feedback.weaknesses}
        accent="amber"
        className="lg:col-span-5"
      />

      {/* Row 3 — suggestions (full width, the "act on it" call) */}
      <Section
        icon={<Lightbulb className="size-4 text-violet-600 dark:text-violet-400" />}
        label={t.suggestionsLabel}
        items={feedback.suggestions}
        accent="violet"
        className="lg:col-span-12"
      />
    </div>
  )
}

function Section({
  icon, label, items, accent, className,
}: {
  icon: React.ReactNode
  label: string
  items: string[]
  accent: 'emerald' | 'amber' | 'violet'
  className?: string
}) {
  if (items.length === 0) return null
  const palette = {
    emerald: {
      dot: 'bg-emerald-500',
      border: 'border-emerald-200/70 dark:border-emerald-900/40',
      bg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
    },
    amber: {
      dot: 'bg-amber-500',
      border: 'border-amber-200/70 dark:border-amber-900/40',
      bg: 'bg-amber-50/60 dark:bg-amber-950/20',
    },
    violet: {
      dot: 'bg-violet-500',
      border: 'border-violet-200/70 dark:border-violet-900/40',
      bg: 'bg-violet-50/60 dark:bg-violet-950/20',
    },
  }[accent]
  return (
    <div className={cn('rounded-3xl border p-6 space-y-3', palette.border, palette.bg, className)}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      </div>
      <ul className="space-y-2.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2.5 text-base leading-relaxed">
            <span className={cn('size-1.5 rounded-full mt-2 shrink-0', palette.dot)} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Skeletons ────────────────────────────────────────────────────────────
// Mimics the bento layout while the AI generates the real feedback. A
// gradient sweep ("feedbackShimmer") passes left-to-right on each bar with
// staggered delays so the panel looks like it's being written line by line.

function SkeletonLine({
  widthPct = 100,
  delayMs = 0,
  className,
}: {
  widthPct?: number
  delayMs?: number
  className?: string
}) {
  return (
    <div
      className={cn('h-3 rounded-full bg-muted relative overflow-hidden', className)}
      style={{ width: `${widthPct}%` }}
    >
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/55 to-transparent dark:via-white/12"
        style={{ animation: `feedbackShimmer 1.8s ease-in-out ${delayMs}ms infinite` }}
      />
    </div>
  )
}

function SkeletonSection({
  accent,
  className,
  delayBase = 0,
  lines = 3,
}: {
  accent: 'emerald' | 'amber' | 'violet'
  className?: string
  delayBase?: number
  lines?: number
}) {
  const palette = {
    emerald: {
      dot: 'bg-emerald-500',
      border: 'border-emerald-200/70 dark:border-emerald-900/40',
      bg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
    },
    amber: {
      dot: 'bg-amber-500',
      border: 'border-amber-200/70 dark:border-amber-900/40',
      bg: 'bg-amber-50/60 dark:bg-amber-950/20',
    },
    violet: {
      dot: 'bg-violet-500',
      border: 'border-violet-200/70 dark:border-violet-900/40',
      bg: 'bg-violet-50/60 dark:bg-violet-950/20',
    },
  }[accent]
  // Vary the widths so each "line" feels like real prose, not identical bars.
  const widths = [95, 78, 88, 70, 84]
  return (
    <div className={cn('rounded-3xl border p-6 space-y-4', palette.border, palette.bg, className)}>
      <SkeletonLine widthPct={28} delayMs={delayBase} />
      <ul className="space-y-3 pt-1">
        {Array.from({ length: lines }).map((_, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className={cn('size-1.5 rounded-full mt-2 shrink-0', palette.dot)} />
            <SkeletonLine widthPct={widths[i % widths.length]} delayMs={delayBase + 200 + i * 180} className="flex-1" />
          </li>
        ))}
      </ul>
    </div>
  )
}
