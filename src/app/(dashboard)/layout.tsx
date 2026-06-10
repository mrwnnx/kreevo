import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FloatingNav } from '@/components/layout/FloatingNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { OnboardingTour, type TourStepData } from '@/components/onboarding/OnboardingTour'
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

  // Tour d'onboarding : flag + étapes ACTIVES depuis la DB (uniquement si pas encore vu).
  let tourSteps: TourStepData[] = []
  let tourEnabled = true
  if (!profile.tour_completed) {
    const [{ data: stepRows }, { data: flagRow }] = await Promise.all([
      (supabaseAdmin as any)
        .from('onboarding_steps')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true }),
      (supabaseAdmin as any)
        .from('settings')
        .select('value')
        .eq('key', 'onboarding_tour_enabled')
        .maybeSingle(),
    ])
    tourEnabled = flagRow?.value !== false // clé absente → activé (défaut)
    tourSteps = ((stepRows ?? []) as Record<string, any>[]).map((s) => ({
      id: s.id,
      name: s[`name_${lang}`] ?? s.name_en,
      title: s[`title_${lang}`] ?? s.title_en,
      description: s[`description_${lang}`] ?? s.description_en,
      image_url: s.image_url ?? null,
    }))
  }

  return (
    <TooltipProvider>
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
          <FloatingNav profile={profile as Profile} lang={lang} t={dict.header} notifTypes={dict.notificationsPage.types} />
        </Suspense>
        <main className="sm:ps-72 min-h-screen">{children}</main>
        {/* Tour de bienvenue (DB) — flag activé + non terminé + ≥1 étape active. */}
        {tourEnabled && !profile.tour_completed && tourSteps.length > 0 && (
          <OnboardingTour steps={tourSteps} t={dict.onboardingTour} />
        )}
        <Toaster position="bottom-right" />
      </div>
    </TooltipProvider>
  )
}
