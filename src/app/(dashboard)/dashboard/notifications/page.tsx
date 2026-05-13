import { createClient } from '@/lib/supabase/server'
import { getDict, getLang } from '@/lib/i18n/lang'

import type { Profile } from '@/types/database.types'
import { CoworkerInvitationCard } from '@/components/features/notifications/CoworkerInvitationCard'

function timeAgo(date: string, lang: 'fr' | 'en'): string {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return lang === 'en' ? 'just now' : 'à l\'instant'
  if (m < 60) return lang === 'en' ? `${m}m ago` : `il y a ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return lang === 'en' ? `${h}h ago` : `il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return lang === 'en' ? `${d}d ago` : `il y a ${d}j`
  return new Date(date).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR')
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

  // Resolve coworker invitations (current status + author profile) for any notif of that type.
  const inviteSubmissionIds = Array.from(
    new Set(
      notifications
        .filter((n: any) => n.type === 'coworker_invitation_received' && typeof n.data?.submission_id === 'string')
        .map((n: any) => n.data.submission_id as string),
    ),
  )
  type InviteRow = { id: string; submission_id: string; status: 'pending' | 'accepted' | 'declined'; invited_by: string; profiles: any; submission: { id: string; title: string | null } | null }
  let inviteByKey = new Map<string, InviteRow>()
  if (inviteSubmissionIds.length > 0) {
    const { data: inviteRows } = await (supabase as any)
      .from('submission_coworkers')
      .select('id, submission_id, status, invited_by, profiles:invited_by(id, username, full_name, avatar_url), submission:submission_id(id, title)')
      .eq('user_id', user!.id)
      .in('submission_id', inviteSubmissionIds)
    inviteByKey = new Map(
      ((inviteRows ?? []) as InviteRow[]).map((r) => [r.submission_id, r]),
    )
  }

  // Mark all as read
  await (supabase as any)
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user!.id)
    .eq('is_read', false)

  const [dict, lang] = await Promise.all([getDict(), getLang()])
  const t = dict.notificationsPage as typeof dict.notificationsPage & { coworker: any }

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

              if (n.type === 'coworker_invitation_received') {
                const invite = inviteByKey.get(n.data?.submission_id)
                if (!invite) {
                  // Invitation row no longer exists (e.g. author removed the coworker before they responded).
                  return (
                    <div key={n.id} className={`flex gap-4 px-5 py-4 ${!n.is_read ? 'bg-primary/5' : 'bg-background'}`}>
                      <span className="text-xl shrink-0 mt-0.5">{meta.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{meta.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at, lang)}</p>
                      </div>
                    </div>
                  )
                }
                return (
                  <CoworkerInvitationCard
                    key={n.id}
                    invitationId={invite.id}
                    status={invite.status}
                    submissionId={invite.submission_id}
                    author={invite.profiles ?? null}
                    submissionTitle={invite.submission?.title ?? (n.data?.title ?? null)}
                    createdAtLabel={timeAgo(n.created_at, lang)}
                    unread={!n.is_read}
                    t={t.coworker}
                    emoji={meta.emoji}
                    label={meta.label}
                  />
                )
              }

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
