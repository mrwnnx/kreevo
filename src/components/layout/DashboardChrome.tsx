import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Sidebar } from '@/components/layout/Sidebar'
import { FloatingNav } from '@/components/layout/FloatingNav'
import { getDict, getLang } from '@/lib/i18n/lang'
import type { Profile } from '@/types/database.types'

/**
 * Dashboard chrome (Sidebar + FloatingNav + offset main) usable OUTSIDE the
 * `(dashboard)` route group — e.g. on the public profile `/u/[username]` when a
 * logged-in viewer is browsing it, so they stay "inside" the platform.
 *
 * Mirrors the data fetch of `(dashboard)/layout.tsx` for the VIEWER (profile +
 * unread count + league icon). The small duplication is intentional and assumed
 * (the dashboard layout refactor is deferred — we do NOT touch it).
 *
 * Deliberately omits the onboarding tour, `<Toaster>` and `<TooltipProvider>`
 * (reserved to the dashboard layout; Sidebar/FloatingNav use neither tooltips
 * nor toasts). The Suspense wrappers are required because both nav components
 * call `useSearchParams`.
 *
 * Defensive: if the viewer profile can't be resolved, renders children bare.
 */
export async function DashboardChrome({
  viewerId,
  children,
}: {
  viewerId: string
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: profile } = await (supabase as any)
    .from('profiles').select('*').eq('id', viewerId).single()
  if (!profile) return <>{children}</>

  const [{ count: unreadCount }, { data: leagueRow }] = await Promise.all([
    (supabaseAdmin as any)
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', viewerId)
      .eq('is_read', false),
    (supabaseAdmin as any)
      .from('leagues')
      .select('icon')
      .ilike('name', (profile as any).league ?? 'Stone')
      .maybeSingle(),
  ])

  const [lang, dict] = await Promise.all([getLang(), getDict()])

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <Sidebar
          profile={profile as Profile}
          unreadCount={unreadCount ?? 0}
          leagueIcon={leagueRow?.icon ?? null}
          lang={lang}
          t={dict.header}
        />
      </Suspense>
      <Suspense fallback={null}>
        <FloatingNav
          profile={profile as Profile}
          lang={lang}
          t={dict.header}
          notifTypes={dict.notificationsPage.types}
        />
      </Suspense>
      <main className="sm:ps-72 min-h-screen">{children}</main>
    </div>
  )
}
