// PHASE 4 — résolution de la spécialité (texte) vers la FK specialties.id.
//
// Les challenges portent un `specialty` texte legacy ('UX Designer' / 'UI Designer'
// / 'Graphic Designer'). Le modèle scopé (PHASE 1-3) s'appuie sur `specialty_id`
// (FK). À la création/édition admin on résout le texte → slug → UUID (par requête,
// jamais de UUID en dur) pour qu'aucun nouveau challenge ne reste specialty_id NULL
// (sinon il deviendrait imparticipable avec le garde-fou PHASE 4).

export type SpecialtySlug = 'ux_ui' | 'graphic'

export type SpecialtyMismatch = 'NO_SPECIALTY' | 'WRONG_SPECIALTY'

// PHASE 4 — garde-fou cross-spé partagé par TOUS les chemins serveur (participation,
// soumission, analyse). Source unique, pas de logique dupliquée.
//   - profil sans specialty_id            → 'NO_SPECIALTY'  (doit choisir sa spé)
//   - challenge d'une autre spé que le user → 'WRONG_SPECIALTY'
//   - sinon                                → null (autorisé)
export function specialtyMismatch(
  profileSpecialtyId: string | null | undefined,
  challengeSpecialtyId: string | null | undefined,
): SpecialtyMismatch | null {
  if (!profileSpecialtyId) return 'NO_SPECIALTY'
  if (challengeSpecialtyId !== profileSpecialtyId) return 'WRONG_SPECIALTY'
  return null
}

// Messages serveur (FR) associés aux codes, réutilisés par les routes/actions.
export const SPECIALTY_GUARD_MESSAGE: Record<SpecialtyMismatch, string> = {
  WRONG_SPECIALTY: 'Ce challenge appartient à une autre spécialité que la tienne.',
  NO_SPECIALTY: 'Choisis ta spécialité pour participer aux challenges.',
}

// Mapping texte → slug canonique.
//   'UX Designer' / 'UI Designer' → ux_ui
//   'Graphic Designer'            → graphic
// Fallback regex pour tolérer des variantes proches ('UX/UI', 'Graphic', …).
export function specialtyTextToSlug(text: string | null | undefined): SpecialtySlug | null {
  if (!text) return null
  const t = text.trim().toLowerCase()
  if (!t) return null
  if (/graphic/.test(t)) return 'graphic'
  if (/ux|ui/.test(t)) return 'ux_ui'
  return null
}

/**
 * Résout un `specialty` texte vers `{ id }` (specialties.id) via la table specialties.
 * Retourne `{ error }` si le texte ne matche aucune spé connue ou si le slug est
 * introuvable en base — pour que l'appelant REFUSE plutôt que d'écrire NULL.
 */
export async function resolveSpecialtyId(
  text: string | null | undefined,
  supabase: { from: (t: string) => any },
): Promise<{ id: string } | { error: string }> {
  const slug = specialtyTextToSlug(text)
  if (!slug) {
    return { error: `Spécialité inconnue : « ${text ?? ''} ». Attendu UX/UI ou Graphic.` }
  }
  const { data } = await supabase
    .from('specialties')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (!data?.id) {
    return { error: `Spécialité « ${slug} » introuvable dans la table specialties.` }
  }
  return { id: data.id as string }
}
