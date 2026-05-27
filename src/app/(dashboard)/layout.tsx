import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FloatingNav } from '@/components/layout/FloatingNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from 'sonner'
import type { Profile } from '@/types/database.types'
import { getDict, getLang } from '@/lib/i18n/lang'
import { supabaseAdmin } from '@/lib/supabase/admin'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const [{ count: unreadCount }, { data: leagueRow }] = await Promise.all([
    (supabaseAdmin as any)
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false),
    (supabaseAdmin as any)
      .from('leagues')
      .select('icon')
      .ilike('name', (profile as any).league ?? 'Stone')
      .maybeSingle(),
  ])

  const [lang, dict] = await Promise.all([getLang(), getDict()])

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Sidebar
          profile={profile as Profile}
          unreadCount={unreadCount ?? 0}
          leagueIcon={leagueRow?.icon ?? null}
          lang={lang}
          t={dict.header}
        />
        <FloatingNav profile={profile as Profile} lang={lang} t={dict.header} notifTypes={dict.notificationsPage.types} />
        <main className="sm:pl-72 min-h-screen">{children}</main>
        <Toaster position="bottom-right" />
      </div>
    </TooltipProvider>
  )
}
