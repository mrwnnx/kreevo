// BUG-44 — seed default email templates + prove the pipeline end-to-end for the
// confirmation email (render with the real engine → push to Supabase GoTrue).
//
// Run: PAT=sbp_xxx npx tsx scripts/seed-email-templates.mts
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_TEMPLATES } from '../src/lib/email/defaults'
import { renderEmail } from '../src/lib/email/render'
import { pushAuthTemplate } from '../src/lib/email/supabase-sync'

// Minimal .env.local loader
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const PAT = process.env.PAT
if (!PAT) throw new Error('PAT env var required')

// 1. Seed all defaults (upsert — does not overwrite if you later edit in admin, since we only seed once)
for (const tpl of Object.values(DEFAULT_TEMPLATES)) {
  const { error } = await supabase
    .from('email_templates')
    .upsert({ ...tpl, updated_at: new Date().toISOString() }, { onConflict: 'type' })
  console.log(error ? `  ✗ ${tpl.type}: ${error.message}` : `  ✓ seeded ${tpl.type}`)
}

// 2. Push every Auth template (current DB content) to Supabase GoTrue.
import { AUTH_TYPES } from '../src/lib/email/types'
console.log('')
for (const type of AUTH_TYPES) {
  const { data } = await supabase.from('email_templates').select('*').eq('type', type).maybeSingle()
  const tpl = data ?? DEFAULT_TEMPLATES[type]
  const html = renderEmail(tpl as any)
  await pushAuthTemplate(type, html, PAT)
  console.log(`✓ Pushed ${type} (${html.length} chars) to Supabase GoTrue`)
}
