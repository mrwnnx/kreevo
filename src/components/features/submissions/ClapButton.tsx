'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ClapButtonProps {
  submissionId: string
  initialClaps: number
  userClaps: number
  isOwner: boolean
}

const MAX_CLAPS = 10

// Outline clap (idle)
const ClapIconOutline = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 51.2 51.2" xmlns="http://www.w3.org/2000/svg" className={cn('transition-all duration-150', className)}>
    <path
      fill="currentColor"
      d="m40.76 19.86a3 3 0 0 0 -5.49-.14l-.27-1a3 3 0 0 0 -5-.84l-2.86-2.88a3.23 3.23 0 0 0 -4.44 0 1.25 1.25 0 0 1 -.09.12l-1.24-1.24a3.21 3.21 0 0 0 -4.44 0 3.3 3.3 0 0 0 -.79 1.38l-.1-.1a3.23 3.23 0 0 0 -4.44 0 3.16 3.16 0 0 0 0 4.44l.11.1a3.12 3.12 0 0 0 -1.37.79 3.11 3.11 0 0 0 0 4.43l.32.32a3.06 3.06 0 0 0 -1.42.76 3.15 3.15 0 0 0 0 4.44l9.21 9.21a9.34 9.34 0 0 0 6.62 2.73 9.67 9.67 0 0 0 1.2-.08 9.33 9.33 0 0 0 4.61 1.22 10.15 10.15 0 0 0 6.58-2.48l3.11-3.04a7.83 7.83 0 0 0 2.27-5.05c.26-4.39-.84-8.83-2.08-13.09zm-16.92-3.68a1.57 1.57 0 0 1 2.16 0l3.24 3.25a3.37 3.37 0 0 0 0 .44v1.9l-5.47-5.47a1 1 0 0 1 .07-.12zm-4.25 22.37-9.21-9.21a1.52 1.52 0 0 1 0-2.16 1.56 1.56 0 0 1 2.16 0s0 0 0 0l5 5a.82.82 0 0 0 1.14 0 .81.81 0 0 0 0-1.14l-7.19-7.19a1.51 1.51 0 0 1 -.49-1.11 1.48 1.48 0 0 1 .46-1.08 1.53 1.53 0 0 1 2.16 0l7.19 7.2a.82.82 0 0 0 1.14 0 .81.81 0 0 0 0-1.14l-9.22-9.22a1.5 1.5 0 0 1 -.45-1.08 1.54 1.54 0 0 1 .45-1.09 1.57 1.57 0 0 1 2.16 0l2 2 7.18 7.19a.81.81 0 0 0 1.14-1.14l-7.19-7.19a1.52 1.52 0 0 1 0-2.16 1.55 1.55 0 0 1 2.17 0l9.21 9.21a.82.82 0 0 0 .88.17.81.81 0 0 0 .49-.74v-3.81a1.35 1.35 0 0 1 .07-.44 1.4 1.4 0 0 1 1.32-1 1.43 1.43 0 0 1 1.29.8c.6 2.15 1.08 4 1.45 5.81a26.38 26.38 0 0 1 .53 6.62 6.12 6.12 0 0 1 -1.81 4l-3.02 3.12a8.33 8.33 0 0 1 -4.29 2 7.73 7.73 0 0 1 -6.72-2.22zm21.65-5.74a6.21 6.21 0 0 1 -1.81 4l-3.06 3.09a8.26 8.26 0 0 1 -7.53 1.77 10.47 10.47 0 0 0 2.85-1.67l3.1-3.11a7.73 7.73 0 0 0 2.28-5.06 27.39 27.39 0 0 0 -.55-6.93l.06-3.9a1.41 1.41 0 0 1 1.42-1.42 1.39 1.39 0 0 1 1.26.8c1.18 4.21 2.23 8.33 1.98 12.43zm-20.54-21.14a.8.8 0 1 0 1.15-1.12l-1.69-1.76a.81.81 0 0 0 -1.16 1.12zm4-.46a.8.8 0 0 0 .8-.8v-2a.8.8 0 1 0 -1.6 0v2a.8.8 0 0 0 .77.8zm3.38.7a.82.82 0 0 0 .56-.23l1.67-1.68a.8.8 0 0 0 -1.12-1.14l-1.7 1.66a.79.79 0 0 0 0 1.13.78.78 0 0 0 .56.26z"
    />
  </svg>
)

