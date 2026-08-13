import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GlassShell } from '@/components/layout/GlassShell'
import { GlassHeader } from '@/components/layout/GlassHeader'
import { OnboardingTour, type TourStepData } from '@/components/onboarding/OnboardingTour'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from 'sonner'
import { getDict, getLang } from '@/lib/i18n/lang'
import { supabaseAdmin } from '@/lib/supabase/admin'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

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
      <GlassShell>
        <Suspense fallback={null}>
          <GlassHeader />
        </Suspense>
        <main className="min-h-screen">{children}</main>
        {/* Tour de bienvenue (DB) — flag activé + non terminé + ≥1 étape active. */}
        {tourEnabled && !profile.tour_completed && tourSteps.length > 0 && (
          <OnboardingTour steps={tourSteps} t={dict.onboardingTour} />
        )}
        <Toaster position="bottom-right" />
      </GlassShell>
    </TooltipProvider>
  )
}
