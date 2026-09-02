import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { Lang } from '@/lib/i18n/tx'
import type { TaxonomyOption } from './BriefForm'

interface LocalizedRow {
  id: string
  name_fr: string | null
  name_en: string | null
  name_ar: string | null
}

function localize(row: LocalizedRow, lang: Lang): string {
  return (lang === 'ar' ? row.name_ar : lang === 'en' ? row.name_en : row.name_fr) || ''
}

/**
 * Charge les trois listes de taxonomie du formulaire de brief (spécialité,
 * industrie, type de projet), localisées dans la langue courante, ainsi que
 * les ligues actives (nom unique, pas de traduction — ciblage de publication).
 * Partagé par `briefs/new` et `briefs/[id]/edit` — mêmes requêtes, même mise
 * en forme. Colonnes explicites, jamais `select('*')`.
 */
export async function loadBriefTaxonomy(
  supabase: SupabaseClient<Database>,
  lang: Lang,
): Promise<{
  specialties: TaxonomyOption[]
  industries: TaxonomyOption[]
  projectTypes: TaxonomyOption[]
  leagues: TaxonomyOption[]
}> {
  const [specialtiesRes, industriesRes, typesRes, leaguesRes] = await Promise.all([
    supabase
      .from('specialties')
      .select('id, name_fr, name_en, name_ar')
      .eq('is_active', true)
      .order('order_index'),
    supabase.from('industries').select('id, name_fr, name_en, name_ar').order('display_order'),
    supabase.from('challenge_types').select('id, name_fr, name_en, name_ar').order('display_order'),
    supabase.from('leagues').select('id, name').eq('is_active', true).order('order_index'),
  ])

  const toOptions = (rows: LocalizedRow[] | null): TaxonomyOption[] =>
    (rows ?? []).map((r) => ({ id: r.id, name: localize(r, lang) })).filter((o) => o.name)

  return {
    specialties: toOptions(specialtiesRes.data),
    industries: toOptions(industriesRes.data),
    projectTypes: toOptions(typesRes.data),
    leagues: (leaguesRes.data ?? []).map((l) => ({ id: l.id, name: l.name })),
  }
}