// Colored clap (active — user has clapped at least once)
const ClapIconColored = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 51.2 51.2" xmlns="http://www.w3.org/2000/svg" className={cn('transition-all duration-150', className)}>
    <path d="m26.56 15.61 3.55 3.56a2.26 2.26 0 0 0 -.11.69v3.84l-7.28-7.28a2.34 2.34 0 0 1 3.83-.81z" fill="#43cfc8" />
    <path d="m40 20.16c1.16 4.1 2.28 8.43 2 12.7a7 7 0 0 1 -2 4.54l-3.11 3.11a9 9 0 0 1 -10.46 1 9.19 9.19 0 0 0 4.69-2.14l3.11-3.11a7 7 0 0 0 2-4.54 27.06 27.06 0 0 0 -.55-6.82l.09-3.9a2.2 2.2 0 0 1 2.16-2.2 2.19 2.19 0 0 1 2.07 1.36z" fill="#43cfc8" />
    <path d="m17.49 17.79a2.33 2.33 0 1 1 3.3-3.3l1.94 1.93 7.27 7.28v-3.84a2.26 2.26 0 0 1 .11-.69 2.2 2.2 0 0 1 2.06-1.52 2.24 2.24 0 0 1 2.08 1.35c.54 1.92 1.07 3.89 1.46 5.88a27.06 27.06 0 0 1 .55 6.82 7 7 0 0 1 -2 4.54l-3.11 3.11a9.19 9.19 0 0 1 -4.69 2.14 8.6 8.6 0 0 1 -7.46-2.37l-9.2-9.21a2.33 2.33 0 0 1 3.3-3.3l-2.21-2.22a2.32 2.32 0 0 1 0-3.3 2.34 2.34 0 0 1 3.3 0l-2-2a2.34 2.34 0 0 1 0-3.3 2.34 2.34 0 0 1 3.3 0z" fill="#fdde59" />
    <g fill="#003442">
      <path d="m19 39.92a.82.82 0 0 1 -.56-.23l-9.2-9.21a3.15 3.15 0 0 1 0-4.44 3.23 3.23 0 0 1 4.43 0 .81.81 0 0 1 0 1.14.8.8 0 0 1 -1.13 0 1.57 1.57 0 0 0 -2.17 0 1.52 1.52 0 0 0 0 2.16l9.21 9.21a.81.81 0 0 1 0 1.14.83.83 0 0 1 -.58.23z" />
      <path d="m21.39 29.08a.83.83 0 0 1 -.57-.23l-9.22-9.22a3.14 3.14 0 0 1 0-4.44 3.23 3.23 0 0 1 4.44 0l9.21 9.21a.81.81 0 0 1 0 1.14.8.8 0 0 1 -1.13 0l-9.22-9.21a1.57 1.57 0 0 0 -2.16 0 1.52 1.52 0 0 0 0 2.17l9.26 9.21a.8.8 0 0 1 -.56 1.37z" />
      <path d="m18.07 32.38a.82.82 0 0 1 -.56-.23l-7.18-7.15a3.11 3.11 0 0 1 0-4.43 3.13 3.13 0 0 1 4.42 0 .81.81 0 0 1 0 1.14.8.8 0 0 1 -1.13 0 1.53 1.53 0 0 0 -2.17 0 1.48 1.48 0 0 0 -.45 1.03 1.51 1.51 0 0 0 .45 1.08l7.19 7.18a.81.81 0 0 1 0 1.14.83.83 0 0 1 -.57.24z" />
      <path d="m25.07 42.42a9.32 9.32 0 0 1 -6.62-2.73.81.81 0 0 1 0-1.14.8.8 0 0 1 1.13 0 7.75 7.75 0 0 0 6.73 2.18 8.34 8.34 0 0 0 4.28-2l3.07-3.07a6.12 6.12 0 0 0 1.81-4 26.42 26.42 0 0 0 -.54-6.62c-.36-1.85-.84-3.66-1.45-5.81a1.4 1.4 0 0 0 -2.6.17 1.36 1.36 0 0 0 -.08.44v3.86a.79.79 0 0 1 -.49.74.8.8 0 0 1 -.87-.17l-9.22-9.21a1.55 1.55 0 0 0 -2.17 0 1.52 1.52 0 0 0 0 2.16.81.81 0 0 1 0 1.14.8.8 0 0 1 -1.13 0 3.14 3.14 0 0 1 0-4.44 3.19 3.19 0 0 1 4.43 0l7.85 7.84v-1.9a3 3 0 0 1 .15-.93 3 3 0 0 1 5.65-.21c.57 2 1.11 4 1.51 6a27.65 27.65 0 0 1 .56 7 7.77 7.77 0 0 1 -2.27 5.06l-3.12 3.22a10 10 0 0 1 -5.14 2.36 9.18 9.18 0 0 1 -1.47.06z" />
      <path d="m30.88 43.56a9.35 9.35 0 0 1 -4.88-1.35.78.78 0 0 1 -.27-1.09.81.81 0 0 1 1.1-.28 8.14 8.14 0 0 0 9.52-.94l3.07-3.07a6.21 6.21 0 0 0 1.81-4c.25-4.1-.8-8.22-2-12.43a1.41 1.41 0 0 0 -2.68.6l-.06 3.94a.8.8 0 0 1 -.81.79.79.79 0 0 1 -.78-.81l.1-3.92a3 3 0 0 1 5.79-1.11c1.21 4.26 2.34 8.7 2.07 13a7.78 7.78 0 0 1 -2.3 5.11l-3.11 3.12a10.1 10.1 0 0 1 -6.57 2.44z" />
      <path d="m30.12 20a.78.78 0 0 1 -.57-.24l-3.55-3.59a1.58 1.58 0 0 0 -2.17 0 1.64 1.64 0 0 0 -.35.52.8.8 0 1 1 -1.48-.55 3.13 3.13 0 0 1 5.13-1.14l3.55 3.56a.8.8 0 0 1 -.56 1.44z" />
    </g>
    <path d="m21.27 11.91a.81.81 0 0 1 -.57-.24l-1.7-1.76a.8.8 0 1 1 1.15-1.12l1.7 1.76a.81.81 0 0 1 0 1.14.79.79 0 0 1 -.58.22z" fill="#43cfc8" />
    <path d="m24.66 11.21a.79.79 0 0 1 -.79-.8v-2a.8.8 0 1 1 1.59 0v2a.8.8 0 0 1 -.8.8z" fill="#43cfc8" />
    <path d="m28 11.91a.81.81 0 0 1 -.57-.24.79.79 0 0 1 0-1.13l1.7-1.66a.8.8 0 0 1 1.13 0 .79.79 0 0 1 0 1.13l-1.7 1.66a.79.79 0 0 1 -.56.24z" fill="#43cfc8" />
  </svg>
)

