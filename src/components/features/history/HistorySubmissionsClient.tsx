'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { setSubmissionVisibility } from './actions'
import { GLASS_SURFACE, GLASS_GRADIENT } from '@/components/layout/GlassShell'

export type HistorySubmission = {
  id: string
  cover_url: string | null
  title: string | null
  validation_status: string | null
  is_draft: boolean
  is_visible: boolean
  created_at: string
  challenge_id: string | null
  challenge_title: string | null
}

type Filter = 'all' | 'approved' | 'drafts' | 'rejected'

interface HistoryT {
  filters: { all: string; approved: string; drafts: string; rejected: string }
  status: { approved: string; pending: string; rejected: string; draft: string; on_hold: string }
  empty: { icon: string; title: string; subtitle: string; cta: string }
  visibility: { public: string; hidden: string; lockedHint: string }
}

interface Props {
  submissions: HistorySubmission[]
  dateLocale: string
  t: HistoryT
}

const FILTERS: Filter[] = ['all', 'approved', 'drafts', 'rejected']

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusInfo(s: HistorySubmission, t: HistoryT['status']) {
  if (s.is_draft) return { label: t.draft, dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' }
  switch (s.validation_status) {
    case 'approved': return { label: t.approved, dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' }
    case 'rejected': return { label: t.rejected, dot: 'bg-red-500', text: 'text-red-700 dark:text-red-400' }
    case 'on_hold': return { label: t.on_hold, dot: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-400' }
    default: return { label: t.pending, dot: 'bg-zinc-400', text: 'text-zinc-600 dark:text-zinc-400' }
  }
}

/**
 * Public-portfolio visibility switch shown on each card.
 * Interactive only for approved submissions; disabled (with a hint) otherwise,
 * since a non-approved submission is never public. Optimistic: flips locally,
 * reverts if the server action fails. Matches the DS toggle used in the submit
 * form (track `bg-primary`/`bg-muted`, white knob), at a smaller size.
 */
function VisibilityControl({
  id,
  approved,
  initialVisible,
  t,
}: {
  id: string
  approved: boolean
  initialVisible: boolean
  t: HistoryT['visibility']
}) {
  // Non-approved rows are never public → force the visual to "hidden".
  const [visible, setVisible] = useState(approved ? initialVisible : false)
  const [pending, setPending] = useState(false)
  const locked = !approved

  async function toggle() {
    if (locked || pending) return
    const next = !visible
    setVisible(next)
    setPending(true)
    const res = await setSubmissionVisibility(id, next)
    setPending(false)
    if (!res.ok) setVisible(!next) // revert on failure
  }

  const label = visible ? t.public : t.hidden

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur-sm px-2 py-1',
        locked && 'opacity-60',
      )}
      title={locked ? t.lockedHint : undefined}
    >
      <span
        className={cn(
          'text-[10px] font-mono uppercase tracking-widest',
          visible ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={visible}
        aria-label={label}
        disabled={locked || pending}
        onClick={toggle}
        className={cn(
          'relative inline-flex h-4 w-7 items-center rounded-full transition-colors shrink-0',
          visible && !locked ? 'bg-primary' : 'bg-muted',
          (locked || pending) && 'cursor-not-allowed',
        )}
      >
        <span
          className={cn(
            'inline-block size-3 rounded-full bg-white shadow transform transition-transform',
            visible ? 'translate-x-3.5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}

export function HistorySubmissionsClient({ submissions, dateLocale, t }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return submissions
    if (filter === 'drafts') return submissions.filter((s) => s.is_draft)
    if (filter === 'approved') return submissions.filter((s) => !s.is_draft && s.validation_status === 'approved')
    if (filter === 'rejected') return submissions.filter((s) => !s.is_draft && s.validation_status === 'rejected')
    return submissions
  }, [submissions, filter])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              filter === f
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
          >
            {t.filters[f]}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-4xl mb-3">{t.empty.icon}</p>
          <p className="text-base font-semibold mb-1">{t.empty.title}</p>
          <p className="text-sm text-muted-foreground mb-5">{t.empty.subtitle}</p>
          <Link
            href="/dashboard/challenges"
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            {t.empty.cta}
          </Link>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const info = statusInfo(s, t.status)
            return (
              <li key={s.id} className="relative">
                <Link
                  href={s.is_draft && s.challenge_id
                    ? `/dashboard/challenges/${s.challenge_id}/submit`
                    : `/dashboard/submissions/${s.id}?from=history`}
                  className={`${GLASS_SURFACE} group block overflow-hidden rounded-[24px] transition-[translate,box-shadow] duration-[1100ms] ease-[cubic-bezier(0,0,0,0.99)] hover:-translate-y-[6px] hover:shadow-[0px_18px_60px_0px_rgba(0,0,0,0.14)] motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
                  style={GLASS_GRADIENT}
                >
                  <div className="relative aspect-video bg-muted">
                    {s.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.cover_url}
                        alt={s.title ?? ''}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                    <span className={cn(
                      'absolute top-2 end-2 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm',
                      info.text,
                    )}>
                      <span className={cn('size-1.5 rounded-full', info.dot)} />
                      {info.label}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold leading-tight truncate">
                      {s.title ?? <span className="text-muted-foreground italic">—</span>}
                    </p>
                    {s.challenge_title && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {s.challenge_title}
                      </p>
                    )}
                    <p className="text-[11px] font-mono text-muted-foreground/70 mt-1">
                      {formatDate(s.created_at, dateLocale)}
                    </p>
                  </div>
                </Link>
                {/* Public-portfolio visibility — sibling of the Link so toggling
                    never triggers card navigation. */}
                <div className="absolute top-2 start-2 z-10">
                  <VisibilityControl
                    id={s.id}
                    approved={!s.is_draft && s.validation_status === 'approved'}
                    initialVisible={s.is_visible}
                    t={t.visibility}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
