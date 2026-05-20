'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Send } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProBadge } from '@/components/ui/ProBadge'

interface Comment {
  id: string
  content: string
  created_at: string
  profiles?: { username: string; avatar_url: string | null; plan?: string | null }
}

interface Props {
  submissionId: string
  initialComments: Comment[]
  currentUserId: string | null
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'à l\'instant'
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}j`
  return new Date(date).toLocaleDateString('fr', { month: 'short', day: 'numeric' })
}

export function SubmissionComments({ submissionId, initialComments, currentUserId }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!text.trim() || !currentUserId || submitting) return
    setSubmitting(true)
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId, content: text }),
    })
    if (res.ok) {
      const { comment } = await res.json()
      setComments(prev => [...prev, comment])
      setText('')
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground font-mono py-6 text-center">
          Aucun commentaire. Sois le premier.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <Avatar className="size-7 rounded-full shrink-0 mt-0.5">
                <AvatarImage src={c.profiles?.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px] font-bold">
                  {(c.profiles?.username ?? '?')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Link href={`/u/${c.profiles?.username}`} className="text-xs font-bold hover:underline inline-flex items-center gap-1">
                    @{c.profiles?.username}
                    <ProBadge plan={c.profiles?.plan} size={11} />
                  </Link>
                  <span className="text-[11px] text-muted-foreground font-mono">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      {currentUserId ? (
        <div className="flex gap-2 pt-3 border-t border-border">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder="Ajouter un commentaire…"
            className="flex-1 h-10 text-base md:text-sm bg-transparent dark:bg-input/30 border border-input rounded-[var(--radius-input)] px-3 py-1 placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !text.trim()}
            className="flex items-center justify-center size-10 rounded-[var(--radius-input)] bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-85 transition-opacity shrink-0"
          >
            <Send className="size-3.5" />
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground pt-3 border-t border-border">
          <Link href="/login" className="underline">Connecte-toi</Link> pour commenter.
        </p>
      )}
    </div>
  )
}
