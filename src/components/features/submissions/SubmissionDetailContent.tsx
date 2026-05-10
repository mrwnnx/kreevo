'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Heart, MessageSquare, MessageCircle, ExternalLink } from 'lucide-react'
import { ImageLightbox } from '@/components/features/challenge/ImageLightbox'
import { ReviewModal } from './ReviewModal'
import { CommentCard, type ReviewComment } from './CommentCard'
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

interface AuthorLite {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
}

interface Props {
  submission: SubmissionLite
  author: AuthorLite | null
  collaborators: AuthorLite[]
  currentUserId: string
  currentProfilePlan: string | null | undefined
  initialUserLiked: boolean
  isOwn: boolean
  t: DetailT
  dateLocale: string
  /** Right column (e.g. ProfilePanel) — rendered alongside the secondary content below the cover. */
  sidebar?: React.ReactNode
}

export function SubmissionDetailContent({
  submission,
  author,
  collaborators,
  currentUserId,
  currentProfilePlan,
  initialUserLiked,
  isOwn,
  t,
  dateLocale,
  sidebar,
}: Props) {
  void dateLocale // date no longer rendered in header — kept for future use
  const [comments, setComments] = useState<ReviewComment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(true)
  const [dailyCount, setDailyCount] = useState(0)
  const [liked, setLiked] = useState(initialUserLiked)
  const [totalLikes, setTotalLikes] = useState(submission.total_claps ?? 0)
  const [likePending, setLikePending] = useState(false)
  const [commentsCount, setCommentsCount] = useState(submission.comments_count ?? 0)
  const [modalOpen, setModalOpen] = useState(false)
  const [isStuck, setIsStuck] = useState(false)
  const stickySentinelRef = useRef<HTMLDivElement>(null)

  // Detect when the sticky header pins to the FloatingNav (top: 56px)
  useEffect(() => {
    const el = stickySentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { rootMargin: '-56px 0px 0px 0px', threshold: 0 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

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

  // Authors list: author + collaborators (max 2 avatars shown, rest counted)
  const allAuthors: AuthorLite[] = author ? [author, ...collaborators] : [...collaborators]
  const visibleAvatars = allAuthors.slice(0, 2)
  const overflowCount = Math.max(0, allAuthors.length - 2)

  return (
    <div>
      {/* ── HEADER (sticky to top, shrinks title on scroll) ── */}
      {(submission.title || allAuthors.length > 0) && (
        <>
        <div ref={stickySentinelRef} aria-hidden className="h-px" />
        <div
          className={cn(
            'sticky top-14 z-20 -mx-6 px-6 bg-background/95 supports-[backdrop-filter]:backdrop-blur border-b border-border transition-all duration-200',
            isStuck ? 'py-2' : 'py-3',
          )}
        >
        <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex-1 min-w-0">
            {submission.title && (
              <h1
                className={cn(
                  'font-bold tracking-tight leading-tight transition-all duration-200',
                  isStuck ? 'text-base sm:text-lg truncate' : 'text-3xl sm:text-4xl',
                )}
              >
                {submission.title}
              </h1>
            )}

            {/* Authors row: avatar(s) + name(s) — hidden when sticky to keep bar compact */}
            {allAuthors.length > 0 && !isStuck && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex -space-x-2">
                  {visibleAvatars.map((u) => (
                    <Link
                      key={u.id}
                      href={`/u/${u.username}`}
                      className="block size-7 rounded-full bg-muted ring-2 ring-background overflow-hidden hover:opacity-80 transition-opacity"
                      aria-label={`@${u.username}`}
                    >
                      {u.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                          {u.username[0]?.toUpperCase()}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
                <span className="text-sm">
                  {author && (
                    <Link
                      href={`/u/${author.username}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {author.full_name || author.username}
                    </Link>
                  )}
                  {collaborators.length === 1 && (
                    <>
                      <span className="text-muted-foreground"> {t.coAuthorsAnd} </span>
                      <Link
                        href={`/u/${collaborators[0].username}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {collaborators[0].full_name || collaborators[0].username}
                      </Link>
                    </>
                  )}
                  {overflowCount > 0 && (
                    <span className="text-muted-foreground"> {tx(t.coAuthorsOthers, { n: overflowCount })}</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Actions: only meaningful when submission is approved */}
          {isApproved && (
            <div className="flex items-center gap-3 shrink-0">
              {/* Like (icon + count) */}
              <button
                onClick={handleLike}
                disabled={isOwn || likePending}
                aria-label={liked ? tc.unlikeAria : tc.likeAria}
                className={cn(
                  'inline-flex items-center gap-1 text-sm font-semibold transition-colors',
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

              {/* Comments count (icon + count) */}
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <MessageCircle className="size-4" strokeWidth={1.8} />
                <span>{commentsCount}</span>
              </span>

              {/* Comment button (text label) */}
              <Button
                onClick={() => setModalOpen(true)}
                disabled={!canComment}
                size="sm"
                className="gap-1.5 h-8 px-3 text-xs"
              >
                <MessageSquare className="size-3.5" />
                {tc.commentCta}
              </Button>
            </div>
          )}
        </div>
        </div>
        </>
      )}

      {/* Body content under sticky header */}
      <div className="space-y-4 mt-4">
      {/* Cover (full container width) */}
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

      {/* ── 2-col layout under the cover ── */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0 space-y-4">
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

      {/* Owner notice + free limit warning */}
      {isApproved && isOwn && (
        <p className="text-xs text-muted-foreground text-center">{tc.cantCommentOwn}</p>
      )}
      {isApproved && isFreeLimited && !isOwn && (
        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-3 text-center">
          <p className="text-xs font-medium text-violet-800 dark:text-violet-300">
            {tx(tc.freeLimitTitle, { n: FREE_LIMIT })}
          </p>
          <p className="text-[11px] text-violet-600 dark:text-violet-400">{tc.freeLimitBody}</p>
        </div>
      )}

      <ReviewModal open={modalOpen} onOpenChange={setModalOpen} onSubmit={handleSubmitComment} t={t.review} />

      {/* Comments list (no inline action bar — actions are in the header above) */}
      {isApproved && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base">{tc.sectionTitle}</h3>
            <span className="text-sm text-muted-foreground">
              {tx(comments.length === 1 ? tc.countSingular : tc.countPlural, { n: comments.length })}
            </span>
          </div>

          {isLoadingComments ? (
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
                  <p className="text-sm text-muted-foreground">{tc.emptyState}</p>
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
                t={tc}
              />
            ))
          })()}
        </div>
      )}
        </div>
        {sidebar}
      </div>
      </div>
    </div>
  )
}
