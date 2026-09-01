'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * saveBrief — crée ou met à jour un brief à l'état de brouillon. RLS
 * (`briefs_owner_write`/`briefs_owner_update`) exige déjà role='b2b' et une
 * `company_id` appartenant à l'appelant — cette action applique les mêmes règles
 * côté client, et double-vérifie par `.eq('company_id', ...)` + `.select('id')`
 * plutôt que de conclure au succès sur l'absence d'erreur (un UPDATE qui ne
 * matche aucune ligne renvoie 204 sans erreur).
 *
 * Piège connu de ce chantier : un <select> non rempli poste '' — jamais un uuid
 * valide. Les trois colonnes de taxonomie sont coercées explicitement en null.
 * Un brouillon n'exige rien : tous les champs texte deviennent null s'ils sont
 * vides, ce qui correspond à des colonnes texte nullables.
 */
export async function saveBrief(formData: FormData): Promise<
  { ok: true; id: string } | { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!company) return { ok: false, error: 'no_company' }

  const id = ((formData.get('id') as string | null) ?? '').trim() || null

  const str = (key: string) => {
    const v = ((formData.get(key) as string | null) ?? '').trim()
    return v || null
  }

  const payload = {
    title: str('title'),
    context: str('context'),
    brief: str('brief'),
    constraints: str('constraints'),
    criteria: str('criteria'),
    deliverable: str('deliverable'),
    // Les 3 colonnes uuid nullables — jamais '' en base, seul '' peut matcher ici.
    specialty_id: str('specialtyId'),
    industry_id: str('industryId'),
    project_type_id: str('projectTypeId'),
  }

  if (id) {
    const { data, error } = await supabase
      .from('briefs')
      .update(payload)
      .eq('id', id)
      .eq('company_id', company.id)
      .select('id')

    if (error || !data || data.length === 0) return { ok: false, error: 'not_found' }
    revalidatePath('/company/briefs')
    revalidatePath(`/company/briefs/${id}/edit`)
    return { ok: true, id }
  }

  const { data, error } = await supabase
    .from('briefs')
    .insert({ ...payload, company_id: company.id })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: 'save_failed' }
  revalidatePath('/company/briefs')
  return { ok: true, id: data.id }
}
