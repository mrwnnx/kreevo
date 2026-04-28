'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProBadge } from '@/components/ui/ProBadge'

export interface ReviewComment {
  id: string
  content: string
  title?: string | null
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
  onReport: (id: string) => Promise<void>
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

export function CommentCard({ comment, currentUserId, onReport }: CommentCardProps) {
  const [reported, setReported] = useState(comment.is_reported)
  const isOwn = comment.user.id === currentUserId

  async function handleReport() {
    if (!confirm('Signaler ce commentaire ?')) return
    await onReport(comment.id)
    setReported(true)
  }

  return (
    <div className="flex gap-3 group">
      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0 mt-0.5">
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

        {comment.title && (
          <p className="text-sm font-semibold text-foreground">{comment.title}</p>
        )}
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{comment.content}</p>

        {!isOwn && !reported && (
          <button
            onClick={handleReport}
            className={cn(
              'flex items-center gap-1 text-xs',
              'text-muted-foreground hover:text-red-500 transition-colors',
              'opacity-0 group-hover:opacity-100 duration-150',
            )}
          >
            <Flag className="w-3 h-3" />
            <span>Signaler</span>
          </button>
        )}

        {reported && <span className="text-xs text-muted-foreground">✓ Signalé</span>}
      </div>
    </div>
  )
}
