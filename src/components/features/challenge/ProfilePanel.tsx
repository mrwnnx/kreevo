'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, ArrowRight, ExternalLink, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

type ProfilePanelT = {
  you: string
  challengeLabel: string
  seeChallenge: string
  linksLabel: string
  seeProject?: string
}

const FALLBACK_T: ProfilePanelT = {
  you: 'Vous',
  challengeLabel: 'Challenge',
  seeChallenge: 'Voir le challenge',
  linksLabel: 'Liens',
  seeProject: 'Voir le projet',
}

interface Author {
  id: string
  username: string
  full_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  league?: string | null
  xp?: number | null
  specialty?: string | null
  tools?: string[] | null
  links?: Record<string, string> | null
  country?: string | null
  city?: string | null
  plan?: string | null
}

interface Challenge {
  id: string
  title?: string | null
  specialty?: string | null
  challenge_type?: string | null
  industry?: string | null
}

interface Props {
  author: Author | null
  isOwn: boolean
  challenge?: Challenge | null
  projectLink?: string | null
  viewsCount?: number
  t?: ProfilePanelT
}

export function ProfilePanel({ author, challenge, projectLink, viewsCount = 0, t = FALLBACK_T }: Props) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  if (!author) return null

  return (
    <aside
      className={cn(
        'w-64 shrink-0 sticky top-20 space-y-3 transition-all duration-500',
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      )}
    >
      {/* Project link (above challenge card) */}
      {projectLink && (
        <a
          href={projectLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-2 w-full text-xs font-medium border border-border px-3 py-2 rounded-full hover:bg-muted transition-colors"
        >
          <span className="inline-flex items-center gap-1.5">
            <ExternalLink className="size-3" /> {t.seeProject ?? 'Voir le projet'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Eye className="size-3.5" />
            {viewsCount.toLocaleString()}
          </span>
        </a>
      )}

      {/* Challenge */}
      {challenge && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold leading-snug">{challenge.title}</p>
          <div className="space-y-1.5">
            {(challenge.specialty || challenge.challenge_type) && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-3 text-center">🎨</span>
                <span>{[challenge.specialty, challenge.challenge_type].filter(Boolean).join(' · ')}</span>
              </div>
            )}
            {challenge.industry && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3" />
                <span>{challenge.industry}</span>
              </div>
            )}
          </div>
          <Link
            href={`/dashboard/challenges/${challenge.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {t.seeChallenge} <ArrowRight className="size-3" />
          </Link>
        </div>
      )}

    </aside>
  )
}
