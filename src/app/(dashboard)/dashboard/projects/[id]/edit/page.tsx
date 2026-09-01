import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import { ProjectForm } from '@/components/features/portfolio/ProjectForm'
import type { ProjectFormInitial } from '@/components/features/portfolio/ProjectForm'
import type { SpecialtyOption } from '@/components/onboarding/types'
import { SUBMISSION_KIND_PORTFOLIO } from '@/lib/utils/submission-constants'
import { getDict, getLang } from '@/lib/i18n/lang'

interface Params {
  params: Promise<{ id: string }>
}

export default async function EditProjectPage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Ownership + kind, filtered at the query level (not checked after the
  // fact): a row that isn't this user's portfolio project simply doesn't
  // match, so it 404s exactly like a missing id — never a 403, which would
  // confirm to a curious visitor that the id exists.
  const [
    { data: project },
    { data: profile },
    { data: specialtyRows },
    { data: industryRows },
    { data: projectTypeRows },
    lang,
    dict,
  ] = await Promise.all([
    supabase
      .from('submissions')
      .select('id, cover_url, title, description, files, specialty_id, industry_id, project_type_id, tools, is_draft, is_visible')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('kind', SUBMISSION_KIND_PORTFOLIO)
      .maybeSingle(),
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

  if (!project) notFound()

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

  // `files` holds { link?: string; images?: { url, caption }[] } — the same
  // shape saveProject() writes. Parsed defensively since it's a Json column.
  const files = (project.files ?? {}) as { link?: unknown; images?: unknown }
  const link = typeof files.link === 'string' ? files.link : ''
  const photos = Array.isArray(files.images)
    ? files.images
        .map((p) => ({ url: String((p as any)?.url ?? ''), caption: String((p as any)?.caption ?? '') }))
        .filter((p) => p.url)
    : []

  const initial: ProjectFormInitial = {
    id: project.id,
    coverUrl: project.cover_url,
    photos,
    title: project.title ?? '',
    description: project.description ?? '',
    link,
    specialtyId: project.specialty_id ?? '',
    industryId: project.industry_id ?? '',
    projectTypeId: project.project_type_id ?? '',
    tools: project.tools ?? [],
    isPublished: !project.is_draft,
  }

  return (
    <ProjectForm
      specialties={specialties}
      industries={industries}
      projectTypes={projectTypes}
      profileUsername={profile?.username ?? null}
      t={dict.projectForm}
      initial={initial}
    />
  )
}
