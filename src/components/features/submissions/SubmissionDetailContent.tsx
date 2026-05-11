'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Heart, MessageSquare, MessageCircle, ExternalLink } from 'lucide-react'
import { ImageLightbox } from '@/components/features/challenge/ImageLightbox'
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
  const [comments, setComments] = useState<ReviewComment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(true)
  const [dailyCount, setDailyCount] = useState(0)
  const [liked, setLiked] = useState(initialUserLiked)
  const [totalLikes, setTotalLikes] = useState(submission.total_claps ?? 0)
  const [likePending, setLikePending] = useState(false)
  // commentsCount is derived from comments.length once fetched (counts top-level + replies). Falls back to DB count during initial load.
  const [panelOpen, setPanelOpen] = useState(false)
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
    setComments((prev) => prev.filter((c) => c.id !== commentId && c.parent_id !== commentId))
  }

  async function handleEdit(commentId: string, newContent: string) {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? t.comments.genericError)
    }
    const json = await res.json()
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, content: json.content, edited_at: json.editedAt } : c)),
    )
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
  // Total = top-level + replies. Use derived once API has fetched, else fall back to (incomplete) DB column.
  const commentsCount = isLoadingComments ? (submission.comments_count ?? 0) : comments.length
  const additionalImages = Array.isArray(files.images) ? (files.images as string[]) : []
  // Full gallery shared across the cover + extra image lightboxes — enables ←/→ navigation
  const galleryImages = [submission.cover_url, ...additionalImages].filter((u): u is string => !!u)

  // Authors list: author + collaborators (max 2 avatars shown, rest counted)
  const allAuthors: AuthorLite[] = author ? [author, ...collaborators] : [...collaborators]
  const visibleAvatars = allAuthors.slice(0, 2)
  const overflowCount = Math.max(0, allAuthors.length - 2)

  return (
    <div>
      {/* ── HEADER (sticky to top, shrinks title on scroll) ── */}
      {(submission.title || allAuthors.length > 0) && (
        <div>
        <div ref={stickySentinelRef} aria-hidden className="h-px" />
        <div
          className={cn(
            'sticky top-14 z-20 -mx-6 px-6 bg-background/95 supports-[backdrop-filter]:backdrop-blur transition-all duration-200',
            isStuck ? 'py-2' : 'py-3',
          )}
        >
        <div className="flex items-end justify-between gap-3 flex-wrap sm:flex-nowrap">
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

          {/* Actions: only meaningful when submission is approved (hidden on mobile — moved to bottom bar) */}
          {isApproved && (
            <div className="hidden sm:flex items-center gap-3 shrink-0">
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
                onClick={() => setPanelOpen(true)}
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
        </div>
      )}

      {/* Body content under sticky header */}
      <div className="space-y-4 mt-4 sm:pb-0 pb-24">
      {/* Cover (full container width) */}
      <div className="rounded-2xl border border-border overflow-hidden bg-card">
        <div className="relative aspect-video bg-muted">
          {submission.cover_url ? (
            <ImageLightbox
              src={submission.cover_url}
              alt={t.coverAlt}
              openLabel={t.lightbox.open}
              closeLabel={t.lightbox.close}
              images={galleryImages}
              index={0}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              {t.noPreview}
            </div>
          )}
        </div>
      </div>

      {/* ── 2-col: description (left) + sidebar (right) ── */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          {/* Description */}
          {(submission.description || figmaUrl) && (
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <p className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-widest">
                {t.descriptionLabel}
              </p>
              {submission.description && (
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {submission.description}
                </p>
              )}
              {figmaUrl && (
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={figmaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium border border-border px-3 py-1.5 rounded-full hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="size-3" /> {t.seeFigma}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
        {sidebar}
      </div>

      {/* Additional photos — full-width stacked, displayed like cover */}
      {additionalImages.map((url, i) => (
        <div key={i} className="rounded-2xl border border-border overflow-hidden bg-card">
          <div className="relative aspect-video bg-muted">
            <ImageLightbox
              src={url}
              alt={tx(t.additionalAlt, { n: i + 1 })}
              openLabel={t.lightbox.open}
              closeLabel={t.lightbox.close}
              images={galleryImages}
              index={(submission.cover_url ? 1 : 0) + i}
            />
          </div>
        </div>
      ))}
      </div>

      {/* Slide-in comments panel */}
      {isApproved && (
        <CommentsPanel
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          submission={{
            id: submission.id,
            title: submission.title ?? null,
            cover_url: submission.cover_url ?? null,
            created_at: submission.created_at ?? null,
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
          onEdit={handleEdit}
          onReply={handleReply}
          t={t}
          dateLocale={dateLocale}
        />
      )}

      {/* Mobile bottom action bar — replaces FloatingNav for this page */}
      {isApproved && (
        <div
          className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-4 pt-3 flex items-center gap-3"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          {/* Like */}
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
            <Heart className={cn('size-5 transition-all', liked && 'fill-red-500')} strokeWidth={1.8} />
            <span>{totalLikes}</span>
          </button>

          {/* Comments count */}
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <MessageCircle className="size-5" strokeWidth={1.8} />
            <span>{commentsCount}</span>
          </span>

          {/* Comment button — fills remaining width */}
          <Button
            onClick={() => setPanelOpen(true)}
            disabled={!canComment}
            size="sm"
            className="ml-auto gap-1.5 h-10 px-4 text-sm flex-1 max-w-[60%] justify-center"
          >
            <MessageSquare className="size-4" />
            {tc.commentCta}
          </Button>
        </div>
      )}
    </div>
  )
}
