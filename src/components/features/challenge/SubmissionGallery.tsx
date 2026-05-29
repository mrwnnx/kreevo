'use client'

import Link from 'next/link'

import { MessageCircle, Heart } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProBadge } from '@/components/ui/ProBadge'
import { cn } from '@/lib/utils'
import { ReportButton } from './ReportButton'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

interface Submission {
  id: string
  cover_url: string
  is_visible: boolean
  total_likes?: number | null
  comments_count: number
  user_id: string
  created_at?: string
  profiles?: { username: string; avatar_url: string | null; league: string; plan?: string | null }
  challenges?: { title: string }
}

interface GalleryProps {
  submissions: Submission[]
  currentUserId: string | null
  challengeTitle: string
  t?: Dictionary['challengeDetail']['gallery']
}

const FALLBACK_T: Dictionary['challengeDetail']['gallery'] = {
  countSingular: 'designer a soumis',
  countPlural: 'designers ont soumis',
  submissionAlt: 'Soumission',
}

// Keys = noms DB de la table `leagues` (8 noms canoniques)
const LEAGUE_COLOR: Record<string, string> = {
  Stone:      'bg-stone-100   text-stone-600  dark:bg-stone-900/40  dark:text-stone-400',
  Bronze:     'bg-orange-100  text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Silver:     'bg-slate-100   text-slate-600  dark:bg-slate-900/40  dark:text-slate-400',
  Gold:       'bg-yellow-100  text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Platinum:   'bg-sky-100     text-sky-700    dark:bg-sky-900/30    dark:text-sky-400',
  Diamond:    'bg-cyan-100    text-cyan-700   dark:bg-cyan-900/30   dark:text-cyan-400',
  Master:     'bg-violet-100  text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  Legend:     'bg-red-100     text-red-600    dark:bg-red-900/30    dark:text-red-400',
}

export function SubmissionGallery({ submissions, currentUserId, t = FALLBACK_T }: GalleryProps) {
  if (submissions.length === 0) {
    return null
  }

  const isPlural = submissions.length !== 1
  const countLabel = isPlural ? t.countPlural : t.countSingular

  return (
    <div className="space-y-4">
      {/* Counter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground font-mono">{submissions.length}</span>
          {' '}{countLabel}
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {submissions.map(s => {
          const isOwn = s.user_id === currentUserId
          const likes = s.total_likes ?? 0

          return (
            <div key={s.id} className="group border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-colors">
              {/* Cover */}
              <Link
                href={`/dashboard/submissions/${s.id}`}
                className="relative aspect-video bg-muted block overflow-hidden"
              >
                {s.cover_url ? (
                  <img
                    src={s.cover_url}
                    alt={t.submissionAlt}
                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-mono">
                    No preview
                  </div>
                )}
              </Link>

              {/* Footer */}
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
                        'text-[9px] font-mono px-1.5 py-0.5 rounded-full ms-auto',
                        LEAGUE_COLOR[s.profiles.league] ?? LEAGUE_COLOR.Stone
                      )}>
                        {s.profiles.league}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Heart className="size-3.5 fill-red-500 text-red-500" strokeWidth={1.5} />
                    {likes}
                  </span>
                  <Link
                    href={`/dashboard/submissions/${s.id}`}
                    className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="size-3.5" />
                    {s.comments_count}
                  </Link>
                  {!isOwn && currentUserId && s.created_at && (
                    <div className="ms-auto">
                      <ReportButton submissionId={s.id} submissionCreatedAt={s.created_at} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
