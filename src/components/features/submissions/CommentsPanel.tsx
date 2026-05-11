'use client'

import { useEffect, useRef, useState } from 'react'
import { Calendar, X } from 'lucide-react'
import { CommentCard, type ReviewComment } from './CommentCard'
import { MentionTextarea } from './MentionTextarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { tx } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

const FREE_LIMIT = 5
const MIN_CONTENT = 10

type DetailT = Dictionary['submissionDetail']

interface CommentsPanelProps {
  open: boolean
  onClose: () => void
  /** Submission preview info shown in the panel header. */
  submission: {
    id: string
    title?: string | null
    cover_url?: string | null
    created_at?: string | null
  }
  comments: ReviewComment[]
  isLoadingComments: boolean
  commentsCount: number
  currentUserId: string
  isOwn: boolean
  isFreeLimited: boolean
  canComment: boolean
  onSubmitComment: (data: { content: string }) => Promise<void>
  onCommentLike: (id: string) => Promise<void>
  onReport: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onEdit?: (id: string, content: string) => Promise<void>
  onReply: (parentId: string, content: string) => Promise<void>
  t: DetailT
  dateLocale: string
}

export function CommentsPanel({
  open,
  onClose,
  submission,
  comments,
  isLoadingComments,
  commentsCount,
  currentUserId,
  isOwn,
  isFreeLimited,
  canComment,
  onSubmitComment,
  onCommentLike,
  onReport,
  onDelete,
  onEdit,
  onReply,
  t,
  dateLocale,
}: CommentsPanelProps) {
  const tc = t.comments
  const tr = t.review
  const [content, setContent] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Body scroll lock + ESC to close while panel is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // Autofocus textarea after slide-in animation
    const tid = setTimeout(() => inputRef.current?.focus(), 280)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      clearTimeout(tid)
    }
  }, [open, onClose])

  const canSubmit = content.trim().length >= MIN_CONTENT && !submitting && canComment

  async function submit() {
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await onSubmitComment({ content: content.trim() })
      setContent('')
    } catch {
      setSubmitError(tr.genericError)
    } finally {
      setSubmitting(false)
    }
  }

  // Build replies-by-parent map for display
  const topLevel = comments.filter((c) => !c.parent_id)
  const repliesByParent = comments.reduce<Record<string, ReviewComment[]>>((acc, c) => {
    if (c.parent_id) {
      acc[c.parent_id] = acc[c.parent_id] ?? []
      acc[c.parent_id].push(c)
    }
    return acc
  }, {})
  Object.values(repliesByParent).forEach((arr) =>
    arr.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
  )

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 transition-all',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/40 supports-[backdrop-filter]:backdrop-blur-[2px] transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={tc.panelTitle}
        className={cn(
          'absolute right-0 top-0 bottom-0 w-full sm:w-[400px] bg-background border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-background/95 supports-[backdrop-filter]:backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {submission.title ?? tc.panelTitle}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {tx(commentsCount === 1 ? tc.countSingular : tc.countPlural, { n: commentsCount })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tc.closePanelAria}
            className="size-8 inline-flex items-center justify-center rounded-lg hover:bg-muted transition-colors shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Compact post preview */}
        {(submission.cover_url || submission.created_at) && (
          <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-muted/30">
            {submission.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={submission.cover_url}
                alt=""
                className="size-12 rounded-lg object-cover border border-border shrink-0"
              />
            ) : (
              <div className="size-12 rounded-lg bg-muted border border-border shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {tc.previewLabel}
              </p>
              {submission.title && (
                <p className="text-xs font-medium truncate">{submission.title}</p>
              )}
              {submission.created_at && (
                <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                  <Calendar className="size-3" />
                  {new Date(submission.created_at).toLocaleDateString(dateLocale, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Free limit warning (owner can comment freely on their own submission) */}
        {isFreeLimited && (
          <div className="m-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-3 text-center">
            <p className="text-xs font-medium text-violet-800 dark:text-violet-300">
              {tx(tc.freeLimitTitle, { n: FREE_LIMIT })}
            </p>
            <p className="text-[11px] text-violet-600 dark:text-violet-400">{tc.freeLimitBody}</p>
          </div>
        )}

        {/* Scrollable comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {isLoadingComments ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-700 rounded" />
                  <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-700 rounded" />
                  <div className="h-3 w-2/3 bg-zinc-200 dark:bg-zinc-700 rounded" />
                </div>
              </div>
            ))
          ) : topLevel.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2xl mb-2">💬</p>
              <p className="text-sm text-muted-foreground">{tc.emptyState}</p>
            </div>
          ) : (
            topLevel.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                replies={repliesByParent[comment.id] ?? []}
                onReport={onReport}
                onDelete={onDelete}
                onEdit={onEdit}
                onReply={onReply}
                onLike={onCommentLike}
                t={tc}
              />
            ))
          )}
        </div>

        {/* Sticky bottom input */}
        {canComment && (
          <div className="sticky bottom-0 bg-background border-t border-border p-3 space-y-2">
            <MentionTextarea
              textareaRef={inputRef}
              value={content}
              onChange={setContent}
              rows={2}
              maxLength={500}
              placeholder={tr.placeholder}
              className={cn(
                'w-full resize-none rounded-xl border border-border bg-background p-3 text-sm',
                'placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors',
              )}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault()
                  submit()
                }
              }}
            />
            <div className="flex items-center justify-between gap-2">
              <p
                className={cn(
                  'text-[11px]',
                  content.length < MIN_CONTENT ? 'text-muted-foreground' : 'text-emerald-500',
                )}
              >
                {content.length < MIN_CONTENT
                  ? tx(tr.minHint, { n: MIN_CONTENT - content.length })
                  : tx(tr.counter, { n: content.length })}
              </p>
              <Button onClick={submit} disabled={!canSubmit} size="sm" className="h-8 px-4">
                {submitting ? tr.publishing : tr.publish}
              </Button>
            </div>
            {submitError && <p className="text-xs text-destructive">{submitError}</p>}
          </div>
        )}
      </aside>
    </div>
  )
}
