'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * saveCompany — crée ou met à jour la fiche entreprise du compte connecté (upsert
 * par owner_id, unique en base). RLS (`companies_owner_insert`/`companies_owner_write`)
 * exige déjà role='b2b' et owner_id=auth.uid() — cette action ne fait qu'appliquer
 * les mêmes règles côté client. Erreurs renvoyées en codes, traduits par l'appelant.
 */
export async function saveCompany(formData: FormData): Promise<
  { ok: true; id: string } | { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  const name = ((formData.get('name') as string | null) ?? '').trim()
  const logoUrl = ((formData.get('logoUrl') as string | null) ?? '').trim()
  const description = ((formData.get('description') as string | null) ?? '').trim() || null
  const websiteUrl = ((formData.get('websiteUrl') as string | null) ?? '').trim() || null
  const location = ((formData.get('location') as string | null) ?? '').trim() || null

  if (!name) return { ok: false, error: 'name_required' }
  if (!logoUrl) return { ok: false, error: 'logo_required' }

  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (existing) {
    // UPDATE dont le WHERE ne matche rien renvoie 204 sans erreur — on vérifie
    // qu'une ligne a bien été touchée avant de conclure au succès.
    const { data, error } = await supabase
      .from('companies')
      .update({
        name,
        logo_url: logoUrl,
        description,
        website_url: websiteUrl,
        location,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id')

    if (error || !data || data.length === 0) return { ok: false, error: 'save_failed' }
    revalidatePath('/company')
    return { ok: true, id: data[0].id }
  }

  const { data, error } = await supabase
    .from('companies')
    .insert({
      owner_id: user.id,
      name,
      logo_url: logoUrl,
      description,
      website_url: websiteUrl,
      location,
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: 'save_failed' }
  revalidatePath('/company')
  return { ok: true, id: data.id }
}
