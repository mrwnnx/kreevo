import { createClient } from '@/lib/supabase/server'
import { getDict, getLang, type Lang } from '@/lib/i18n/lang'

import type { Profile } from '@/types/database.types'

function timeAgo(date: string, lang: Lang): string {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return lang === 'ar' ? 'الآن' : lang === 'en' ? 'just now' : 'à l\'instant'
  if (m < 60) return lang === 'ar' ? `منذ ${m} د` : lang === 'en' ? `${m}m ago` : `il y a ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return lang === 'ar' ? `منذ ${h} س` : lang === 'en' ? `${h}h ago` : `il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return lang === 'ar' ? `منذ ${d} يوم` : lang === 'en' ? `${d}d ago` : `il y a ${d}j`
  return new Date(date).toLocaleDateString(lang === 'ar' ? 'ar' : lang === 'en' ? 'en-US' : 'fr-FR')
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, notifRes] = await Promise.all([
    (supabase as any).from('profiles').select('*').eq('id', user!.id).single(),
    (supabase as any).from('notifications').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(100),
  ])

  const profile = profileRes.data as Profile
  void profile
  const notifications = notifRes.data ?? []

  // Mark all as read
  await (supabase as any)
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user!.id)
    .eq('is_read', false)

  const [dict, lang] = await Promise.all([getDict(), getLang()])
  const t = dict.notificationsPage

  return (
    <div className="pb-10">

      <div className="max-w-[960px] mx-auto px-6 py-8 space-y-6">

        {notifications.length === 0 ? (
          <div className="text-center py-24 space-y-3">
            <p className="text-4xl">{t.empty.icon}</p>
            <p className="text-muted-foreground">{t.empty.title}</p>
            <p className="text-xs text-muted-foreground">{t.empty.subtitle}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {notifications.map((n: any) => {
              const meta = t.types[n.type] ?? { emoji: '🔔', label: n.type }
              return (
                <div key={n.id} className={`flex gap-4 px-5 py-4 ${!n.is_read ? 'bg-primary/5' : 'bg-background'}`}>
                  <span className="text-xl shrink-0 mt-0.5">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{meta.label}</p>
                    {n.data?.league && (
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">
                        {dict.publicProfile.stats.league}: {String(n.data.league)}
                      </p>
                    )}
                    {n.data?.badge_type && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Badge: {String(n.data.badge_type).replace(/_/g, ' ')}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at, lang)}</p>
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
