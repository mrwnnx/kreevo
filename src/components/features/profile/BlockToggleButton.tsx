'use client'

import { useState } from 'react'
import { Shield, ShieldOff } from 'lucide-react'

interface Props {
  targetUserId: string
  initialBlocked: boolean
  labels: {
    block: string
    blocked: string
    confirm: string
  }
}

export function BlockToggleButton({ targetUserId, initialBlocked, labels }: Props) {
  const [blocked, setBlocked] = useState(initialBlocked)
  const [pending, setPending] = useState(false)

  async function toggle() {
    if (pending) return
    if (!blocked && !confirm(labels.confirm)) return
    setPending(true)
    try {
      if (blocked) {
        await fetch(`/api/user-blocks?blockedId=${encodeURIComponent(targetUserId)}`, { method: 'DELETE' })
        setBlocked(false)
      } else {
        await fetch('/api/user-blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blockedId: targetUserId }),
        })
        setBlocked(true)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md transition-colors border ${
        blocked
          ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/15'
          : 'border-border hover:bg-muted text-muted-foreground'
      } disabled:opacity-60`}
      title={blocked ? labels.blocked : labels.block}
    >
      {blocked ? <ShieldOff className="size-3.5" /> : <Shield className="size-3.5" />}
      {blocked ? labels.blocked : labels.block}
    </button>
  )
}
