'use client'

import { useState, useEffect } from 'react'
import { CommentCard, type ReviewComment } from './CommentCard'
import { ReviewModal } from './ReviewModal'
import { Button } from '@/components/ui/button'
import { MessageSquare, MessageCircle, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tx } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type CommentsT = Dictionary['submissionDetail']['comments']
type ReviewT = Dictionary['submissionDetail']['review']

const FALLBACK_COMMENTS_T: CommentsT = {
  sectionTitle: 'Commentaires',
  countSingular: '{n} commentaire',
  countPlural: '{n} commentaires',
  commentCta: 'Laisser un commentaire',
  cantCommentOwn: 'Tu ne peux pas commenter ton propre travail',
  freeLimitTitle: '{n} commentaires/jour — limite atteinte',
  freeLimitBody: 'Passe en Pro pour commenter sans limite',
  emptyState: 'Sois le premier à laisser un commentaire !',
  likeAria: 'Liker',
  unlikeAria: 'Retirer le like',
  reply: 'Répondre',
  replyPlaceholder: 'Écris ta réponse…',
  replyCancel: 'Annuler',
  replySend: 'Répondre →',
  replySending: 'Envoi…',
  report: 'Signaler',
  reported: '✓ Signalé',
  delete: 'Supprimer',
  confirmReport: 'Signaler ce commentaire ?',
  confirmDelete: 'Supprimer ce commentaire ?',
  genericError: 'Erreur',
  panelTitle: 'Discussion',
  closePanelAria: 'Fermer le panneau',
  previewLabel: 'Soumission',
  timeAgo: {
    justNow: 'à l\'instant',
    minutes: 'il y a {n}m',
    hours: 'il y a {n}h',
    days: 'il y a {n}j',
  },
}

interface CommentSectionProps {
  submissionId: string
  currentUserId: string
  userPlan: string | null | undefined
  submissionOwnerId: string
  initialUserLiked?: boolean
  initialTotalLikes?: number
  initialCommentsCount?: number
  /** Stretch trigger button to fill its container width */
  fullWidthTrigger?: boolean
  t?: CommentsT
  tReview?: ReviewT
}

const FREE_LIMIT = 5

export function CommentSection({
  submissionId,
  currentUserId,
  userPlan,
  submissionOwnerId,
  initialUserLiked = false,
  initialTotalLikes = 0,
  initialCommentsCount = 0,
  fullWidthTrigger = false,
  t = FALLBACK_COMMENTS_T,
  tReview,
}: CommentSectionProps) {
  const [comments, setComments] = useState<ReviewComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dailyCount, setDailyCount] = useState(0)
  const [liked, setLiked] = useState(initialUserLiked)
  const [totalLikes, setTotalLikes] = useState(initialTotalLikes)
  const [likePending, setLikePending] = useState(false)
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
  const canComment = !isOwner && !isFreeLimited

  async function handleSubmit(data: { content: string }) {
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
  }

  async function handleLike() {
    if (isOwner || likePending) return
    setLikePending(true)
    const prevLiked = liked
    const prevTotal = totalLikes
    setLiked(!prevLiked)
    setTotalLikes(prevLiked ? Math.max(0, prevTotal - 1) : prevTotal + 1)
    try {
      const res = await fetch(`/api/submissions/${submissionId}/clap`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const json = await res.json()
      setLiked(!!json.liked)
      setTotalLikes(json.totalLikes ?? 0)
    } catch {
      setLiked(prevLiked)
      setTotalLikes(prevTotal)
    } finally {
      setLikePending(false)
    }
  }

  async function handleCommentLike(commentId: string) {
    const target = comments.find((c) => c.id === commentId)
    if (!target) return
    const prevLiked = !!target.liked_by_me
    const prevCount = target.likes_count ?? 0
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, liked_by_me: !prevLiked, likes_count: prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1 }
          : c,
      ),
    )
    try {
      const res = await fetch(`/api/comments/${commentId}/like`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const json = await res.json()
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, liked_by_me: !!json.liked, likes_count: json.likesCount ?? 0 } : c,
        ),
      )
    } catch {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, liked_by_me: prevLiked, likes_count: prevCount } : c,
        ),
      )
    }
  }

  async function handleReport(commentId: string) {
    await fetch(`/api/comments/${commentId}/report`, { method: 'POST' })
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, is_reported: true } : c)))
  }

  async function handleDelete(commentId: string) {
    const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? t.genericError)
    }
    const removed = comments.find((c) => c.id === commentId)
    if (removed && !removed.parent_id) {
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
      throw new Error(data.error ?? t.genericError)
    }
    const json = await res.json()
    setComments((prev) => [...prev, json.comment])
  }

  return (
    <div className="space-y-6">
      {/* Combined actions bar */}
      <div className="rounded-2xl border border-border bg-card flex items-center gap-4 px-4 py-3">
        <button
          onClick={handleLike}
          disabled={isOwner || likePending}
          aria-label={liked ? t.unlikeAria : t.likeAria}
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-semibold transition-colors',
            isOwner ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer',
            liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500',
          )}
        >
          <Heart className={cn('size-5 transition-all', liked && 'fill-red-500')} strokeWidth={1.5} />
          {totalLikes}
        </button>

        <Button
          onClick={() => setModalOpen(true)}
          disabled={!canComment}
          className={cn('gap-2', fullWidthTrigger && 'flex-1')}
          size="sm"
        >
          <MessageSquare className="size-4" />
          {t.commentCta}
        </Button>

        <span className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <MessageCircle className="size-5" strokeWidth={1.5} />
          {commentsCount}
        </span>
      </div>

      {isOwner && (
        <p className="text-xs text-muted-foreground text-center">{t.cantCommentOwn}</p>
      )}
      {isFreeLimited && !isOwner && (
        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-3 text-center">
          <p className="text-xs font-medium text-violet-800 dark:text-violet-300">
            {tx(t.freeLimitTitle, { n: FREE_LIMIT })}
          </p>
          <p className="text-[11px] text-violet-600 dark:text-violet-400">{t.freeLimitBody}</p>
        </div>
      )}

      <ReviewModal open={modalOpen} onOpenChange={setModalOpen} onSubmit={handleSubmit} t={tReview} />

      {/* Comments list */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">{t.sectionTitle}</h3>
          <span className="text-sm text-muted-foreground">
            {tx(comments.length === 1 ? t.countSingular : t.countPlural, { n: comments.length })}
          </span>
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
          Object.values(repliesByParent).forEach((arr) =>
            arr.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
          )
          if (topLevel.length === 0) {
            return (
              <div className="text-center py-10">
                <p className="text-2xl mb-2">💬</p>
                <p className="text-sm text-muted-foreground">{t.emptyState}</p>
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
              onLike={handleCommentLike}
              t={t}
            />
          ))
        })()}
      </div>
    </div>
  )
}
