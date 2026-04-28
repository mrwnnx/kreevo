'use client'

import { useState, useEffect } from 'react'
import { CommentCard, type ReviewComment } from './CommentCard'
import { ReviewModal } from './ReviewModal'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommentSectionProps {
  submissionId: string
  currentUserId: string
  userPlan: string | null | undefined
  submissionOwnerId: string
  initialUserClaps?: number
  initialTotalClaps?: number
  initialCommentsCount?: number
  /** Stretch trigger button to fill its container width */
  fullWidthTrigger?: boolean
}

const FREE_LIMIT = 5
const MAX_USER_CLAPS = 10

export function CommentSection({
  submissionId,
  currentUserId,
  userPlan,
  submissionOwnerId,
  initialUserClaps = 0,
  initialTotalClaps = 0,
  initialCommentsCount = 0,
  fullWidthTrigger = false,
}: CommentSectionProps) {
  const [comments, setComments] = useState<ReviewComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dailyCount, setDailyCount] = useState(0)
  const [userClaps, setUserClaps] = useState(initialUserClaps)
  const [totalClaps, setTotalClaps] = useState(initialTotalClaps)
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/submissions/${submissionId}/comments`)
      .then((r) => r.json())
      .then((data) => {
        setComments(data.comments ?? [])
        setDailyCount(data.dailyCount ?? 0)
      })
      .finally(() => setIsLoading(false))
  }, [submissionId])

  const isOwner = currentUserId === submissionOwnerId
  const isProUser = userPlan === 'pro' || userPlan === 'studio'
  const isFreeLimited = !isProUser && dailyCount >= FREE_LIMIT
  const canReview = !isOwner && !isFreeLimited

  async function handleSubmit(data: { title: string; content: string; claps: number }) {
    const res = await fetch(`/api/submissions/${submissionId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error()
    const json = await res.json()
    setComments((prev) => [json.comment, ...prev])
    setDailyCount((prev) => prev + 1)
    setCommentsCount((prev) => prev + 1)
    if (typeof json.appliedClaps === 'number') setUserClaps((c) => Math.min(MAX_USER_CLAPS, c + json.appliedClaps))
    if (typeof json.totalClaps === 'number') setTotalClaps(json.totalClaps)
  }

  async function handleReport(commentId: string) {
    await fetch(`/api/comments/${commentId}/report`, { method: 'POST' })
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, is_reported: true } : c)))
  }

  return (
    <div className="space-y-6">
      {/* Combined actions bar */}
      <div className="rounded-2xl border border-border bg-card flex items-center gap-4 px-4 py-3">
        <Button
          onClick={() => setModalOpen(true)}
          disabled={!canReview}
          className={cn('gap-2', fullWidthTrigger && 'flex-1')}
          size="sm"
        >
          <MessageSquare className="size-4" />
          Laisser une review
          <span className="text-xs font-mono opacity-80">· {commentsCount}</span>
        </Button>

        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <svg viewBox="0 0 51.2 51.2" className="size-5" aria-hidden="true">
            <path
              fill="currentColor"
              d="m40.76 19.86a3 3 0 0 0 -5.49-.14l-.27-1a3 3 0 0 0 -5-.84l-2.86-2.88a3.23 3.23 0 0 0 -4.44 0 1.25 1.25 0 0 1 -.09.12l-1.24-1.24a3.21 3.21 0 0 0 -4.44 0 3.3 3.3 0 0 0 -.79 1.38l-.1-.1a3.23 3.23 0 0 0 -4.44 0 3.16 3.16 0 0 0 0 4.44l.11.1a3.12 3.12 0 0 0 -1.37.79 3.11 3.11 0 0 0 0 4.43l.32.32a3.06 3.06 0 0 0 -1.42.76 3.15 3.15 0 0 0 0 4.44l9.21 9.21a9.34 9.34 0 0 0 6.62 2.73 9.67 9.67 0 0 0 1.2-.08 9.33 9.33 0 0 0 4.61 1.22 10.15 10.15 0 0 0 6.58-2.48l3.11-3.04a7.83 7.83 0 0 0 2.27-5.05c.26-4.39-.84-8.83-2.08-13.09zm-16.92-3.68a1.57 1.57 0 0 1 2.16 0l3.24 3.25a3.37 3.37 0 0 0 0 .44v1.9l-5.47-5.47a1 1 0 0 1 .07-.12zm-4.25 22.37-9.21-9.21a1.52 1.52 0 0 1 0-2.16 1.56 1.56 0 0 1 2.16 0s0 0 0 0l5 5a.82.82 0 0 0 1.14 0 .81.81 0 0 0 0-1.14l-7.19-7.19a1.51 1.51 0 0 1 -.49-1.11 1.48 1.48 0 0 1 .46-1.08 1.53 1.53 0 0 1 2.16 0l7.19 7.2a.82.82 0 0 0 1.14 0 .81.81 0 0 0 0-1.14l-9.22-9.22a1.5 1.5 0 0 1 -.45-1.08 1.54 1.54 0 0 1 .45-1.09 1.57 1.57 0 0 1 2.16 0l2 2 7.18 7.19a.81.81 0 0 0 1.14-1.14l-7.19-7.19a1.52 1.52 0 0 1 0-2.16 1.55 1.55 0 0 1 2.17 0l9.21 9.21a.82.82 0 0 0 .88.17.81.81 0 0 0 .49-.74v-3.81a1.35 1.35 0 0 1 .07-.44 1.4 1.4 0 0 1 1.32-1 1.43 1.43 0 0 1 1.29.8c.6 2.15 1.08 4 1.45 5.81a26.38 26.38 0 0 1 .53 6.62 6.12 6.12 0 0 1 -1.81 4l-3.02 3.12a8.33 8.33 0 0 1 -4.29 2 7.73 7.73 0 0 1 -6.72-2.22zm21.65-5.74a6.21 6.21 0 0 1 -1.81 4l-3.06 3.09a8.26 8.26 0 0 1 -7.53 1.77 10.47 10.47 0 0 0 2.85-1.67l3.1-3.11a7.73 7.73 0 0 0 2.28-5.06 27.39 27.39 0 0 0 -.55-6.93l.06-3.9a1.41 1.41 0 0 1 1.42-1.42 1.39 1.39 0 0 1 1.26.8c1.18 4.21 2.23 8.33 1.98 12.43zm-20.54-21.14a.8.8 0 1 0 1.15-1.12l-1.69-1.76a.81.81 0 0 0 -1.16 1.12zm4-.46a.8.8 0 0 0 .8-.8v-2a.8.8 0 1 0 -1.6 0v2a.8.8 0 0 0 .77.8zm3.38.7a.82.82 0 0 0 .56-.23l1.67-1.68a.8.8 0 0 0 -1.12-1.14l-1.7 1.66a.79.79 0 0 0 0 1.13.78.78 0 0 0 .56.26z"
            />
          </svg>
          {totalClaps}
        </span>
      </div>

      {isOwner && (
        <p className="text-xs text-muted-foreground text-center">Tu ne peux pas commenter ton propre travail</p>
      )}
      {isFreeLimited && !isOwner && (
        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-3 text-center">
          <p className="text-xs font-medium text-violet-800 dark:text-violet-300">
            {FREE_LIMIT} commentaires/jour — limite atteinte
          </p>
          <p className="text-[11px] text-violet-600 dark:text-violet-400">Passe en Pro pour commenter sans limite</p>
        </div>
      )}

      <ReviewModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleSubmit}
        remainingClaps={Math.max(0, MAX_USER_CLAPS - userClaps)}
      />

      {/* Comments list */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">Commentaires</h3>
          <span className="text-sm text-muted-foreground">{comments.length} avis</span>
        </div>

        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-700 rounded" />
                <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-700 rounded" />
                <div className="h-3 w-2/3 bg-zinc-200 dark:bg-zinc-700 rounded" />
              </div>
            </div>
          ))
        ) : comments.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-2xl mb-2">💬</p>
            <p className="text-sm text-muted-foreground">Sois le premier à laisser un commentaire !</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} currentUserId={currentUserId} onReport={handleReport} />
          ))
        )}
      </div>
    </div>
  )
}
