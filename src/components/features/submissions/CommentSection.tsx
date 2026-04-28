'use client'

import { useState, useEffect } from 'react'
import { CommentCard, type ReviewComment } from './CommentCard'
import { ReviewModal } from './ReviewModal'
import { Button } from '@/components/ui/button'
import { MessageSquare, MessageCircle, Star } from 'lucide-react'
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

  async function handleDelete(commentId: string) {
    const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Erreur')
    }
    // Find the comment to know if it had claps + was top-level
    const removed = comments.find((c) => c.id === commentId)
    if (removed && !removed.parent_id) {
      const refunded = removed.claps_given ?? 0
      setUserClaps((c) => Math.max(0, c - refunded))
      setTotalClaps((t) => Math.max(0, t - refunded))
      setCommentsCount((n) => Math.max(0, n - 1))
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId && c.parent_id !== commentId))
  }

  async function handleReply(parentId: string, content: string) {
    const res = await fetch(`/api/comments/${parentId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Erreur')
    }
    const json = await res.json()
    setComments((prev) => [...prev, json.comment])
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
        </Button>

        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <MessageCircle className="size-5" strokeWidth={1.5} />
          {commentsCount}
        </span>

        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <Star className="size-5 fill-amber-400 text-amber-400" strokeWidth={1.5} />
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
        ) : (() => {
          const topLevel = comments.filter((c) => !c.parent_id)
          const repliesByParent = comments.reduce<Record<string, ReviewComment[]>>((acc, c) => {
            if (c.parent_id) {
              acc[c.parent_id] = acc[c.parent_id] ?? []
              acc[c.parent_id].push(c)
            }
            return acc
          }, {})
          // Sort replies oldest first within each parent
          Object.values(repliesByParent).forEach((arr) =>
            arr.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
          )
          if (topLevel.length === 0) {
            return (
              <div className="text-center py-10">
                <p className="text-2xl mb-2">💬</p>
                <p className="text-sm text-muted-foreground">Sois le premier à laisser un commentaire !</p>
              </div>
            )
          }
          return topLevel.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              replies={repliesByParent[comment.id] ?? []}
              onReport={handleReport}
              onDelete={handleDelete}
              onReply={handleReply}
            />
          ))
        })()}
      </div>
    </div>
  )
}
