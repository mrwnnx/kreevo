'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Author {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
}

interface Props {
  invitationId: string
  status: 'pending' | 'accepted' | 'declined'
  submissionId: string
  author: Author | null
  submissionTitle: string | null
  createdAtLabel: string
  unread: boolean
  t: {
    invitedYou: string
    accept: string
    decline: string
    accepted: string
    declined: string
    xpAwardedHint: string
    genericError: string
  }
  emoji: string
  label: string
}

export function CoworkerInvitationCard({
  invitationId,
  status: initialStatus,
  submissionId,
  author,
  submissionTitle,
  createdAtLabel,
  unread,
  t,
  emoji,
  label,
}: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [xpAwarded, setXpAwarded] = useState(0)

  async function respond(action: 'accept' | 'decline') {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/coworker-invitations/${invitationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? t.genericError)
        setPending(false)
        return
      }
      setStatus(data.status)
      setXpAwarded(data.xpAwarded ?? 0)
      router.refresh()
    } catch {
      setError(t.genericError)
    } finally {
      setPending(false)
    }
  }

  const authorName = author?.username ?? '—'

  return (
    <div className={`px-5 py-4 ${unread ? 'bg-primary/5' : 'bg-background'}`}>
      <div className="flex gap-4">
        <span className="text-xl shrink-0 mt-0.5">{emoji}</span>
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-sm text-muted-foreground">
              {author ? (
                <Link href={`/u/${author.username}`} className="font-medium text-foreground hover:underline">
                  @{authorName}
                </Link>
              ) : (
                <span className="font-medium text-foreground">@{authorName}</span>
              )}{' '}
              {t.invitedYou}
              {submissionTitle ? (
                <>
                  {' — '}
                  <Link href={`/dashboard/submissions/${submissionId}`} className="hover:underline">
                    « {submissionTitle} »
                  </Link>
                </>
              ) : null}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{createdAtLabel}</p>
          </div>

          {status === 'pending' && (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" disabled={pending} onClick={() => respond('accept')}>
                {t.accept}
              </Button>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => respond('decline')}>
                {t.decline}
              </Button>
              {error && <span className="text-xs text-rose-500">{error}</span>}
            </div>
          )}

          {status === 'accepted' && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <span>✓ {t.accepted}</span>
              {xpAwarded > 0 && (
                <span className="text-xs text-muted-foreground">
                  {t.xpAwardedHint.replace('{xp}', String(xpAwarded))}
                </span>
              )}
            </div>
          )}

          {status === 'declined' && (
            <div className="text-sm text-muted-foreground">↩ {t.declined}</div>
          )}
        </div>
        {unread && <div className="size-2 rounded-full bg-primary shrink-0 mt-2" />}
      </div>
    </div>
  )
}
