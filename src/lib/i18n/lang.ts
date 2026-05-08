/**
 * Global app i18n.
 * - Cookie `lang` is the source of truth on every request.
 * - Authenticated users sync their choice to `profiles.preferred_language`
 *   (so it follows them across devices).
 * - `tx()` does simple `{var}` interpolation.
 */

import { cookies } from 'next/headers'
import { fr, type Dictionary } from './dictionaries/fr'
import { en } from './dictionaries/en'

export type Lang = 'fr' | 'en'
export const SUPPORTED_LANGS: Lang[] = ['fr', 'en']
export const DEFAULT_LANG: Lang = 'fr'
export const LANG_COOKIE = 'lang'

export async function getLang(): Promise<Lang> {
  const c = await cookies()
  const v = c.get(LANG_COOKIE)?.value
  return v === 'en' ? 'en' : DEFAULT_LANG
}

export async function getDict(): Promise<Dictionary> {
  const lang = await getLang()
  return lang === 'en' ? en : fr
}

/**
 * Simple `{var}` interpolation for dictionary strings.
 * @example tx('Hello {name}', { name: 'Marwen' }) → 'Hello Marwen'
 */
export function tx(
  template: string,
  params: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ''))
}
