'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, Zap, ExternalLink } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { League } from '@/lib/utils/xp'
import { leagueLabel, leagueColor } from '@/lib/utils/xp'

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

interface Props {
  author: Author | null
  gradient: string
  league: League
  isOwn: boolean
}

const LINK_LABELS: Record<string, string> = {
  portfolio: 'Portfolio',
  dribbble: 'Dribbble',
  behance: 'Behance',
  linkedin: 'LinkedIn',
  twitter: 'Twitter / X',
  github: 'GitHub',
}

export function ProfilePanel({ author, gradient, league, isOwn }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  if (!author) return null

  const links = author.links as Record<string, string> | null
  const activeLinks = links ? Object.entries(links).filter(([, v]) => v) : []

  return (
    <aside
      className={cn(
        'w-64 shrink-0 sticky top-20 space-y-4 transition-all duration-500',
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      )}
    >
      {/* Avatar + name */}
      <div className="rounded-2xl border border-border overflow-hidden">
        {/* Gradient header */}
        <div className={cn('h-16 bg-gradient-to-br', gradient)} />

        <div className="px-4 pb-4 -mt-8 space-y-3">
          <Avatar className="size-14 rounded-xl border-4 border-background shadow-sm">
            <AvatarImage src={author.avatar_url ?? undefined} />
            <AvatarFallback className="rounded-xl text-lg font-bold">
              {(author.username ?? '?')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/u/${author.username}`} className="font-bold text-sm hover:underline">@{author.username}</Link>
              {isOwn && (
                <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Vous
                </span>
              )}
            </div>
            {author.full_name && (
              <p className="text-xs text-muted-foreground">{author.full_name}</p>
            )}
          </div>

          {/* League + XP */}
          <div className="flex items-center justify-between">
            <span
              className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: leagueColor(league) + '18',
                color: leagueColor(league),
              }}
            >
              {leagueLabel(league)}
            </span>
            {author.xp != null && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                <Zap className="size-3 text-violet-500" />
                {author.xp.toLocaleString()} XP
              </div>
            )}
          </div>

          {/* Location */}
          {(author.city || author.country) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              {[author.city, author.country].filter(Boolean).join(', ')}
            </div>
          )}

          {/* Bio */}
          {author.bio && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {author.bio}
            </p>
          )}
        </div>
      </div>

      {/* Specialty + Tools */}
      {(author.specialty || (author.tools && author.tools.length > 0)) && (
        <div className="rounded-2xl border border-border p-4 space-y-3">
          {author.specialty && (
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Spécialité</p>
              <span className="text-xs bg-muted px-2.5 py-1 rounded-full">{author.specialty}</span>
            </div>
          )}
          {author.tools && author.tools.length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Outils</p>
              <div className="flex flex-wrap gap-1.5">
                {author.tools.map(t => (
                  <span key={t} className="text-[11px] bg-muted px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Links */}
      {activeLinks.length > 0 && (
        <div className="rounded-2xl border border-border p-4 space-y-2">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Liens</p>
          {activeLinks.map(([key, url]) => (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-xs text-foreground hover:text-primary transition-colors group"
            >
              <span>{LINK_LABELS[key] ?? key}</span>
              <ExternalLink className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
          ))}
        </div>
      )}

      {/* View profile CTA */}
      <Link
        href={`/u/${author.username}`}
        className="flex items-center justify-center w-full h-9 rounded-xl border border-border text-xs font-medium hover:bg-muted transition-colors"
      >
        Voir le profil
      </Link>
    </aside>
  )
}
