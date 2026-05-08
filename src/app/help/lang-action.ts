'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function setHelpLang(lang: 'fr' | 'en') {
  const c = await cookies()
  c.set('lang', lang, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  })
  revalidatePath('/help', 'layout')
}
