// Email template data access (server-only — uses the service-role client, bypasses RLS).
import { supabaseAdmin } from '@/lib/supabase/admin'
import { type EmailTemplate, type EmailTemplateType } from './types'

export async function getTemplate(type: EmailTemplateType): Promise<EmailTemplate | null> {
  const { data } = await (supabaseAdmin as any)
    .from('email_templates')
    .select('*')
    .eq('type', type)
    .maybeSingle()
  return (data as EmailTemplate) ?? null
}

export async function listTemplates(): Promise<EmailTemplate[]> {
  const { data } = await (supabaseAdmin as any)
    .from('email_templates')
    .select('*')
    .order('type')
  return (data as EmailTemplate[]) ?? []
}

export async function upsertTemplate(tpl: EmailTemplate): Promise<void> {
  await (supabaseAdmin as any)
    .from('email_templates')
    .upsert({ ...tpl, updated_at: new Date().toISOString() }, { onConflict: 'type' })
}
