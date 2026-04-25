'use client'

import { useState } from 'react'
import Link from 'next/link'

import { Heart, MessageCircle, Lock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface Submission {
  id: string
  cover_url: string
  is_visible: boolean
  likes_count: number
  comments_count: number
  user_id: string
  profiles?: { username: string; avatar_url: string | null; league: string }
  challenges?: { title: string }
}

interface GalleryProps {
  submissions: Submission[]
  currentUserId: string | null
  isRevealed: boolean
  challengeTitle: string
}

// Keys = noms DB de la table `leagues` (7ajra = Stone)
const LEAGUE_COLOR: Record<string, string> = {
  '7ajra':    'bg-stone-100   text-stone-600  dark:bg-stone-900/40  dark:text-stone-400',
  Stone:      'bg-stone-100   text-stone-600  dark:bg-stone-900/40  dark:text-stone-400',
  Bronze:     'bg-orange-100  text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Silver:     'bg-slate-100   text-slate-600  dark:bg-slate-900/40  dark:text-slate-400',
  Gold:       'bg-yellow-100  text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Platinum:   'bg-sky-100     text-sky-700    dark:bg-sky-900/30    dark:text-sky-400',
  Diamond:    'bg-cyan-100    text-cyan-700   dark:bg-cyan-900/30   dark:text-cyan-400',
  Master:     'bg-violet-100  text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  Legend:     'bg-red-100     text-red-600    dark:bg-red-900/30    dark:text-red-400',
}

const LEAGUE_LABEL: Record<string, string> = { '7ajra': 'Stone' }

export function SubmissionGallery({ submissions, currentUserId, isRevealed, challengeTitle }: GalleryProps) {
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})
  const [likesMap, setLikesMap] = useState<Record<string, number>>(
    Object.fromEntries(submissions.map(s => [s.id, s.likes_count]))
  )

  async function handleLike(submissionId: string) {
    if (!currentUserId) return
    const res = await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId }),
    })
    if (res.ok) {
      const { liked, likes_count } = await res.json()
      setLikedMap(prev => ({ ...prev, [submissionId]: liked }))
      setLikesMap(prev => ({ ...prev, [submissionId]: likes_count }))
    }
  }

  if (submissions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        No submissions yet. Be the first to submit.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Counter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground font-mono">{submissions.length}</span>
          {' '}designer{submissions.length !== 1 ? 's' : ''} {isRevealed ? 'submitted' : 'already submitted'}
        </p>
        {!isRevealed && (
          <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground border border-border px-3 py-1 rounded-full">
            <Lock className="size-3" /> Reveals at deadline
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {submissions.map(s => {
          const isOwn = s.user_id === currentUserId
          const blurred = !isRevealed && !isOwn
          const liked = likedMap[s.id] ?? false
          const likes = likesMap[s.id] ?? 0

          return (
            <div key={s.id} className="group border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-colors">
              {/* Cover */}
              <Link
                href={blurred ? '#' : `/dashboard/submissions/${s.id}`}
                className="relative aspect-video bg-muted block overflow-hidden"
                onClick={e => blurred && e.preventDefault()}
              >
                {s.cover_url ? (
                  <img
                    src={s.cover_url}
                    alt="Submission"
                    className={cn(
                      'w-full h-full object-cover transition-all duration-300',
                      blurred ? 'blur-xl scale-110' : 'group-hover:scale-105'
                    )}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-mono">
                    No preview
                  </div>
                )}

                {blurred && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/20">
                    <Lock className="size-5 text-foreground/60" />
                    <span className="text-[10px] font-mono text-foreground/60">Hidden until deadline</span>
                  </div>
                )}

                {isOwn && !isRevealed && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-mono px-2 py-0.5 rounded-full">
                    Your work
                  </div>
                )}
              </Link>

              {/* Footer — only shown when revealed */}
              {isRevealed && (
                <div className="p-3 space-y-2">
                  {/* Profile */}
                  {s.profiles && (
                    <div className="flex items-center gap-2">
                      <Avatar className="size-5 rounded-md">
                        <AvatarImage src={s.profiles.avatar_url ?? undefined} />
                        <AvatarFallback className="rounded-md text-[9px]">
                          {s.profiles.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Link href={`/u/${s.profiles.username}`} className="text-xs font-medium truncate hover:underline">@{s.profiles.username}</Link>
                      {s.profiles.league && (
                        <span className={cn(
                          'text-[9px] font-mono px-1.5 py-0.5 rounded-full ml-auto',
                          LEAGUE_COLOR[s.profiles.league] ?? LEAGUE_COLOR.Stone
                        )}>
                          {LEAGUE_LABEL[s.profiles.league] ?? s.profiles.league}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleLike(s.id)}
                      disabled={!currentUserId}
                      className={cn(
                        'flex items-center gap-1 text-xs font-mono transition-colors',
                        liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500',
                        !currentUserId && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      <Heart className={cn('size-3.5', liked && 'fill-current')} />
                      {likes}
                    </button>
                    <Link
                      href={`/dashboard/submissions/${s.id}`}
                      className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MessageCircle className="size-3.5" />
                      {s.comments_count}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
