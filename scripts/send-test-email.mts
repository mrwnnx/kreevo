// Send a real test email with a banner image, using the real render engine + Resend.
import { readFileSync } from 'node:fs'
import { DEFAULT_TEMPLATES } from '../src/lib/email/defaults'
import { renderEmail } from '../src/lib/email/render'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
}

const tpl = {
  ...DEFAULT_TEMPLATES.confirmation,
  banner_url: 'https://picsum.photos/seed/kreevo/1120/340', // placeholder image
}

const html = renderEmail(tpl, { actionUrl: 'https://www.kreevo.online/dashboard' })

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Kreevo <noreply@kreevo.online>',
    to: ['themarwen.tn@gmail.com'],
    subject: 'Aperçu email Kreevo — avec banner',
    html,
  }),
})
console.log(res.status, await res.text())
