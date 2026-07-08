import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SoloProject, type SoloChallenge } from '@/components/features/solo/SoloProject'
import { MovingGradientBackground } from '@/components/marketing/MovingGradientBackground'

export const metadata: Metadata = { title: 'Solo project · Kreevo' }

export default async function SoloPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let name: string | null = null
  if (user) {
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('first_name, full_name, username')
      .eq('id', user.id)
      .single()
    name =
      profile?.first_name?.trim() ||
      profile?.full_name?.trim()?.split(' ')[0] ||
      profile?.username ||
      null
  }

  // Draw pool: real published challenges (specialty slug + league tier for the ramp).
  const { data: rows } = await (supabaseAdmin as any)
    .from('challenges')
    .select('id, title, brief, emoji, xp_reward, deadline_days, specialties(slug), leagues(order_index)')
    .eq('is_published', true)

  const challenges: SoloChallenge[] = ((rows ?? []) as Record<string, any>[]).map((r) => ({
    id: r.id,
    title: r.title,
    brief: r.brief,
    emoji: r.emoji,
    xp: r.xp_reward,
    days: r.deadline_days,
    slug: r.specialties?.slug ?? null,
    order: r.leagues?.order_index ?? 99,
  }))

  return (
    <div className="relative min-h-screen">
      {/* Même fond animé que la page d'accueil (landing) */}
      <MovingGradientBackground />
      <div className="relative z-10">
        <SoloProject name={name} challenges={challenges} />
      </div>
    </div>
  )
}
