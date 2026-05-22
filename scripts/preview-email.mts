// Render a template with the real engine → /tmp for visual preview.
import { writeFileSync } from 'node:fs'
import { DEFAULT_TEMPLATES } from '../src/lib/email/defaults'
import { renderEmail } from '../src/lib/email/render'

const tpl = { ...DEFAULT_TEMPLATES.confirmation, banner_url: 'https://picsum.photos/seed/kreevo/1120/400' }
const html = renderEmail(tpl, { vars: {} })
writeFileSync('/tmp/kreevo-email-preview.html', html)
console.log('written /tmp/kreevo-email-preview.html', html.length, 'chars')
