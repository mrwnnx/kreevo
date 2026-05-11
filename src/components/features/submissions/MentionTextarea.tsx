'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface MentionUser {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
}

interface Props {
  value: string
  onChange: (next: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  rows?: number
  maxLength?: number
  className?: string
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>
  ariaLabel?: string
}

/**
 * Detects if the cursor is currently inside a partial @mention.
 * Returns the @-start index and the partial query text (without the @), or null.
 */
function getMentionContext(value: string, cursor: number): { start: number; query: string } | null {
  if (cursor === 0) return null
  const before = value.slice(0, cursor)
  const at = before.lastIndexOf('@')
  if (at === -1) return null
  // The @ must be at start OR preceded by whitespace
  const charBefore = at === 0 ? ' ' : before[at - 1]
  if (!/\s/.test(charBefore)) return null
  const query = before.slice(at + 1)
  // No whitespace allowed inside the partial mention
  if (/\s/.test(query)) return null
  if (query.length > 30) return null
  return { start: at, query }
}

export function MentionTextarea({
  value,
  onChange,
  onKeyDown,
  placeholder,
  rows = 2,
  maxLength,
  className,
  textareaRef: externalRef,
  ariaLabel,
}: Props) {
  const internalRef = useRef<HTMLTextAreaElement>(null)
  const ref = externalRef ?? internalRef
  const [mention, setMention] = useState<{ start: number; query: string } | null>(null)
  const [users, setUsers] = useState<MentionUser[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const reqIdRef = useRef(0)

  // Detect mention context from cursor position
  function refreshMentionContext() {
    const el = ref.current
    if (!el) return
    const ctx = getMentionContext(el.value, el.selectionStart)
    setMention(ctx)
    if (!ctx) {
      setUsers([])
      setActiveIndex(0)
    }
  }

  // Fetch users when mention query changes
  useEffect(() => {
    if (!mention) return
    const q = mention.query
    if (q.length < 1) {
      setUsers([])
      return
    }
    const reqId = ++reqIdRef.current
    setLoading(true)
    const t = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => {
          if (reqId !== reqIdRef.current) return
          setUsers((data?.users ?? []).slice(0, 6))
          setActiveIndex(0)
        })
        .catch(() => {
          if (reqId !== reqIdRef.current) return
          setUsers([])
        })
        .finally(() => {
          if (reqId === reqIdRef.current) setLoading(false)
        })
    }, 150)
    return () => clearTimeout(t)
  }, [mention?.query])

  function selectUser(u: MentionUser) {
    if (!mention) return
    const el = ref.current
    if (!el) return
    const before = value.slice(0, mention.start)
    const after = value.slice(el.selectionStart)
    const insertion = `@${u.username} `
    const next = before + insertion + after
    onChange(next)
    // Move cursor right after the inserted mention
    const newCursor = before.length + insertion.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(newCursor, newCursor)
      setMention(null)
      setUsers([])
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mention && users.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % users.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + users.length) % users.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        selectUser(users[activeIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setMention(null)
        setUsers([])
        return
      }
    }
    onKeyDown?.(e)
  }

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          // Defer so the textarea value/selection have updated
          requestAnimationFrame(refreshMentionContext)
        }}
        onKeyUp={refreshMentionContext}
        onClick={refreshMentionContext}
        onBlur={() => {
          // Delay so click on dropdown item still registers
          setTimeout(() => setMention(null), 120)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        aria-label={ariaLabel}
        className={className}
      />

      {mention && (users.length > 0 || loading) && (
        <div className="absolute left-0 right-0 z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {loading && users.length === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-2">…</p>
          )}
          {users.map((u, i) => (
            <button
              key={u.id}
              type="button"
              onMouseDown={(e) => {
                // mousedown so we react before blur
                e.preventDefault()
                selectUser(u)
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors',
                i === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
              )}
            >
              <div className="size-6 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0">
                {u.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-zinc-500">
                    {u.username[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <span className="font-medium truncate">@{u.username}</span>
              {u.full_name && (
                <span className="text-xs text-muted-foreground truncate">{u.full_name}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
