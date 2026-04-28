'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { FireIcon } from '@/components/features/submissions/FireIcon'

interface Props {
  submissionId: string
  initialLikes: number
  initialLiked: boolean
  currentUserId: string | null
}

export function LikeButton({ submissionId, initialLikes, initialLiked, currentUserId }: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [likes, setLikes] = useState(initialLikes)
  const [pending, setPending] = useState(false)

  async function toggle() {
    if (!currentUserId || pending) return
    setPending(true)
    const nextLiked = !liked
    setLiked(nextLiked)
    setLikes(prev => prev + (nextLiked ? 1 : -1))
    const res = await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId }),
    })
    if (res.ok) {
      const { liked: serverLiked, likes_count } = await res.json()
      setLiked(serverLiked)
      setLikes(likes_count)
    } else {
      setLiked(!nextLiked)
      setLikes(prev => prev + (nextLiked ? -1 : 1))
    }
    setPending(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={!currentUserId || pending}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded-full border transition-all',
        liked
          ? 'bg-red-50 border-red-200 text-red-500'
          : 'border-border text-muted-foreground hover:border-red-200 hover:text-red-400',
        (!currentUserId || pending) && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span className={cn('size-3.5 inline-flex transition-all', liked && 'scale-110')}>
        <FireIcon filled={liked} className="w-full h-full" />
      </span>
      {likes}
    </button>
  )
}
