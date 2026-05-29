'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  liked: boolean
  count: number
  onToggle: () => void
  ariaLabel: string
  disabled?: boolean
  isOwn?: boolean
  /** Heart size class, e.g. "size-4" or "size-5". */
  heartClassName?: string
  /** Extra classes merged onto the button (e.g. a bordered pill). */
  className?: string
}

/** Like button with a heart that floats up and fades out on each like. */
export function LikeButton({
  liked,
  count,
  onToggle,
  ariaLabel,
  disabled,
  isOwn,
  heartClassName = 'size-4',
  className,
}: Props) {
  const [bursts, setBursts] = useState<number[]>([])

  function handleClick() {
    // Spawn a floating heart only when adding a like (not when un-liking).
    if (!liked && !disabled) {
      const id = Date.now()
      setBursts((b) => [...b, id])
      window.setTimeout(() => setBursts((b) => b.filter((x) => x !== id)), 900)
    }
    onToggle()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'relative inline-flex items-center gap-1 text-sm font-semibold transition-colors',
        isOwn ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer',
        liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500',
        className,
      )}
    >
      <Heart
        className={cn(heartClassName, 'transition-transform', liked && 'fill-red-500')}
        strokeWidth={1.8}
      />
      <span>{count}</span>

      {/* Floating hearts (one per like click) */}
      {bursts.map((id) => (
        <Heart
          key={id}
          aria-hidden
          strokeWidth={1.8}
          className={cn(
            'pointer-events-none absolute start-0 top-1/2 fill-red-500 text-red-500',
            heartClassName,
            '[animation:likeFloatUp_0.9s_ease-out_forwards]',
          )}
        />
      ))}
    </button>
  )
}
