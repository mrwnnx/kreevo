/**
 * Client-safe `{var}` interpolation helper.
 * Lives in its own module so client components can import it without
 * pulling in `next/headers` (server-only).
 *
 * @example tx('Hello {name}', { name: 'Marwen' }) → 'Hello Marwen'
 */
export function tx(
  template: string,
  params: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ''))
}

/** Re-export Lang type for client components. */
export type Lang = 'fr' | 'en' | 'ar'

/** Ligne de taxonomie traduite en base (specialties, industries, challenge_types…). */
export interface LocalizedNameRow {
  name_fr?: string | null
  name_en?: string | null
  name_ar?: string | null
}

/**
 * Nom d'une ligne de taxonomie dans la langue demandée, **avec repli**.
 *
 * Le seed `003` n'a rempli que `name_fr` et les traductions ont été ajoutées au
 * compte-gouttes : 10 des 18 `challenge_types` n'ont toujours pas de `name_en`.
 * Sans repli, `lang='en'` rend `null` — et selon l'appelant la ligne devient un
 * libellé VIDE à l'écran, ou disparaît de la liste (filtrée comme falsy). Dans
 * les deux cas l'utilisateur ne peut plus choisir ce type, sans message ni
 * erreur : mesuré le 2026-09-09, l'étape 1 du wizard n'offrait que 8 options
 * sur 18.
 *
 * Un libellé dans une autre langue est un défaut visible et corrigeable ; une
 * option absente ne se voit pas. On replie donc vers le français (langue de
 * référence du seed), puis vers n'importe quelle traduction non vide.
 */
export function localizeName(row: LocalizedNameRow, lang: Lang, fallback = ''): string {
  const requested = lang === 'ar' ? row.name_ar : lang === 'en' ? row.name_en : row.name_fr
  return requested || row.name_fr || row.name_en || row.name_ar || fallback
}
