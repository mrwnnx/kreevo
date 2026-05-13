'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Shield, X } from 'lucide-react'

interface Blocked {
  id: string
  created_at: string
  profiles: { id: string; username: string; full_name: string | null; avatar_url: string | null } | null
}

interface Props {
  t: {
    title: string
    description: string
    emptyTitle: string
    emptyBody: string
    unblock: string
  }
}

export function BlockedUsersSection({ t }: Props) {
  const [blocks, setBlocks] = useState<Blocked[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const res = await fetch('/api/user-blocks')
      const data = await res.json()
      setBlocks(data.blocks ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function unblock(blockedId: string) {
    await fetch(`/api/user-blocks?blockedId=${encodeURIComponent(blockedId)}`, { method: 'DELETE' })
    setBlocks((prev) => prev.filter((b) => b.profiles?.id !== blockedId))
  }

  return (
    <section className="rounded-[24px] border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center">
          <Shield className="size-5 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold">{t.title}</h2>
          <p className="text-xs text-muted-foreground">{t.description}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">…</p>
      ) : blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-1">
          <p className="text-sm font-medium">{t.emptyTitle}</p>
          <p className="text-xs text-muted-foreground">{t.emptyBody}</p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {blocks.map((b) => {
            const p = b.profiles
            if (!p) return null
            return (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar size="sm">
                  {p.avatar_url && <AvatarImage src={p.avatar_url} alt={p.username} />}
                  <AvatarFallback>{p.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Link href={`/u/${p.username}`} className="text-sm font-medium hover:underline">
                    @{p.username}
                  </Link>
                  {p.full_name && (
                    <p className="text-xs text-muted-foreground truncate">{p.full_name}</p>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => unblock(p.id)}>
                  <X className="size-3 mr-1" />
                  {t.unblock}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
