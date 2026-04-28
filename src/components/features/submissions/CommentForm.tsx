'use client'

import { useState } from 'react'
import { FireRating } from './FireRating'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CommentFormProps {
  submissionId: string
  onSubmit: (data: { content: string; rating: number }) => Promise<void>
  userAvatar?: string | null
  username?: string
}

export function CommentForm({ onSubmit, userAvatar, username }: CommentFormProps) {
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = rating > 0 && content.trim().length >= 10

  async function handleSubmit() {
    if (!canSubmit) return
    setIsLoading(true)
    setError('')
    try {
      await onSubmit({ content: content.trim(), rating })
      setContent('')
      setRating(0)
    } catch {
      setError('Une erreur est survenue. Réessaie.')
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
          <p className="text-sm font-medium">Laisse une review</p>
          <p className="text-xs text-muted-foreground">Aide le designer à progresser</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground flex-shrink-0">Ta note :</span>
        <FireRating value={rating} onChange={setRating} size="md" />
        {rating === 0 && <span className="text-xs text-muted-foreground">Clique pour noter</span>}
      </div>

      <div className="space-y-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Donne un feedback constructif sur ce travail... (min 10 caractères)"
          rows={3}
          maxLength={500}
          className={cn(
            'w-full resize-none rounded-xl border',
            'border-border bg-transparent p-3 text-sm',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2',
            'focus:ring-violet-500 focus:border-transparent',
            'transition-colors',
          )}
        />
        <div className="flex items-center justify-between">
          <span className={cn('text-xs', content.length < 10 ? 'text-muted-foreground' : 'text-green-500')}>
            {content.length < 10 ? `${10 - content.length} caractères minimum` : `${content.length}/500`}
          </span>
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={!canSubmit || isLoading} className="w-full" size="sm">
        {isLoading ? (
          <span className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Publication...
          </span>
        ) : (
          'Publier mon avis →'
        )}
      </Button>
    </div>
  )
}