export function ClapButton({ submissionId, initialClaps, userClaps: initialUserClaps, isOwner }: ClapButtonProps) {
  const [totalClaps, setTotalClaps] = useState(initialClaps)
  const [userClaps, setUserClaps] = useState(initialUserClaps)
  const [isAnimating, setIsAnimating] = useState(false)
  const [floats, setFloats] = useState<number[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef(0)

  const canClap = !isOwner && userClaps < MAX_CLAPS
  const isMaxed = userClaps >= MAX_CLAPS
  const hasClapped = userClaps > 0 || isAnimating

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleClap = useCallback(async () => {
    if (!canClap) return

    setUserClaps((prev) => Math.min(prev + 1, MAX_CLAPS))
    setTotalClaps((prev) => prev + 1)
    setIsAnimating(true)
    pendingRef.current += 1

    // Spawn one floating "+1" — auto-clean after the animation duration
    const id = Date.now() + Math.random()
    setFloats((prev) => [...prev, id])
    setTimeout(() => setFloats((prev) => prev.filter((f) => f !== id)), 800)

    setTimeout(() => setIsAnimating(false), 200)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const pending = pendingRef.current
      pendingRef.current = 0
      try {
        for (let i = 0; i < pending; i++) {
          const res = await fetch(`/api/submissions/${submissionId}/clap`, { method: 'POST' })
          if (!res.ok) throw new Error('Clap failed')
          const data = await res.json()
          if (typeof data.userClaps === 'number') setUserClaps(data.userClaps)
          if (typeof data.totalClaps === 'number') setTotalClaps(data.totalClaps)
        }
      } catch {
        setUserClaps((prev) => Math.max(prev - pending, 0))
        setTotalClaps((prev) => Math.max(prev - pending, 0))
      }
    }, 600)
  }, [canClap, submissionId])

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        {floats.map((id, i) => (
          <div
            key={id}
            className="absolute -top-9 left-1/2 pointer-events-none z-10"
            style={{
              transform: `translateX(calc(-50% + ${(i % 3) * 6 - 6}px))`,
              animation: 'clapFloat 700ms ease-out forwards',
            }}
          >
            <span className="text-sm font-bold text-emerald-500 whitespace-nowrap">+1</span>
          </div>
        ))}

        <button
          onClick={handleClap}
          disabled={!canClap}
          title={
            isOwner
              ? 'Tu ne peux pas clapper ton propre travail'
              : isMaxed
                ? 'Maximum atteint !'
                : `Clapper (${MAX_CLAPS - userClaps} restants)`
          }
          className={cn(
            'relative w-14 h-14 rounded-full',
            'border-2 transition-all duration-150',
            'flex items-center justify-center',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
            isMaxed && ['border-emerald-500', 'bg-emerald-50 dark:bg-emerald-900/20'],
            !isMaxed && canClap && [
              'border-border bg-white dark:bg-zinc-900',
              'hover:border-emerald-400',
              'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
              'active:scale-90 cursor-pointer',
            ],
            isOwner && ['opacity-40 cursor-not-allowed', 'border-border'],
            isAnimating && 'scale-125',
            !hasClapped && !isMaxed && 'text-zinc-400',
          )}
        >
          {hasClapped || isMaxed
            ? <ClapIconColored className="w-7 h-7" />
            : <ClapIconOutline className="w-7 h-7" />}
        </button>
      </div>

      <span
        className={cn(
          'text-sm font-semibold tabular-nums transition-all duration-150',
          totalClaps > 0 ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {totalClaps > 0 ? totalClaps.toLocaleString() : '—'}
      </span>

      <span className="text-xs text-muted-foreground">
        {isMaxed ? '👏 Max !' : isOwner ? 'Claps reçus' : 'Clapper'}
      </span>
    </div>
  )
}
