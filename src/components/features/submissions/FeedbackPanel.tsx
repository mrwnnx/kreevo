'use client'

import { useState } from 'react'
import { Sparkles, ThumbsUp, AlertCircle, Lightbulb, Languages, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { translateFeedback, type FeedbackLang } from './feedback-actions'

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
  scoreOutOf: string
  generate: string
  scoreExplanation: string
  translate: string
  translating: string
  alreadyInLang: string
}

interface Props {
  submissionId: string
  initialFeedback: Feedback | null
  /** Language the feedback was generated in (null for legacy rows). */
  feedbackLang?: string | null
  /** User's active UI language. */
  currentLang?: FeedbackLang
  t: FeedbackPageT
}

export function FeedbackPanel({ submissionId, initialFeedback, feedbackLang = null, currentLang = 'fr', t }: Props) {
  const [feedback, setFeedback] = useState<Feedback | null>(initialFeedback)
  const [translated, setTranslated] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [translating, setTranslating] = useState(false)
  const [translateError, setTranslateError] = useState<string | null>(null)

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
      setTranslated(null) // fresh feedback is in the current language
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleTranslate() {
    if (!feedback) return
    setTranslating(true)
    setTranslateError(null)
    const res = await translateFeedback(feedback, currentLang)
    setTranslating(false)
    if (!res.ok) { setTranslateError(res.error); return }
    setTranslated(res.content as Feedback)
  }

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

  if (error) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm text-destructive">{t.generationError}</p>
        <Button onClick={generate}>{t.retry}</Button>
      </div>
    )
  }

  // Idle — no feedback yet: explicit generation (no auto-generation on mount).
  if (!feedback) {
    return (
      <div className="py-16 flex flex-col items-center gap-4 text-center">
        <div className="size-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 inline-flex items-center justify-center">
          <Sparkles className="size-6 text-violet-600 dark:text-violet-400" />
        </div>
        <p className="text-sm text-muted-foreground max-w-sm">{t.generatingHint}</p>
        <Button onClick={generate} size="lg" className="gap-1.5">
          <Sparkles className="size-4" />
          {t.generate}
        </Button>
      </div>
    )
  }

  // Content actually shown: the on-the-fly translation if any, else the stored feedback.
  const view = translated ?? feedback
  // The button is always visible. It is disabled (nothing to translate) when the
  // feedback is already in the active language, or once it has been translated.
  // Legacy rows (feedbackLang null) stay enabled — we don't know their language.
  const alreadyInActiveLang = (feedbackLang != null && feedbackLang === currentLang) || translated != null
  const translateDisabled = translating || alreadyInActiveLang

  const score = Math.max(0, Math.min(100, Math.round(view.score)))

  return (
    <div className="space-y-3">
      <div className="flex justify-end items-center gap-3">
        {translateError && <span className="text-xs text-destructive">{translateError}</span>}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTranslate}
          disabled={translateDisabled}
          title={alreadyInActiveLang ? t.alreadyInLang : undefined}
          className="gap-1.5"
        >
          {translating ? <Loader2 className="size-3.5 animate-spin" /> : <Languages className="size-3.5" />}
          {translating ? t.translating : t.translate}
        </Button>
      </div>

      {/* Score + Summary on one row (stacked on mobile, side-by-side on lg).
          flex respects dir → in RTL the score card sits on the right. */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Overall score — own frame (compact, left). Background tinted with the
            tier hue: very light pastel in light mode, dark tinted in dark mode. */}
        <div
          className={cn(
            'lg:w-[320px] lg:shrink-0 rounded-3xl border p-6 sm:p-8 flex flex-col items-center gap-4 text-center',
            TIER_CARD[scoreTier(score)],
          )}
        >
          <ScoreGauge score={score} label={t.scoreOutOf} />
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.scoreExplanation}
          </p>
        </div>

        {/* Summary — own frame (wider, right) */}
        <div className="flex-1 min-w-0 rounded-3xl border border-border bg-muted/40 p-6 space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {t.summaryLabel}
          </p>
          <p className="text-base sm:text-lg leading-relaxed">{view.summary}</p>
        </div>
      </div>

      {/* Other sections — separate blocks below */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 auto-rows-min">
        {/* Row 2 — strengths (wider) + weaknesses (narrower) */}
        <Section
          icon={<ThumbsUp className="size-4 text-emerald-600 dark:text-emerald-400" />}
          label={t.strengthsLabel}
          items={view.strengths}
          accent="emerald"
          className="lg:col-span-7"
        />

        <Section
          icon={<AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />}
          label={t.weaknessesLabel}
          items={view.weaknesses}
          accent="amber"
          className="lg:col-span-5"
        />

        {/* Row 3 — suggestions (full width, the "act on it" call) */}
        <Section
          icon={<Lightbulb className="size-4 text-violet-600 dark:text-violet-400" />}
          label={t.suggestionsLabel}
          items={view.suggestions}
          accent="violet"
          className="lg:col-span-12"
        />
      </div>
    </div>
  )
}

// Single source of truth for the score threshold → colour. Both the gauge arc
// and the score card background derive from this, so they never diverge.
type ScoreTier = 'low' | 'mid' | 'high'
function scoreTier(score: number): ScoreTier {
  return score <= 40 ? 'low' : score <= 70 ? 'mid' : 'high'
}
// Gauge arc + score number colour per tier.
const TIER_ARC: Record<ScoreTier, string> = {
  low: 'text-rose-500 dark:text-rose-400',
  mid: 'text-amber-500 dark:text-amber-400',
  high: 'text-emerald-500 dark:text-emerald-400',
}
// Score card background: very light pastel of the tier hue in light mode, very
// dark tinted version in dark mode (border kept in the same hue for cohesion).
const TIER_CARD: Record<ScoreTier, string> = {
  low: 'border-rose-200/70 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/30',
  mid: 'border-amber-200/70 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30',
  high: 'border-emerald-200/70 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30',
}

// Semicircle score gauge — SVG arc that fills proportionally to the score, in the
// tier colour. Number + "out of 100" sit in the arc. Symmetric → RTL-safe;
// track + number stay legible in light/dark.
function ScoreGauge({ score, label }: { score: number; label: string }) {
  const R = 85
  const CIRC = Math.PI * R // length of the semicircle arc
  const fill = (score / 100) * CIRC
  const arcColor = TIER_ARC[scoreTier(score)]

  return (
    <div className="relative w-40 sm:w-44 shrink-0">
      <svg viewBox="0 0 200 116" className="w-full h-auto" aria-hidden>
        {/* Track */}
        <path
          d="M15 100 A85 85 0 0 1 185 100"
          fill="none"
          stroke="currentColor"
          strokeWidth={14}
          strokeLinecap="round"
          className="text-foreground/10"
        />
        {/* Filled portion */}
        {score > 0 && (
          <path
            d="M15 100 A85 85 0 0 1 185 100"
            fill="none"
            stroke="currentColor"
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={`${fill} ${CIRC}`}
            className={arcColor}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1.5">
        <span className={cn('text-4xl sm:text-5xl font-bold tabular-nums leading-none', arcColor)}>{score}</span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">{label}</span>
      </div>
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
