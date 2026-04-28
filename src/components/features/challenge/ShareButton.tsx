'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ShareButton({ url, label = 'Partager' }: { url?: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '')

    // Try Web Share API first (mobile)
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({ url: shareUrl })
        return
      } catch {
        // user cancelled or unsupported — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors',
      )}
      title={label}
      aria-label={label}
    >
      {copied ? <Check className="size-3.5 text-green-500" /> : <Share2 className="size-3.5" />}
    </button>
  )
}
