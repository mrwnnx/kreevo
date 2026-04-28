'use client'

import { useState, useEffect } from 'react'
import { CommentForm } from './CommentForm'
import { CommentCard, type ReviewComment } from './CommentCard'
import { FireIcon } from './FireIcon'

interface CommentSectionProps {
  submissionId: string
  currentUserId: string
  userPlan: string | null | undefined
  userAvatar?: string | null
  username?: string
  submissionOwnerId: string
  isVisible: boolean
}

const FREE_LIMIT = 5

export function CommentSection({
  submissionId,
  currentUserId,
  userPlan,
  userAvatar,
  username,
  submissionOwnerId,
  isVisible,
}: CommentSectionProps) {
  const [comments, setComments] = useState<ReviewComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dailyCount, setDailyCount] = useState(0)

  useEffect(() => {
    if (!isVisible) return
    fetch(`/api/submissions/${submissionId}/comments`)
      .then((r) => r.json())
      .then((data) => {
        setComments(data.comments ?? [])
        setDailyCount(data.dailyCount ?? 0)
      })
      .finally(() => setIsLoading(false))
  }, [submissionId, isVisible])

  const ratingsWithValue = comments.filter((c) => c.rating && c.rating > 0)
  const totalRatings = ratingsWithValue.length
  const averageRating =
    totalRatings > 0 ? ratingsWithValue.reduce((s, c) => s + (c.rating ?? 0), 0) / totalRatings : 0
  const getRatingCount = (n: number) => ratingsWithValue.filter((c) => c.rating === n).length
  const getRatingPercent = (n: number) => (totalRatings > 0 ? (getRatingCount(n) / totalRatings) * 100 : 0)

  const isOwner = currentUserId === submissionOwnerId
  const isProUser = userPlan === 'pro' || userPlan === 'studio'
  const isFreeLimited = !isProUser && dailyCount >= FREE_LIMIT
  const canComment = isVisible && !isOwner && !isFreeLimited

  async function handleSubmit(data: { content: string; rating: number }) {
    const res = await fetch(`/api/submissions/${submissionId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error()
    const { comment } = await res.json()
    setComments((prev) => [comment, ...prev])
    setDailyCount((prev) => prev + 1)
  }

  async function handleLike(commentId: string) {
    await fetch(`/api/comments/${commentId}/like`, { method: 'POST' })
  }

  async function handleReport(commentId: string) {
    if (!confirm('Signaler ce commentaire ?')) return
    await fetch(`/api/comments/${commentId}/report`, { method: 'POST' })
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, is_reported: true } : c)))
  }

  if (!isVisible) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">Reviews & Commentaires</h3>
        <span className="text-sm text-muted-foreground">{comments.length} avis</span>
      </div>

      {totalRatings > 0 && (
        <div className="flex items-center gap-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-5 border border-border">
          <div className="text-center flex-shrink-0">
            <p
              className="text-4xl font-bold"
              style={{
                background: 'linear-gradient(to top, #ff4c0d, #fc9502)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {averageRating.toFixed(1)}
            </p>
            <div className="flex justify-center mt-1">
              {[1, 2, 3, 4, 5].map((f) => (
                <div key={f} className="w-4 h-4">
                  <FireIcon filled={f <= Math.round(averageRating)} className="w-full h-full" />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalRatings} note{totalRatings > 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((n) => (
              <div key={n} className="flex items-center gap-2">
                <div className="w-4 h-4 flex-shrink-0">
                  <FireIcon filled={true} className="w-full h-full" />
                </div>
                <span className="text-xs text-muted-foreground w-3">{n}</span>
                <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${getRatingPercent(n)}%`,
                      background: 'linear-gradient(to right, #ff4c0d, #fc9502)',
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-4 text-right">{getRatingCount(n)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {canComment && (
        <CommentForm submissionId={submissionId} onSubmit={handleSubmit} userAvatar={userAvatar} username={username} />
      )}

      {isOwner && (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 text-center border border-border">
          <p className="text-sm text-muted-foreground">Tu ne peux pas commenter ta propre soumission</p>
        </div>
      )}

      {isFreeLimited && !isOwner && (
        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-4 text-center">
          <p className="text-sm font-medium text-violet-800 dark:text-violet-300">
            Limite atteinte — {FREE_LIMIT} commentaires/jour
          </p>
          <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">Passe en Pro pour commenter sans limite</p>
        </div>
      )}

      <div className="space-y-5">
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
          <div className="text-center py-8">
            <div className="flex justify-center gap-1 mb-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 opacity-30">
                  <FireIcon filled={false} className="w-full h-full" />
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Sois le premier à laisser une review !</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onLike={handleLike}
              onReport={handleReport}
            />
          ))
        )}
      </div>
    </div>
  )
}
