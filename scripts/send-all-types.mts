// Send one test email per template type, rendered from the CURRENT DB templates
// (so it reflects the admin's edits). Run: npx tsx scripts/send-all-types.mts
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { renderEmail } from '../src/lib/email/render'
import { DEFAULT_TEMPLATES } from '../src/lib/email/defaults'
import { PREVIEW_GOTRUE } from '../src/lib/email/variables'
import type { EmailTemplate, EmailTemplateType } from '../src/lib/email/types'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const TO = 'themarwen.tn@gmail.com'

const PLAN: { type: EmailTemplateType; actionUrl?: string; vars: Record<string, string> }[] = [
  { type: 'confirmation', actionUrl: 'https://www.kreevo.online/dashboard', vars: {} },
  { type: 'recovery', actionUrl: 'https://www.kreevo.online/update-password', vars: {} },
  { type: 'email_change', actionUrl: 'https://www.kreevo.online', vars: {} },
  { type: 'contact_confirmation', vars: { 'prénom': 'Marwen', message: 'Voici un exemple de message envoyé via le formulaire de contact.\nMerci de votre aide !' } },
  { type: 'broadcast', vars: { titre: 'Une nouvelle importante', message: 'Ceci est le corps d’un message broadcast envoyé à tous les utilisateurs.' } },
]

for (const { type, actionUrl, vars } of PLAN) {
  const { data } = await supabase.from('email_templates').select('*').eq('type', type).maybeSingle()
  const tpl = (data as EmailTemplate) ?? DEFAULT_TEMPLATES[type]
  let html = renderEmail(tpl, { vars, actionUrl })
  // Resolve any leftover GoTrue tokens so the test email reads cleanly.
  html = html.replace(/\{\{\s*(\.[^}]+?)\s*\}\}/g, (m, k: string) => PREVIEW_GOTRUE[k.trim()] ?? m)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Kreevo <noreply@kreevo.online>',
      to: [TO],
      subject: `[Aperçu] ${tpl.label}`,
      html,
    }),
  })
  console.log(res.status, type, '→', (await res.json()).id ?? 'ERR')
}
