'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, ExternalLink, Clock, ArrowRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProBadge } from '@/components/ui/ProBadge'
import { cn } from '@/lib/utils'
import { getLeagueLabel, getLeagueColor } from '@/lib/utils/xp'

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
  league: string | null | undefined
  isOwn: boolean
  challenge?: Challenge | null
}

const LINK_LABELS: Record<string, string> = {
  portfolio: 'Portfolio',
  dribbble: 'Dribbble',
  behance: 'Behance',
  linkedin: 'LinkedIn',
  twitter: 'Twitter / X',
  github: 'GitHub',
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-widest mb-2">
      {children}
    </p>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  )
}

export function ProfilePanel({ author, league, isOwn, challenge }: Props) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  if (!author) return null

  const links = author.links as Record<string, string> | null
  const activeLinks = links ? Object.entries(links).filter(([, v]) => v) : []
  const lColor = getLeagueColor(league)

  return (
    <aside
      className={cn(
        'w-64 shrink-0 sticky top-20 space-y-3 transition-all duration-500',
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      )}
    >
      {/* ── Card profil ── */}
      <div className="rounded-2xl border border-border overflow-hidden bg-card">
        {/* Avatar */}
        <div className="px-4 pt-4 pb-4">
          <div className="mb-3">
            <Avatar className="size-11 rounded-full border border-border shadow-sm">
              <AvatarImage src={author.avatar_url ?? undefined} />
              <AvatarFallback className="text-sm font-bold">
                {(author.username ?? '?')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link href={`/u/${author.username}`} className="text-sm font-bold hover:underline inline-flex items-center gap-1.5">
                @{author.username}
                <ProBadge plan={author.plan} />
              </Link>
              {isOwn && (
                <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Vous
                </span>
              )}
            </div>
            {author.full_name && (
              <p className="text-xs text-muted-foreground mt-0.5">{author.full_name}</p>
            )}
          </div>

          {/* Badges plan + XP */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {author.plan && (
              <span className={cn(
                'text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase',
                author.plan === 'pro'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}>
                {author.plan}
              </span>
            )}
            {author.xp != null && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                <Zap className="size-3 text-amber-500" />
                {author.xp.toLocaleString()} XP
              </span>
            )}
          </div>

          {/* Info rows */}
          <div className="rounded-xl bg-muted/40 px-3 py-1">
            <InfoRow
              label="Ligue"
              value={
                <span className="font-semibold" style={{ color: lColor }}>
                  {getLeagueLabel(league)}
                </span>
              }
            />
            {author.specialty && (
              <InfoRow label="Spécialité" value={author.specialty} />
            )}
          </div>
        </div>
      </div>

      {/* ── Card tools ── */}
      {author.tools && author.tools.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <Label>Outils</Label>
          <div className="flex flex-wrap gap-1.5">
            {author.tools.map(t => (
              <span key={t} className="text-[11px] bg-muted px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Card links ── */}
      {activeLinks.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <Label>Liens</Label>
          <div className="space-y-2">
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
        </div>
      )}

      {/* ── Card challenge ── */}
      {challenge && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <Label>Challenge</Label>
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
            Voir le challenge <ArrowRight className="size-3" />
          </Link>
        </div>
      )}

      {/* ── CTA profil ── */}
      <Link
        href={`/u/${author.username}`}
        className="flex items-center justify-center w-full h-9 rounded-full border border-border text-xs font-medium hover:bg-muted transition-colors"
      >
        Voir le profil →
      </Link>
    </aside>
  )
}
