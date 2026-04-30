'use client'

import { useState } from 'react'
import { Flag, MessageCircle, Trash2, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProBadge } from '@/components/ui/ProBadge'

export interface ReviewComment {
  id: string
  content: string
  parent_id?: string | null
  likes_count?: number | null
  liked_by_me?: boolean
  created_at: string
  is_reported: boolean
  user: {
    id: string
    username: string
    avatar_url: string | null
    plan: string | null
    league: string | null
  }
}

interface CommentCardProps {
  comment: ReviewComment
  currentUserId: string
  replies?: ReviewComment[]
  onReport: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onReply: (parentId: string, content: string) => Promise<void>
  onLike: (id: string) => Promise<void> | void
  onReportReply?: (id: string) => Promise<void>
  onDeleteReply?: (id: string) => Promise<void>
  isReply?: boolean
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `il y a ${d}j`
  return new Date(date).toLocaleDateString('fr', { month: 'short', day: 'numeric' })
}

export function CommentCard({
  comment,
  currentUserId,
  replies = [],
  onReport,
  onDelete,
  onReply,
  onLike,
  onReportReply,
  onDeleteReply,
  isReply = false,
}: CommentCardProps) {
  const [reported, setReported] = useState(comment.is_reported)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyPending, setReplyPending] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const isOwn = comment.user.id === currentUserId
  const liked = !!comment.liked_by_me
  const likesCount = comment.likes_count ?? 0

  async function handleReport() {
    if (!confirm('Signaler ce commentaire ?')) return
    await onReport(comment.id)
    setReported(true)
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce commentaire ?')) return
    setDeletePending(true)
    try {
      await onDelete(comment.id)
    } catch {
      setDeletePending(false)
    }
  }

  async function submitReply() {
    if (replyText.trim().length < 3 || replyPending) return
    setReplyPending(true)
    try {
      await onReply(comment.id, replyText.trim())
      setReplyText('')
      setReplyOpen(false)
    } finally {
      setReplyPending(false)
    }
  }

  return (
    <div className={cn('flex gap-3 group', isReply && 'pl-2')}>
      <div className={cn('rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0 mt-0.5', isReply ? 'w-7 h-7' : 'w-8 h-8')}>
        {comment.user.avatar_url ? (
          <img src={comment.user.avatar_url} alt={comment.user.username} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-medium text-zinc-500">
            {comment.user.username[0]?.toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm inline-flex items-center gap-1">
            @{comment.user.username}
            <ProBadge plan={comment.user.plan} size={12} />
          </span>
          {comment.user.league && <span className="text-xs text-muted-foreground">{comment.user.league}</span>}
          <span className="text-xs text-muted-foreground ml-auto">{timeAgo(comment.created_at)}</span>
        </div>

        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{comment.content}</p>

        <div className="flex items-center gap-3 pt-0.5">
          {!isOwn && (
            <button
              onClick={() => onLike(comment.id)}
              aria-label={liked ? 'Retirer le like' : 'Liker'}
              className={cn(
                'flex items-center gap-1 text-xs transition-colors',
                liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500',
              )}
            >
              <Heart className={cn('w-3.5 h-3.5 transition-all', liked && 'fill-red-500')} strokeWidth={1.5} />
              <span>{likesCount}</span>
            </button>
          )}
          {isOwn && likesCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{likesCount}</span>
            </span>
          )}
          {!isReply && (
            <button
              onClick={() => setReplyOpen((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              <span>Répondre</span>
            </button>
          )}
          {!isOwn && !reported && (
            <button
              onClick={handleReport}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Flag className="w-3 h-3" />
              <span>Signaler</span>
            </button>
          )}
          {reported && <span className="text-xs text-muted-foreground">✓ Signalé</span>}
          {isOwn && (
            <button
              onClick={handleDelete}
              disabled={deletePending}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors ml-auto"
            >
              <Trash2 className="w-3 h-3" />
              <span>Supprimer</span>
            </button>
          )}
        </div>

        {replyOpen && (
          <div className="pt-2 space-y-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="Écris ta réponse…"
              className="w-full resize-none rounded-lg border border-border bg-transparent p-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setReplyOpen(false); setReplyText('') }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submitReply}
                disabled={replyText.trim().length < 3 || replyPending}
                className="text-xs font-semibold text-primary disabled:opacity-50"
              >
                {replyPending ? 'Envoi…' : 'Répondre →'}
              </button>
            </div>
          </div>
        )}

        {/* Replies */}
        {!isReply && replies.length > 0 && (
          <div className="pt-3 space-y-3 border-l border-border pl-4 ml-1">
            {replies.map((r) => (
              <CommentCard
                key={r.id}
                comment={r}
                currentUserId={currentUserId}
                onReport={onReportReply ?? onReport}
                onDelete={onDeleteReply ?? onDelete}
                onReply={onReply}
                onLike={onLike}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
