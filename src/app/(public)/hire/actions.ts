'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * joinWaitlist — ajoute un email à la waitlist « Hire Talent » (table hire_waitlist,
 * RLS verrouillée → écriture via service-role). Public (pas de check admin).
 * Dédup par email (upsert, ignore les doublons). `hire_waitlist` hors types générés → cast.
 */
export async function joinWaitlist(email: string): Promise<{ ok: boolean; error?: string }> {
  const e = email.trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) || e.length > 254) {
    return { ok: false, error: 'invalid' }
  }
  const { error } = await (supabaseAdmin as any)
    .from('hire_waitlist')
    .upsert({ email: e }, { onConflict: 'email', ignoreDuplicates: true })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
