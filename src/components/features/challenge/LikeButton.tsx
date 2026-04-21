'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

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
        'flex items-center gap-1.5 text-sm font-mono transition-colors',
        liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500',
        (!currentUserId || pending) && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Heart className={cn('size-4 transition-all', liked && 'fill-current scale-110')} />
      {likes}
    </button>
  )
}
