'use client'

import Link from 'next/link'

import { MessageCircle, Lock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProBadge } from '@/components/ui/ProBadge'
import { cn } from '@/lib/utils'
import { ReportButton } from './ReportButton'

interface Submission {
  id: string
  cover_url: string
  is_visible: boolean
  total_claps?: number | null
  comments_count: number
  user_id: string
  created_at?: string
  profiles?: { username: string; avatar_url: string | null; league: string; plan?: string | null }
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

export function SubmissionGallery({ submissions, currentUserId, isRevealed }: GalleryProps) {
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
          const claps = s.total_claps ?? 0

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
                      <Link href={`/u/${s.profiles.username}`} className="text-xs font-medium truncate hover:underline inline-flex items-center gap-1">
                        @{s.profiles.username}
                        <ProBadge plan={s.profiles.plan} size={11} />
                      </Link>
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
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <svg viewBox="0 0 51.2 51.2" className="size-4" fill="currentColor" aria-hidden="true">
                        <path d="m40.76 19.86a3 3 0 0 0 -5.49-.14l-.27-1a3 3 0 0 0 -5-.84l-2.86-2.88a3.23 3.23 0 0 0 -4.44 0 1.25 1.25 0 0 1 -.09.12l-1.24-1.24a3.21 3.21 0 0 0 -4.44 0 3.3 3.3 0 0 0 -.79 1.38l-.1-.1a3.23 3.23 0 0 0 -4.44 0 3.16 3.16 0 0 0 0 4.44l.11.1a3.12 3.12 0 0 0 -1.37.79 3.11 3.11 0 0 0 0 4.43l.32.32a3.06 3.06 0 0 0 -1.42.76 3.15 3.15 0 0 0 0 4.44l9.21 9.21a9.34 9.34 0 0 0 6.62 2.73 9.67 9.67 0 0 0 1.2-.08 9.33 9.33 0 0 0 4.61 1.22 10.15 10.15 0 0 0 6.58-2.48l3.11-3.04a7.83 7.83 0 0 0 2.27-5.05c.26-4.39-.84-8.83-2.08-13.09zm-16.92-3.68a1.57 1.57 0 0 1 2.16 0l3.24 3.25a3.37 3.37 0 0 0 0 .44v1.9l-5.47-5.47a1 1 0 0 1 .07-.12zm-4.25 22.37-9.21-9.21a1.52 1.52 0 0 1 0-2.16 1.56 1.56 0 0 1 2.16 0s0 0 0 0l5 5a.82.82 0 0 0 1.14 0 .81.81 0 0 0 0-1.14l-7.19-7.19a1.51 1.51 0 0 1 -.49-1.11 1.48 1.48 0 0 1 .46-1.08 1.53 1.53 0 0 1 2.16 0l7.19 7.2a.82.82 0 0 0 1.14 0 .81.81 0 0 0 0-1.14l-9.22-9.22a1.5 1.5 0 0 1 -.45-1.08 1.54 1.54 0 0 1 .45-1.09 1.57 1.57 0 0 1 2.16 0l2 2 7.18 7.19a.81.81 0 0 0 1.14-1.14l-7.19-7.19a1.52 1.52 0 0 1 0-2.16 1.55 1.55 0 0 1 2.17 0l9.21 9.21a.82.82 0 0 0 .88.17.81.81 0 0 0 .49-.74v-3.81a1.35 1.35 0 0 1 .07-.44 1.4 1.4 0 0 1 1.32-1 1.43 1.43 0 0 1 1.29.8c.6 2.15 1.08 4 1.45 5.81a26.38 26.38 0 0 1 .53 6.62 6.12 6.12 0 0 1 -1.81 4l-3.02 3.12a8.33 8.33 0 0 1 -4.29 2 7.73 7.73 0 0 1 -6.72-2.22zm21.65-5.74a6.21 6.21 0 0 1 -1.81 4l-3.06 3.09a8.26 8.26 0 0 1 -7.53 1.77 10.47 10.47 0 0 0 2.85-1.67l3.1-3.11a7.73 7.73 0 0 0 2.28-5.06 27.39 27.39 0 0 0 -.55-6.93l.06-3.9a1.41 1.41 0 0 1 1.42-1.42 1.39 1.39 0 0 1 1.26.8c1.18 4.21 2.23 8.33 1.98 12.43zm-20.54-21.14a.8.8 0 1 0 1.15-1.12l-1.69-1.76a.81.81 0 0 0 -1.16 1.12zm4-.46a.8.8 0 0 0 .8-.8v-2a.8.8 0 1 0 -1.6 0v2a.8.8 0 0 0 .77.8zm3.38.7a.82.82 0 0 0 .56-.23l1.67-1.68a.8.8 0 0 0 -1.12-1.14l-1.7 1.66a.79.79 0 0 0 0 1.13.78.78 0 0 0 .56.26z" />
                      </svg>
                      {claps}
                    </span>
                    <Link
                      href={`/dashboard/submissions/${s.id}`}
                      className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MessageCircle className="size-3.5" />
                      {s.comments_count}
                    </Link>
                    {!isOwn && currentUserId && s.created_at && (
                      <div className="ml-auto">
                        <ReportButton submissionId={s.id} submissionCreatedAt={s.created_at} />
                      </div>
                    )}
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
