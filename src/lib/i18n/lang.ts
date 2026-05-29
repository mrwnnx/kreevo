/**
 * Global app i18n — SERVER side helpers.
 * Client components must import `tx` from `./tx` (pure, no `next/headers`).
 *
 * - Cookie `lang` is the source of truth on every request.
 * - Authenticated users sync their choice to `profiles.preferred_language`
 *   (so it follows them across devices).
 */

import 'server-only'
import { cookies } from 'next/headers'
import { fr, type Dictionary } from './dictionaries/fr'
import { en } from './dictionaries/en'
import { ar } from './dictionaries/ar'

export type Lang = 'fr' | 'en' | 'ar'
export const SUPPORTED_LANGS: Lang[] = ['fr', 'en', 'ar']
export const DEFAULT_LANG: Lang = 'fr'
export const LANG_COOKIE = 'lang'

/** Languages that render right-to-left. */
export const RTL_LANGS: Lang[] = ['ar']
export const isRTL = (lang: Lang): boolean => RTL_LANGS.includes(lang)
/** `dir` attribute value for a given language. */
export const dirFor = (lang: Lang): 'rtl' | 'ltr' => (isRTL(lang) ? 'rtl' : 'ltr')

export async function getLang(): Promise<Lang> {
  const c = await cookies()
  const v = c.get(LANG_COOKIE)?.value
  if (v === 'en' || v === 'ar') return v
  return DEFAULT_LANG
}

export async function getDict(): Promise<Dictionary> {
  const lang = await getLang()
  if (lang === 'en') return en
  if (lang === 'ar') return ar
  return fr
}

// Re-export the client-safe interpolation helper for server-side ergonomics.
export { tx } from './tx'
