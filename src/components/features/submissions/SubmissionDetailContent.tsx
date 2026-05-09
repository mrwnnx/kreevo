'use client'

import { useEffect, useState } from 'react'
import { Calendar, Heart, MessageSquare, MessageCircle, ExternalLink } from 'lucide-react'
import { ImageLightbox } from '@/components/features/challenge/ImageLightbox'
import { ShareButton } from '@/components/features/challenge/ShareButton'
import { ReportButton } from '@/components/features/challenge/ReportButton'
import { CommentsPanel } from './CommentsPanel'
import { type ReviewComment } from './CommentCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { tx } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

const FREE_LIMIT = 5

type DetailT = Dictionary['submissionDetail']

interface SubmissionLite {
  id: string
  title?: string | null
  description?: string | null
  cover_url?: string | null
  files?: Record<string, unknown> | null
  total_claps?: number | null
  comments_count?: number | null
  validation_status?: string | null
  created_at?: string | null
  user_id: string
}

interface Props {
  submission: SubmissionLite
  currentUserId: string
  currentProfilePlan: string | null | undefined
  initialUserLiked: boolean
  isOwn: boolean
  t: DetailT
  dateLocale: string
}

export function SubmissionDetailContent({
  submission,
  currentUserId,
  currentProfilePlan,
  initialUserLiked,
  isOwn,
  t,
  dateLocale,
}: Props) {
  const [comments, setComments] = useState<ReviewComment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(true)
  const [dailyCount, setDailyCount] = useState(0)
  const [liked, setLiked] = useState(initialUserLiked)
  const [totalLikes, setTotalLikes] = useState(submission.total_claps ?? 0)
  const [likePending, setLikePending] = useState(false)
  const [commentsCount, setCommentsCount] = useState(submission.comments_count ?? 0)
  const [panelOpen, setPanelOpen] = useState(false)

  const isApproved = submission.validation_status === 'approved'

  useEffect(() => {
    if (!isApproved) return
    fetch(`/api/submissions/${submission.id}/comments`)
      .then((r) => r.json())
      .then((data) => {
        setComments(data.comments ?? [])
        setDailyCount(data.dailyCount ?? 0)
      })
      .finally(() => setIsLoadingComments(false))
  }, [submission.id, isApproved])

  const isProUser = currentProfilePlan === 'pro' || currentProfilePlan === 'studio'
  const isFreeLimited = !isProUser && dailyCount >= FREE_LIMIT
  const canComment = !isOwn && !isFreeLimited

  async function handleLike() {
    if (isOwn || likePending) return
    setLikePending(true)
    const prevLiked = liked
    const prevTotal = totalLikes
    setLiked(!prevLiked)
    setTotalLikes(prevLiked ? Math.max(0, prevTotal - 1) : prevTotal + 1)
    try {
      const res = await fetch(`/api/submissions/${submission.id}/clap`, { method: 'POST' })
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

  async function handleSubmitComment(data: { content: string }) {
    const res = await fetch(`/api/submissions/${submission.id}/comments`, {
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
      throw new Error(data.error ?? t.comments.genericError)
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
      throw new Error(data.error ?? t.comments.genericError)
    }
    const json = await res.json()
    setComments((prev) => [...prev, json.comment])
  }

  const tc = t.comments
  const files = (submission.files ?? {}) as Record<string, unknown>
  const figmaUrl = typeof files.figma === 'string' ? files.figma : null
  const projectLink = typeof files.link === 'string' ? files.link : null
  const additionalImages = Array.isArray(files.images) ? (files.images as string[]) : []

  return (
    <div className="flex-1 min-w-0 space-y-4">
      {/* ── HEADER : title + date left, actions right ── */}
      {(submission.title || submission.created_at) && (
        <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex-1 min-w-0">
            {submission.title && (
              <h1 className="text-2xl font-bold leading-tight tracking-tight">
                {submission.title}
              </h1>
            )}
            {submission.created_at && (
              <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                <Calendar className="size-3" />
                {new Date(submission.created_at).toLocaleDateString(dateLocale, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>

          {/* Actions: only meaningful when submission is approved */}
          {isApproved && (
            <div className="flex items-center gap-3 shrink-0">
              {/* Like */}
              <button
                onClick={handleLike}
                disabled={isOwn || likePending}
                aria-label={liked ? tc.unlikeAria : tc.likeAria}
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-semibold transition-colors',
                  isOwn ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer',
                  liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500',
                )}
              >
                <Heart
                  className={cn('size-4 transition-all', liked && 'fill-red-500')}
                  strokeWidth={1.8}
                />
                <span>{totalLikes}</span>
              </button>

              {/* Comment (text label) — opens slide-in panel */}
              <Button
                onClick={() => setPanelOpen(true)}
                disabled={isOwn}
                size="sm"
                className="gap-1.5 h-8 px-3 text-xs"
              >
                <MessageSquare className="size-3.5" />
                {tc.commentCta}
              </Button>

              {/* Comments count (icon only) */}
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MessageCircle className="size-4" strokeWidth={1.8} />
                <span>{commentsCount}</span>
              </span>

              {/* Share (icon only) */}
              <ShareButton label={t.share.label} />

              {/* Report (icon only) */}
              {!isOwn && submission.created_at && (
                <ReportButton
                  submissionId={submission.id}
                  submissionCreatedAt={submission.created_at}
                  t={t.report}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Cover */}
      <div className="rounded-2xl border border-border overflow-hidden bg-card">
        <div className="relative aspect-video bg-muted">
          {submission.cover_url ? (
            <ImageLightbox
              src={submission.cover_url}
              alt={t.coverAlt}
              openLabel={t.lightbox.open}
              closeLabel={t.lightbox.close}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              {t.noPreview}
            </div>
          )}
        </div>
      </div>

      {/* Additional images */}
      {additionalImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {additionalImages.map((url, i) => (
            <div key={i} className="rounded-xl border border-border overflow-hidden bg-muted aspect-square">
              <ImageLightbox
                src={url}
                alt={tx(t.additionalAlt, { n: i + 1 })}
                openLabel={t.lightbox.open}
                closeLabel={t.lightbox.close}
              />
            </div>
          ))}
        </div>
      )}

      {/* Description */}
      {(submission.description || figmaUrl || projectLink) && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-widest">
            {t.descriptionLabel}
          </p>
          {submission.description && (
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {submission.description}
            </p>
          )}
          {(figmaUrl || projectLink) && (
            <div className="flex flex-wrap items-center gap-2">
              {figmaUrl && (
                <a
                  href={figmaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium border border-border px-3 py-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <ExternalLink className="size-3" /> {t.seeFigma}
                </a>
              )}
              {projectLink && (
                <a
                  href={projectLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium border border-border px-3 py-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <ExternalLink className="size-3" /> {t.seeProject}
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Slide-in comments panel — opens via the header Comment button. */}
      {isApproved && (
        <CommentsPanel
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          submission={{
            id: submission.id,
            title: submission.title,
            cover_url: submission.cover_url,
            created_at: submission.created_at,
          }}
          comments={comments}
          isLoadingComments={isLoadingComments}
          commentsCount={commentsCount}
          currentUserId={currentUserId}
          isOwn={isOwn}
          isFreeLimited={isFreeLimited}
          canComment={canComment}
          onSubmitComment={handleSubmitComment}
          onCommentLike={handleCommentLike}
          onReport={handleReport}
          onDelete={handleDelete}
          onReply={handleReply}
          t={t}
          dateLocale={dateLocale}
        />
      )}
    </div>
  )
}
