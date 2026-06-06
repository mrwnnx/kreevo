import type { Metadata } from 'next'
import { getDict, getLang } from '@/lib/i18n/lang'
import { createClient } from '@/lib/supabase/server'
import type { SpecialtyOption } from '@/components/onboarding/types'
import { OnboardingClient } from './OnboardingClient'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang()
  const title = lang === 'en' ? 'Set up your profile — Kreevo' : 'Configure ton profil — Kreevo'
  return {
    title,
    robots: { index: false, follow: true },
  }
}

export default async function OnboardingPage() {
  const [dict, lang, supabase] = await Promise.all([getDict(), getLang(), createClient()])

  // PHASE 5 — spécialités actives lues depuis la DB (RLS public_read is_active=true),
  // triées, localisées. Une spé créée par l'admin (PHASE 6) apparaît sans déploiement.
  const { data: rows } = await supabase
    .from('specialties')
    .select('id, slug, name_fr, name_en, name_ar, emoji')
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  const specialties: SpecialtyOption[] = (rows ?? []).map((s) => ({
    id: s.id,
    slug: s.slug,
    name: (lang === 'ar' ? s.name_ar : lang === 'en' ? s.name_en : s.name_fr) || s.slug,
    emoji: s.emoji ?? null,
  }))

  return <OnboardingClient t={dict.onboarding} specialties={specialties} />
}
