'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface Notification {
  id: string
  type: string
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
}

const TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  feedback_ready:    { emoji: '💬', label: 'Feedback publié sur ta soumission' },
  league_up:         { emoji: '🚀', label: 'Promotion de league !' },
  badge_earned:      { emoji: '🏅', label: 'Nouveau badge obtenu' },
  xp_deducted:       { emoji: '⬇️', label: 'XP déduit' },
  joined_challenge:  { emoji: '🎯', label: 'Tu as rejoint un challenge — 3 jours pour soumettre !' },
  deadline_missed:   { emoji: '❌', label: 'Deadline dépassée — participation close' },
  referral_completed:{ emoji: '🎁', label: 'Un ami a complété son 1er challenge — +50 XP' },
}

export function NotificationBell({ userId }: { userId: string }) {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  const fetchNotifs = useCallback(async () => {
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifs(data ?? [])
  }, [userId])

  useEffect(() => {
    fetchNotifs()
    const supabase = createClient()
    const channel = supabase
      .channel(`notifs-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, () => fetchNotifs())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, fetchNotifs])

  const unread = notifs.filter(n => !n.is_read).length

  const markAllRead = async () => {
    if (!unread) return
    const supabase = createClient()
    await (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open && unread) markAllRead() }}
        className="relative flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 size-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifs.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : notifs.slice(0, 10).map(n => {
                const meta = TYPE_LABELS[n.type] ?? { emoji: '🔔', label: n.type }
                return (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 ${!n.is_read ? 'bg-primary/5' : ''}`}
                  >
                    <span className="text-lg shrink-0 mt-0.5">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-snug">{meta.label}</p>
                      {!!n.data?.league && (
                        <p className="text-xs text-muted-foreground capitalize">{String(n.data['league'])}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="size-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                )
              })}
            </div>

            {notifs.length > 10 && (
              <div className="px-4 py-2.5 border-t border-border">
                <a href="/dashboard/notifications" className="text-xs text-primary hover:underline" onClick={() => setOpen(false)}>
                  View all notifications →
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
