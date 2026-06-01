/**
 * Read-side helper for the challenge taxonomy (types / industries).
 *
 * Resolves a challenge's type / industry label for a given UI locale via the
 * FK (challenge_type_id / industry_id): validated localized name → name_fr.
 * The reference-table fetch is wrapped, so a missing table yields empty maps
 * and the label resolves to '' (the legacy text columns are no longer read).
 */

import { supabaseAdmin } from '@/lib/supabase/admin'

export type ChallengeLang = 'fr' | 'en' | 'ar'

interface TaxoRow {
  id: string
  name_fr: string | null
  name_en: string | null
  name_ar: string | null
  translation_status: Record<string, string> | null
}

export interface TaxonomyMaps {
  types: Map<string, TaxoRow>
  industries: Map<string, TaxoRow>
}

const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0

/** Fetch the taxonomy tables into id→row maps. Empty maps if not yet migrated. */
export async function getTaxonomyMaps(): Promise<TaxonomyMaps> {
  const empty: TaxonomyMaps = { types: new Map(), industries: new Map() }
  try {
    const [typesRes, indRes] = await Promise.all([
      (supabaseAdmin as any).from('challenge_types').select('id, name_fr, name_en, name_ar, translation_status'),
      (supabaseAdmin as any).from('industries').select('id, name_fr, name_en, name_ar, translation_status'),
    ])
    if (typesRes.error || indRes.error) return empty
    const types = new Map<string, TaxoRow>()
    for (const r of (typesRes.data ?? []) as TaxoRow[]) types.set(r.id, r)
    const industries = new Map<string, TaxoRow>()
    for (const r of (indRes.data ?? []) as TaxoRow[]) industries.set(r.id, r)
    return { types, industries }
  } catch {
    return empty
  }
}

function resolveRef(ref: TaxoRow | undefined, lang: ChallengeLang): string {
  if (!ref) return ''
  const localized = ref[`name_${lang}` as 'name_fr' | 'name_en' | 'name_ar']
  const status = ref.translation_status?.[lang]
  if (status === 'validated' && nonEmpty(localized)) return localized
  return nonEmpty(ref.name_fr) ? ref.name_fr : ''
}

/** Localized challenge type label, resolved from the FK (validated localized → name_fr). */
export function localizeType(row: Record<string, any>, lang: ChallengeLang, maps: TaxonomyMaps): string {
  const ref = row?.challenge_type_id ? maps.types.get(row.challenge_type_id) : undefined
  return resolveRef(ref, lang)
}

/** Localized industry label, resolved from the FK (validated localized → name_fr). */
export function localizeIndustry(row: Record<string, any>, lang: ChallengeLang, maps: TaxonomyMaps): string {
  const ref = row?.industry_id ? maps.industries.get(row.industry_id) : undefined
  return resolveRef(ref, lang)
}
