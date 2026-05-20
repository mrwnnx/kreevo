'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { Flag, MessageCircle, Trash2, Heart, MoreHorizontal, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProBadge } from '@/components/ui/ProBadge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MentionTextarea } from './MentionTextarea'
import { MentionText } from './MentionText'
import { tx } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type CommentsT = Dictionary['submissionDetail']['comments']

const FALLBACK_T: CommentsT = {
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
  menuAria: 'Plus d\'actions',
  edit: 'Modifier',
  editPlaceholder: 'Modifie ton commentaire…',
  editCancel: 'Annuler',
  editSave: 'Enregistrer',
  editSaving: 'Enregistrement…',
  editedLabel: '(modifié)',
  timeAgo: {
    justNow: 'à l\'instant',
    minutes: 'il y a {n}m',
    hours: 'il y a {n}h',
    days: 'il y a {n}j',
  },
}

export interface ReviewComment {
  id: string
  content: string
  parent_id?: string | null
  likes_count?: number | null
  liked_by_me?: boolean
  created_at: string
  edited_at?: string | null
  is_reported: boolean
  user: {
    id: string
    username: string
    full_name: string | null
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
  onEdit?: (id: string, content: string) => Promise<void>
  onReply: (parentId: string, content: string) => Promise<void>
  onLike: (id: string) => Promise<void> | void
  onReportReply?: (id: string) => Promise<void>
  onDeleteReply?: (id: string) => Promise<void>
  isReply?: boolean
  t?: CommentsT
}

function timeAgo(date: string, t: CommentsT['timeAgo']): string {
  const diff = Date.now() - new Date(date).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return t.justNow
  if (min < 60) return tx(t.minutes, { n: min })
  const h = Math.floor(min / 60)
  if (h < 24) return tx(t.hours, { n: h })
  const d = Math.floor(h / 24)
  if (d < 30) return tx(t.days, { n: d })
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function CommentCard({
  comment,
  currentUserId,
  replies = [],
  onReport,
  onDelete,
  onEdit,
  onReply,
  onLike,
  onReportReply,
  onDeleteReply,
  isReply = false,
  t = FALLBACK_T,
}: CommentCardProps) {
  const [reported, setReported] = useState(comment.is_reported)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyPending, setReplyPending] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [editPending, setEditPending] = useState(false)
  const [content, setContent] = useState(comment.content)
  const [editedAt, setEditedAt] = useState<string | null>(comment.edited_at ?? null)
  const isOwn = comment.user.id === currentUserId
  const liked = !!comment.liked_by_me
  const likesCount = comment.likes_count ?? 0

  // Measure: distance from parent's outer-top to last reply's avatar center, used to position a continuous threading line
  const containerRef = useRef<HTMLDivElement>(null)
  const lastReplyRef = useRef<HTMLDivElement>(null)
  const [linePos, setLinePos] = useState<{ top: number; height: number } | null>(null)
  useLayoutEffect(() => {
    if (isReply || !replies.length || !containerRef.current || !lastReplyRef.current) {
      setLinePos(null)
      return
    }
    const containerRect = containerRef.current.getBoundingClientRect()
    const lastRect = lastReplyRef.current.getBoundingClientRect()
    // Top: just below parent avatar (32px = h-8). Stop where the elbow curve starts:
    // last reply avatar center (14px) MINUS the curve radius (12px = rounded-bl-xl) so we don't overshoot.
    const top = 32
    const ELBOW_RADIUS = 12
    const height = lastRect.top - containerRect.top + 14 - ELBOW_RADIUS - top
    setLinePos({ top, height: Math.max(0, height) })
  }, [isReply, replies.length, replies.map((r) => r.content).join('|')])

  async function handleReport() {
    if (!confirm(t.confirmReport)) return
    await onReport(comment.id)
    setReported(true)
  }

  async function handleDelete() {
    if (!confirm(t.confirmDelete)) return
    setDeletePending(true)
    try {
      await onDelete(comment.id)
    } catch {
      setDeletePending(false)
    }
  }

  async function submitEdit() {
    const next = editText.trim()
    if (next.length < 10 || editPending || !onEdit) return
    setEditPending(true)
    try {
      await onEdit(comment.id, next)
      setContent(next)
      setEditedAt(new Date().toISOString())
      setEditOpen(false)
    } finally {
      setEditPending(false)
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
    <div ref={containerRef} className={cn('relative group', isReply && 'pl-2')}>
      {/* Continuous threading line — from below parent avatar to last reply's avatar center */}
      {linePos && (
        <span
          aria-hidden
          className="absolute w-px bg-border pointer-events-none"
          style={{ left: '16px', top: `${linePos.top}px`, height: `${linePos.height}px` }}
        />
      )}
      {/* Header: avatar + name (left, vertically centered) | 3-dot menu (right) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn('rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0', isReply ? 'w-7 h-7' : 'w-8 h-8')}>
            {comment.user.avatar_url ? (
              <img src={comment.user.avatar_url} alt={comment.user.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-medium text-zinc-500">
                {comment.user.username[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <span className="font-medium text-sm inline-flex items-center gap-1 truncate">
            {comment.user.full_name || comment.user.username}
            <ProBadge plan={comment.user.plan} size={12} />
          </span>
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5 shrink-0">
            <span aria-hidden>·</span>
            {timeAgo(comment.created_at, t.timeAgo)}
            {editedAt && <span className="text-[11px] italic">{t.editedLabel}</span>}
          </span>
        </div>

        {!editOpen && (isOwn || !reported) && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t.menuAria}
              className="size-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              {isOwn && onEdit && (
                <DropdownMenuItem onClick={() => { setEditText(content); setEditOpen(true) }}>
                  <Pencil className="size-3.5" />
                  {t.edit}
                </DropdownMenuItem>
              )}
              {isOwn && (
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={deletePending}
                  className="text-destructive data-[highlighted]:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  {t.delete}
                </DropdownMenuItem>
              )}
              {!isOwn && !reported && (
                <DropdownMenuItem
                  onClick={handleReport}
                  className="text-destructive data-[highlighted]:text-destructive"
                >
                  <Flag className="size-3.5" />
                  {t.report}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {reported && !isOwn && <span className="text-xs text-muted-foreground shrink-0">{t.reported}</span>}
      </div>

      {/* Indented content/footer/reply, aligned with username (avatar width + gap) */}
      <div className={cn('mt-0.5', isReply ? 'pl-9' : 'pl-10')}>
      {/* Content (or edit textarea) */}
      <div>
        {editOpen ? (
          <div className="space-y-2">
            <MentionTextarea
              value={editText}
              onChange={setEditText}
              rows={3}
              maxLength={500}
              placeholder={t.editPlaceholder}
              className="w-full resize-none rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 p-2 text-base md:text-sm placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setEditOpen(false); setEditText(content) }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {t.editCancel}
              </button>
              <button
                type="button"
                onClick={submitEdit}
                disabled={editText.trim().length < 10 || editPending}
                className="text-xs font-semibold text-primary disabled:opacity-50"
              >
                {editPending ? t.editSaving : t.editSave}
              </button>
            </div>
          </div>
        ) : (
          <MentionText content={content} className="block text-sm leading-relaxed text-foreground whitespace-pre-line" />
        )}
      </div>

      {/* Footer: like + reply (aligned left under content) */}
      {!editOpen && (
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={() => onLike(comment.id)}
            aria-label={liked ? t.unlikeAria : t.likeAria}
            className={cn(
              'flex items-center gap-1 text-xs transition-colors',
              liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500',
            )}
          >
            <Heart className={cn('w-3.5 h-3.5 transition-all', liked && 'fill-red-500')} strokeWidth={1.5} />
            <span>{likesCount}</span>
          </button>
          {!isReply && (
            <button
              onClick={() => setReplyOpen((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              <span>{t.reply}</span>
            </button>
          )}
        </div>
      )}

      {/* Reply composer */}
      {replyOpen && !editOpen && (
        <div className="pt-2 space-y-2">
          <MentionTextarea
            value={replyText}
            onChange={setReplyText}
            rows={2}
            maxLength={300}
            placeholder={t.replyPlaceholder}
            className="w-full resize-none rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 p-2 text-base md:text-sm placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => { setReplyOpen(false); setReplyText('') }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t.replyCancel}
            </button>
            <button
              type="button"
              onClick={submitReply}
              disabled={replyText.trim().length < 3 || replyPending}
              className="text-xs font-semibold text-primary disabled:opacity-50"
            >
              {replyPending ? t.replySending : t.replySend}
            </button>
          </div>
        </div>
      )}
      </div>

      {/* Replies — Reddit-style threading lines */}
      {!isReply && replies.length > 0 && (
        <div className="relative pt-4 pl-10 space-y-4">
          {replies.map((r, i) => {
            const isLast = i === replies.length - 1
            return (
              <div
                key={r.id}
                ref={isLast ? lastReplyRef : undefined}
                className="relative"
              >
                {/* Curved elbow: horizontal line from threading line to reply avatar center */}
                <span
                  aria-hidden
                  className="absolute pointer-events-none border-b border-l border-border rounded-bl-xl"
                  style={{ left: '-24px', top: '-4px', width: '38px', height: '18px' }}
                />
                <CommentCard
                  comment={r}
                  currentUserId={currentUserId}
                  onReport={onReportReply ?? onReport}
                  onDelete={onDeleteReply ?? onDelete}
                  onEdit={onEdit}
                  onReply={onReply}
                  onLike={onLike}
                  isReply
                  t={t}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
