import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { ProjectForm } from '@/components/features/portfolio/ProjectForm'
import type { SpecialtyOption } from '@/components/onboarding/types'
import { getDict, getLang } from '@/lib/i18n/lang'

export default async function NewProjectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: specialtyRows },
    { data: industryRows },
    { data: projectTypeRows },
    lang,
    dict,
  ] = await Promise.all([
    supabase.from('profiles').select('username').eq('id', user.id).single(),
    supabase
      .from('specialties')
      .select('id, slug, name_fr, name_en, name_ar, emoji')
      .eq('is_active', true)
      .order('order_index', { ascending: true }),
    supabase
      .from('industries')
      .select('id, name_fr, name_en, name_ar')
      .order('display_order', { ascending: true }),
    supabase
      .from('challenge_types')
      .select('id, name_fr, name_en, name_ar')
      .order('display_order', { ascending: true }),
    getLang(),
    getDict(),
  ])

  const localize = (row: { name_fr: string | null; name_en: string | null; name_ar: string | null }) =>
    (lang === 'ar' ? row.name_ar : lang === 'en' ? row.name_en : row.name_fr) || row.name_fr || ''

  const specialties: SpecialtyOption[] = (specialtyRows ?? []).map((s) => ({
    id: s.id,
    slug: s.slug,
    name: (lang === 'ar' ? s.name_ar : lang === 'en' ? s.name_en : s.name_fr) || s.slug,
    emoji: s.emoji ?? null,
  }))
  const industries = (industryRows ?? []).map((i) => ({ id: i.id, name: localize(i) }))
  const projectTypes = (projectTypeRows ?? []).map((p) => ({ id: p.id, name: localize(p) }))

  return (
    <ProjectForm
      specialties={specialties}
      industries={industries}
      projectTypes={projectTypes}
      profileUsername={profile?.username ?? null}
      t={dict.projectForm}
    />
  )
}
