'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { renderEmail } from '@/lib/email/render'
import { pushAuthTemplate } from '@/lib/email/supabase-sync'
import { isAuthType, type EmailTemplate } from '@/lib/email/types'

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return profile?.role === 'admin'
}

export interface SaveResult {
  error?: string
  // For Auth templates: 'synced' = pushed to Supabase, 'saved' = stored in DB but not pushed (no PAT configured)
  authSync?: 'synced' | 'saved'
}

export async function saveTemplate(tpl: EmailTemplate): Promise<SaveResult> {
  if (!(await isAdmin())) return { error: 'Forbidden' }

  const { error } = await (supabaseAdmin as any)
    .from('email_templates')
    .upsert({ ...tpl, updated_at: new Date().toISOString() }, { onConflict: 'type' })
  if (error) return { error: error.message }

  if (isAuthType(tpl.type)) {
    const pat = process.env.SUPABASE_MANAGEMENT_PAT
    if (!pat) return { authSync: 'saved' }
    try {
      await pushAuthTemplate(tpl.type, renderEmail(tpl), pat)
      return { authSync: 'synced' }
    } catch (e) {
      return { error: `Enregistré en base, mais la synchro Supabase a échoué : ${(e as Error).message}` }
    }
  }

  return {}
}
