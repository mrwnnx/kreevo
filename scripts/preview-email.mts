// Render a template with the real engine → /tmp for visual preview.
import { writeFileSync } from 'node:fs'
import { DEFAULT_TEMPLATES } from '../src/lib/email/defaults'
import { renderEmail } from '../src/lib/email/render'

const html = renderEmail(DEFAULT_TEMPLATES.confirmation, { vars: {} })
writeFileSync('/tmp/kreevo-email-preview.html', html)
console.log('written /tmp/kreevo-email-preview.html', html.length, 'chars')
