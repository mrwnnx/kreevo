'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>
  userAvatar?: string | null
  username?: string
}

export function CommentForm({ onSubmit, userAvatar, username }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = content.trim().length >= 10 && !isLoading

  async function handleSubmit() {
    if (!canSubmit) return
    setIsLoading(true)
    setError('')
    try {
      await onSubmit(content.trim())
      setContent('')
    } catch {
      setError('Une erreur est survenue.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="border border-border rounded-2xl p-5 space-y-4 bg-white dark:bg-zinc-950">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0">
          {userAvatar ? (
            <img src={userAvatar} alt={username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-medium text-zinc-500">
              {username?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium">Laisse un commentaire</p>
          <p className="text-xs text-muted-foreground">Aide le designer à progresser</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Donne un feedback constructif... (minimum 10 caractères)"
          rows={3}
          maxLength={500}
          className={cn(
            'w-full resize-none rounded-[var(--radius-input)] border',
            'border-input bg-transparent dark:bg-input/30 p-3 text-base md:text-sm',
            'placeholder:text-muted-foreground',
            'outline-none focus-visible:ring-3',
            'focus-visible:ring-ring/50 focus-visible:border-ring',
            'transition-colors',
          )}
        />
        <div className="flex items-center justify-between">
          <span className={cn('text-xs transition-colors', content.length < 10 ? 'text-muted-foreground' : 'text-emerald-500')}>
            {content.length < 10 ? `${10 - content.length} caractères minimum` : `${content.length} / 500`}
          </span>
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full" size="sm">
        {isLoading ? (
          <span className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Publication...
          </span>
        ) : (
          'Publier →'
        )}
      </Button>
    </div>
  )
}
