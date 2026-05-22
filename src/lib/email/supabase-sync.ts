// Push a rendered Auth email template to Supabase GoTrue (mailer_templates_*_content)
// via the Management API. Server-only.
//
// NOTE (BUG-44): the Management API uses an account-level PAT. It is intentionally NOT read
// from a baked env var here yet — wiring the runtime push-on-save (and where the PAT lives:
// env var vs Send Email Hook) is decided in BUG-45. This module is ready to be called once
// that decision is made; for now it accepts the PAT explicitly.

import { type EmailTemplateType } from './types'

const PROJECT_REF = 'ndflytgtduuvacjmdobc'

// Auth type → GoTrue config content field.
const GOTRUE_CONTENT_FIELD: Partial<Record<EmailTemplateType, string>> = {
  confirmation: 'mailer_templates_confirmation_content',
  recovery: 'mailer_templates_recovery_content',
  email_change: 'mailer_templates_email_change_content',
}

export async function pushAuthTemplate(
  type: EmailTemplateType,
  renderedHtml: string,
  pat: string
): Promise<void> {
  const field = GOTRUE_CONTENT_FIELD[type]
  if (!field) throw new Error(`Type "${type}" is not a Supabase Auth email`)

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${pat}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ [field]: renderedHtml }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Supabase config PATCH failed (${res.status}): ${detail.slice(0, 200)}`)
  }
}
