// Email template system — shared types.
// Structure is fixed (banner / title / body / button / footer); admins edit content per type.

export type EmailTemplateType =
  | 'confirmation' // Supabase Auth — signup confirmation
  | 'recovery' // Supabase Auth — password reset
  | 'email_change' // Supabase Auth — email change
  | 'contact_confirmation' // App — Help Center contact auto-reply
  | 'broadcast' // App — admin broadcast

export interface EmailTemplate {
  type: EmailTemplateType
  label: string
  banner_url: string | null
  title: string
  body: string // plain text; blank line = new paragraph. Supports {{ variables }}.
  button_enabled: boolean
  button_label: string
  button_url: string | null // app emails only; Auth emails inject the locked action URL at render time
  footer_text: string
  footer_link: string | null
}

// Whether a type is a Supabase Auth email (pushed to GoTrue) or an app email (sent by our code).
export const AUTH_TYPES: EmailTemplateType[] = ['confirmation', 'recovery', 'email_change']

export function isAuthType(type: EmailTemplateType): boolean {
  return AUTH_TYPES.includes(type)
}

// For Auth emails the primary button MUST point to the GoTrue action URL — locked, non-disablable.
export const AUTH_ACTION_URL = '{{ .ConfirmationURL }}'
