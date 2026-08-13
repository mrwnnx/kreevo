'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GLASS_SURFACE, GLASS_GRADIENT } from '@/components/layout/GlassShell'
import type { HelpDictionary } from '@/lib/help/lang'

interface Props {
  articleId: string
  t: HelpDictionary
}

export function ArticleFeedback({ articleId, t }: Props) {
  const [voted, setVoted] = useState<'helpful' | 'not_helpful' | null>(null)
  const [isPending, startTransition] = useTransition()

  function vote(kind: 'helpful' | 'not_helpful') {
    if (voted) return
    setVoted(kind)
    startTransition(async () => {
      try {
        await fetch(`/api/help/articles/${articleId}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind }),
        })
      } catch {
        /* silent — feedback is best-effort */
      }
    })
  }

  return (
    <div className={`${GLASS_SURFACE} my-10 space-y-4 p-6 text-center`} style={GLASS_GRADIENT}>
      <p className="text-sm font-semibold text-foreground">
        {t.helpfulQuestion}
      </p>

      {voted ? (
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <Check className="size-4" />
            {voted === 'helpful'
              ? t.helpfulYes === 'Oui'
                ? 'Merci pour ton retour !'
                : 'Thanks for your feedback!'
              : t.helpfulYes === 'Oui'
                ? "Désolé, on va améliorer cet article."
                : 'Sorry, we\'ll improve this article.'}
          </div>
          {voted === 'not_helpful' && (
            <Link
              href="/help/contact"
              className="inline-flex items-center justify-center bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-85 transition-opacity"
            >
              {t.contactCta}
            </Link>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => vote('helpful')}
            disabled={isPending}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border border-border bg-background hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-colors',
              isPending && 'opacity-60',
            )}
          >
            <ThumbsUp className="size-4" />
            {t.helpfulYes}
          </button>
          <button
            type="button"
            onClick={() => vote('not_helpful')}
            disabled={isPending}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border border-border bg-background hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 dark:hover:bg-rose-950/40 dark:hover:border-rose-700 dark:hover:text-rose-400 transition-colors',
              isPending && 'opacity-60',
            )}
          >
            <ThumbsDown className="size-4" />
            {t.helpfulNo}
          </button>
        </div>
      )}
    </div>
  )
}
