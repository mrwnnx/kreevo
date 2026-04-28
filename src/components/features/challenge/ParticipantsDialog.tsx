'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from '@/components/ui/avatar'
import { ProBadge } from '@/components/ui/ProBadge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Participant {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  plan?: string | null
}

export function ParticipantsDialog({
  participants,
  total,
  size = 'sm',
}: {
  participants: Participant[]
  total: number
  size?: 'sm' | 'default'
}) {
  const [open, setOpen] = useState(false)
  if (total === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full hover:bg-muted/60 transition-colors px-1 -mx-1"
      >
        <AvatarGroup data-size={size}>
          {participants.slice(0, 4).map((p) => (
            <Avatar key={p.id} size={size}>
              {p.avatar_url && <AvatarImage src={p.avatar_url} alt={p.username} />}
              <AvatarFallback>{p.username?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
            </Avatar>
          ))}
          {total > 4 && <AvatarGroupCount>+{total - 4}</AvatarGroupCount>}
        </AvatarGroup>
        <span className="text-sm">
          <strong className="font-semibold text-foreground">{total}</strong>{' '}
          <span className="text-muted-foreground">
            participant{total !== 1 ? 's' : ''}
          </span>
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {total} participant{total !== 1 ? 's' : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto -mx-2">
            <ul className="space-y-1">
              {participants.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/u/${p.username}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Avatar size="default">
                      {p.avatar_url && <AvatarImage src={p.avatar_url} alt={p.username} />}
                      <AvatarFallback>
                        {p.username?.[0]?.toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate inline-flex items-center gap-1.5">
                        {p.full_name ?? p.username}
                        <ProBadge plan={p.plan} />
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{p.username}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
