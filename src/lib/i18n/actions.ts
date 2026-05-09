'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { LANG_COOKIE, SUPPORTED_LANGS, type Lang } from './lang'

/**
 * Update the user's preferred language.
 * - Sets the `lang` cookie (1 year)
 * - Persists the choice to `profiles.preferred_language` if user is logged in
 * - Revalidates the root layout so all pages re-render with the new language
 */
export async function setLang(lang: Lang): Promise<void> {
  if (!SUPPORTED_LANGS.includes(lang)) return

  const c = await cookies()
  c.set(LANG_COOKIE, lang, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  // Best-effort sync to profile + auth metadata (so Supabase email templates
  // can read `{{ .Data.lang }}` for transactional emails).
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await Promise.all([
        (supabase as any)
          .from('profiles')
          .update({ preferred_language: lang })
          .eq('id', user.id),
        supabase.auth.updateUser({ data: { lang } }),
      ])
    }
  } catch {
    /* ignore — cookie is enough */
  }

  revalidatePath('/', 'layout')
}
