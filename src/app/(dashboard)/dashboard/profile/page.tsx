import { createClient } from '@/lib/supabase/server'

import { ProfileForm } from './ProfileForm'
import type { Profile } from '@/types/database.types'
import type { SpecialtyOption } from '@/components/onboarding/types'
import { getDict, getLang } from '@/lib/i18n/lang'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: specRows }, dict, lang] = await Promise.all([
    (supabase as any).from('profiles').select('*').eq('id', user!.id).single(),
    // PHASE 6B — spécialités actives lues depuis la DB (RLS public_read is_active=true),
    // localisées, comme onboarding/page.tsx (PHASE 5).
    supabase
      .from('specialties')
      .select('id, slug, name_fr, name_en, name_ar, emoji')
      .eq('is_active', true)
      .order('order_index', { ascending: true }),
    getDict(),
    getLang(),
  ])

  const specialties: SpecialtyOption[] = (specRows ?? []).map((s) => ({
    id: s.id,
    slug: s.slug,
    name: (lang === 'ar' ? s.name_ar : lang === 'en' ? s.name_en : s.name_fr) || s.slug,
    emoji: s.emoji ?? null,
  }))

  return (
    <div className="pb-10">
      <div className="max-w-[520px] mx-auto px-6 py-8">
        <ProfileForm profile={profile as Profile} t={dict.profileForm} specialties={specialties} />
      </div>
    </div>
  )
}
