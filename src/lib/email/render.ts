// Email template renderer — produces email-safe HTML (inline styles, table layout).
// Fixed Kreevo structure (validated design, "noir" variant): centered wordmark → white
// rounded card → full-width banner image → semibold title → medium body → black button → footer.
//
// Variable substitution: our {{ name }} placeholders are replaced from `vars` (HTML-escaped).
// GoTrue placeholders ({{ .ConfirmationURL }}, {{ .Email }}…) start with a dot and are left
// untouched so Supabase can substitute them when it sends Auth emails.

import { type EmailTemplate, isAuthType, AUTH_ACTION_URL } from './types'

const FONT = "'Plus Jakarta Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Replace {{ key }} from vars. Keys starting with "." (GoTrue) are preserved verbatim.
export function applyVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, rawKey: string) => {
    const key = rawKey.trim()
    if (key.startsWith('.')) return match // GoTrue variable — leave for Supabase
    return key in vars ? vars[key] : match
  })
}

// Escape static admin text, substitute our vars, keep GoTrue tokens intact.
function prepare(text: string, vars: Record<string, string>): string {
  // Escape first, then substitute with already-escaped values to avoid double-escaping issues.
  const escapedVars: Record<string, string> = {}
  for (const [k, v] of Object.entries(vars)) escapedVars[k] = escapeHtml(v)
  return applyVars(escapeHtml(text), escapedVars)
}

// Plain text → paragraphs (blank line) with <br> for single newlines.
function paragraphs(body: string, vars: Record<string, string>): string {
  const blocks = body.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)
  return blocks
    .map(block => {
      const html = prepare(block, vars).replace(/\n/g, '<br>')
      return `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;font-weight:500;line-height:1.65;color:#444444;">${html}</p>`
    })
    .join('')
}

export interface RenderOptions {
  vars?: Record<string, string>
  /** Auth emails: the action URL injected into the (locked) button. Defaults to the GoTrue token. */
  actionUrl?: string
}

export function renderEmail(tpl: EmailTemplate, opts: RenderOptions = {}): string {
  const vars = opts.vars ?? {}
  const auth = isAuthType(tpl.type)

  // Banner (optional) — full-width image at the top of the card.
  const banner = tpl.banner_url
    ? `<tr><td style="padding:0;font-size:0;line-height:0;">
        <img src="${escapeHtml(tpl.banner_url)}" width="100%" alt="" style="display:block;width:100%;max-width:100%;height:auto;max-height:100px;object-fit:cover;border:0;">
      </td></tr>`
    : ''

  // Button. Auth emails: forced on, link locked to the action URL. App emails: respect toggle + url.
  const buttonUrl = auth ? (opts.actionUrl ?? AUTH_ACTION_URL) : (tpl.button_url ?? '#')
  const showButton = auth || (tpl.button_enabled && !!tpl.button_label.trim())
  const buttonLabel = prepare(tpl.button_label || 'Continuer', vars)
  const button = showButton
    ? `<table cellpadding="0" cellspacing="0" style="margin:0;"><tr>
        <td style="background:#111111;border-radius:10px;">
          <a href="${escapeHtml(buttonUrl)}" style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${buttonLabel}&nbsp;→</a>
        </td></tr></table>`
    : ''

  const footerLink = tpl.footer_link
    ? ` · <a href="${escapeHtml(tpl.footer_link)}" style="color:#111111;text-decoration:underline;">${prepare(tpl.footer_text || 'En savoir plus', vars)}</a>`
    : ''
  const footerText = tpl.footer_link ? 'Envoyé par Kreevo' : prepare(tpl.footer_text || 'Envoyé par Kreevo', vars)

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#ffffff;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;"><tr><td align="center" style="padding:40px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:${FONT};"><tr><td>
  <p style="text-align:center;font-family:${FONT};font-weight:800;font-size:19px;letter-spacing:-.02em;color:#9ca3af;margin:0 0 18px;">kreevo</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    ${banner}
    <tr><td style="padding:18px 36px 36px;">
      <h1 style="margin:0 0 18px;font-family:${FONT};font-size:21px;font-weight:600;color:#111111;letter-spacing:-.01em;">${prepare(tpl.title, vars)}</h1>
      ${paragraphs(tpl.body, vars)}
      ${button ? `<div style="margin-top:26px;">${button}</div>` : ''}
    </td></tr>
  </table>
  <p style="text-align:center;font-family:${FONT};font-size:12px;line-height:1.6;color:#9ca3af;margin:22px 0 4px;">${footerText}${footerLink}</p>
  <p style="text-align:center;font-family:${FONT};font-size:12px;color:#b0b4bd;margin:0;">kreevo.online — challenges de design</p>
</td></tr></table>
</td></tr></table>
</body></html>`
}
