'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GripVertical, Pin, PinOff, ChevronUp, ChevronDown, Loader2, ListOrdered } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SubmissionKind } from '@/lib/utils/submission-constants'

// NOTE: never import from '@/lib/utils/submissions' here — it instantiates
// the Anthropic SDK at module top-level, which breaks this client bundle
// (see src/components/features/portfolio/actions.ts for the same note).

export interface OrganizerItem {
  id: string
  title: string
  coverUrl: string | null
  kind: SubmissionKind
  pinned: boolean
}

interface OrganizeText {
  toggle: string
  done: string
  cancel: string
  pin: string
  unpin: string
  pinnedLabel: string
  moveUp: string
  moveDown: string
  error: string
}

/**
 * Owner-only "Organize" mode for `/u/[username]`'s showcase grid.
 *
 * Renders `children` (the existing read-only track-filtered grid) unchanged
 * until the owner flips the switch, at which point it takes over with a
 * reorderable grid — drag-and-drop plus up/down arrows (the arrows are the
 * real interaction on mobile, where drag is unreliable, not just a decorative
 * fallback). "Terminer" sends the whole order in one PATCH to
 * `/api/projects/order`; "Annuler" discards local changes.
 *
 * Only one project can be pinned — clicking a pin toggles it; picking a
 * different one moves the pin. Local-only until saved.
 */
export function PortfolioOrganizer({
  items,
  t,
  children,
}: {
  items: OrganizerItem[]
  t: OrganizeText
  children: React.ReactNode
}) {
  const router = useRouter()
  const [organizing, setOrganizing] = useState(false)
  const [order, setOrder] = useState<OrganizerItem[]>(items)
  const [pinnedId, setPinnedId] = useState<string | null>(items.find((i) => i.pinned)?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  function startOrganizing() {
    setOrder(items)
    setPinnedId(items.find((i) => i.pinned)?.id ?? null)
    setError(null)
    setOrganizing(true)
  }

  function cancel() {
    setOrganizing(false)
    setError(null)
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= order.length) return
    setOrder((prev) => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function onDrop(index: number) {
    setOrder((prev) => {
      if (dragIndex === null || dragIndex === index) return prev
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      return next
    })
    setDragIndex(null)
  }

  function togglePin(id: string) {
    setPinnedId((prev) => (prev === id ? null : id))
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/projects/order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: order.map((item, index) => ({ id: item.id, position: index + 1 })),
          pinnedId,
        }),
      })
      if (!res.ok) throw new Error('save failed')
      setOrganizing(false)
      router.refresh()
    } catch {
      setError(t.error)
    } finally {
      setSaving(false)
    }
  }

  if (!organizing) {
    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={startOrganizing}>
            <ListOrdered className="size-3.5" />
            {t.toggle}
          </Button>
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex items-center gap-2 ms-auto">
          <Button type="button" variant="ghost" size="sm" onClick={cancel} disabled={saving}>
            {t.cancel}
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={saving}>
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            {t.done}
          </Button>
        </div>
      </div>

      <ul className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {order.map((item, index) => {
          const isPinned = pinnedId === item.id
          return (
            <li
              key={item.id}
              draggable
              onDragStart={(e) => {
                setDragIndex(index)
                // Firefox refuses to start a drag at all unless dataTransfer
                // carries data set during dragstart — the value itself is
                // unused (state already tracks the source index).
                e.dataTransfer.setData('text/plain', String(index))
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
              }}
              onDrop={() => onDrop(index)}
              className={cn(
                'relative border rounded-xl overflow-hidden bg-background transition-colors',
                isPinned ? 'border-primary' : 'border-border'
              )}
            >
              <div className="relative aspect-video bg-muted cursor-grab active:cursor-grabbing">
                {item.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">—</div>
                )}
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-1.5">
                  <span className="flex items-center justify-center size-7 rounded-full bg-background/90 backdrop-blur-sm text-muted-foreground">
                    <GripVertical className="size-3.5" />
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePin(item.id)}
                    aria-pressed={isPinned}
                    title={isPinned ? t.unpin : t.pin}
                    className={cn(
                      'flex items-center justify-center size-7 rounded-full backdrop-blur-sm transition-colors',
                      isPinned
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background/90 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {isPinned ? <Pin className="size-3.5" /> : <PinOff className="size-3.5" />}
                  </button>
                </div>
                {isPinned && (
                  <span className="absolute bottom-1.5 start-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                    {t.pinnedLabel}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                <p className="text-xs font-medium truncate flex-1">{item.title || '—'}</p>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={t.moveUp}
                    title={t.moveUp}
                    className="flex items-center justify-center size-6 rounded-md border border-border text-muted-foreground disabled:opacity-30 hover:text-foreground"
                  >
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === order.length - 1}
                    aria-label={t.moveDown}
                    title={t.moveDown}
                    className="flex items-center justify-center size-6 rounded-md border border-border text-muted-foreground disabled:opacity-30 hover:text-foreground"
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
