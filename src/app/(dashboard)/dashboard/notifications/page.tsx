import { createClient } from '@/lib/supabase/server'

import type { Profile } from '@/types/database.types'

const TYPE_META: Record<string, { emoji: string; label: string }> = {
  feedback_ready:    { emoji: '💬', label: 'Feedback publié sur ta soumission' },
  league_up:         { emoji: '🚀', label: 'Promotion de league !' },
  league_down:       { emoji: '📉', label: 'Rétrogradation de league' },
  badge_earned:      { emoji: '🏅', label: 'Nouveau badge obtenu' },
  warning_inactivity:{ emoji: '⚠️', label: 'Avertissement d\'inactivité — soumets pour conserver ta ligue' },
  xp_deducted:       { emoji: '⬇️', label: 'XP déduit pour inactivité' },
  xp_penalty:        { emoji: '⬇️', label: 'Pénalité XP — inactivité 60 jours' },
  joined_challenge:  { emoji: '🎯', label: 'Challenge rejoint — 3 jours pour soumettre' },
  deadline_missed:   { emoji: '❌', label: 'Deadline personnelle manquée — -50 XP' },
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(date).toLocaleDateString()
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, notifRes] = await Promise.all([
    (supabase as any).from('profiles').select('*').eq('id', user!.id).single(),
    (supabase as any).from('notifications').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(100),
  ])

  const profile = profileRes.data as Profile
  const notifications = notifRes.data ?? []

  // Mark all as read
  await (supabase as any)
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user!.id)
    .eq('is_read', false)

  return (
    <div className="pb-10">
      
      <div className="max-w-[960px] mx-auto px-6 py-8 space-y-6">

        {notifications.length === 0 ? (
          <div className="text-center py-24 space-y-3">
            <p className="text-4xl">🔔</p>
            <p className="text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground">Activity like likes, comments, and badge awards will appear here.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {notifications.map((n: any) => {
              const meta = TYPE_META[n.type] ?? { emoji: '🔔', label: n.type }
              return (
                <div key={n.id} className={`flex gap-4 px-5 py-4 ${!n.is_read ? 'bg-primary/5' : 'bg-background'}`}>
                  <span className="text-xl shrink-0 mt-0.5">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{meta.label}</p>
                    {n.data?.league && (
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">
                        League: {String(n.data.league)}
                      </p>
                    )}
                    {n.data?.badge_type && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Badge: {String(n.data.badge_type).replace(/_/g, ' ')}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <div className="size-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
