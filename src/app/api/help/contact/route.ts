import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const SUPPORT_EMAIL = 'kreevodesign@gmail.com'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@kreevo.online'

const VALID_SUBJECTS = ['bug', 'billing', 'suggestion', 'other'] as const
type Subject = (typeof VALID_SUBJECTS)[number]

const SUBJECT_LABELS: Record<Subject, { fr: string; en: string }> = {
  bug: { fr: 'Bug technique', en: 'Technical bug' },
  billing: { fr: 'Question facturation', en: 'Billing question' },
  suggestion: { fr: 'Suggestion', en: 'Suggestion' },
  other: { fr: 'Autre', en: 'Other' },
}

const ERR: Record<'fr' | 'en', { name: string; email: string; subject: string; message: string; send: string }> = {
  fr: {
    name: 'Nom invalide (2-100 caractères)',
    email: 'Email invalide',
    subject: 'Sujet invalide',
    message: 'Message trop court ou trop long (10-5000 caractères)',
    send: 'Échec de l\'envoi de l\'email',
  },
  en: {
    name: 'Invalid name (2–100 characters)',
    email: 'Invalid email',
    subject: 'Invalid subject',
    message: 'Message too short or too long (10–5000 characters)',
    send: 'Email send failed',
  },
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const name = (body.name as string | undefined)?.trim() ?? ''
  const email = (body.email as string | undefined)?.trim() ?? ''
  const subject = body.subject as Subject | undefined
  const message = (body.message as string | undefined)?.trim() ?? ''
  const honeypot = (body.website as string | undefined) ?? ''
  const lang = (body.lang as 'fr' | 'en' | undefined) ?? 'fr'
  const e = ERR[lang]

  // Honeypot — silently succeed if filled (bot)
  if (honeypot) {
    return NextResponse.json({ ok: true })
  }

  // Validation
  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: e.name }, { status: 400 })
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: e.email }, { status: 400 })
  }
  if (!subject || !VALID_SUBJECTS.includes(subject)) {
    return NextResponse.json({ error: e.subject }, { status: 400 })
  }
  if (message.length < 10 || message.length > 5000) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }

  const subjectLabel = SUBJECT_LABELS[subject][lang]

  // Email to support — full details
  const supportSubject = `[Help Center · ${subjectLabel}] ${name}`
  const supportHtml = `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:auto;color:#0f172a">
  <h2 style="font-size:18px;margin:0 0 16px">Nouvelle demande Help Center</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:8px 12px;background:#f1f5f9;width:120px"><b>Nom</b></td><td style="padding:8px 12px;background:#fff">${escapeHtml(name)}</td></tr>
    <tr><td style="padding:8px 12px;background:#f1f5f9"><b>Email</b></td><td style="padding:8px 12px;background:#fff"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
    <tr><td style="padding:8px 12px;background:#f1f5f9"><b>Sujet</b></td><td style="padding:8px 12px;background:#fff">${subjectLabel}</td></tr>
    <tr><td style="padding:8px 12px;background:#f1f5f9"><b>Langue</b></td><td style="padding:8px 12px;background:#fff">${lang.toUpperCase()}</td></tr>
  </table>
  <h3 style="font-size:14px;margin:24px 0 8px">Message</h3>
  <div style="white-space:pre-wrap;padding:16px;background:#f8fafc;border-left:4px solid #6366f1;font-size:14px;line-height:1.6">${escapeHtml(message)}</div>
  <p style="margin-top:24px;font-size:12px;color:#64748b">Réponds directement à <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a> pour répondre à l'utilisateur.</p>
</div>`.trim()

  // Confirmation to the user
  const userSubject =
    lang === 'en'
      ? `We received your message — Kreevo Help`
      : `Ton message est bien reçu — Aide Kreevo`
  const userHtml =
    lang === 'en'
      ? `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:auto;color:#0f172a">
  <h2 style="font-size:20px;margin:0 0 16px">Hi ${escapeHtml(name.split(' ')[0])} 👋</h2>
  <p style="font-size:15px;line-height:1.6">Thanks for reaching out — we received your message and our team will reply within <b>24 hours</b>.</p>
  <h3 style="font-size:14px;margin:24px 0 8px">Your message</h3>
  <div style="white-space:pre-wrap;padding:16px;background:#f8fafc;border-left:4px solid #6366f1;font-size:14px;line-height:1.6">${escapeHtml(message)}</div>
  <p style="margin-top:24px;font-size:14px"><b>Subject:</b> ${subjectLabel}</p>
  <p style="margin-top:24px;font-size:13px;color:#64748b">Need to add something? Just reply to this email.</p>
  <p style="margin-top:24px;font-size:12px;color:#64748b">— The Kreevo team · <a href="https://www.kreevo.online/help">kreevo.online/help</a></p>
</div>`
      : `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:auto;color:#0f172a">
  <h2 style="font-size:20px;margin:0 0 16px">Salut ${escapeHtml(name.split(' ')[0])} 👋</h2>
  <p style="font-size:15px;line-height:1.6">Merci pour ton message — on l'a bien reçu et l'équipe te répondra sous <b>24 heures</b>.</p>
  <h3 style="font-size:14px;margin:24px 0 8px">Ton message</h3>
  <div style="white-space:pre-wrap;padding:16px;background:#f8fafc;border-left:4px solid #6366f1;font-size:14px;line-height:1.6">${escapeHtml(message)}</div>
  <p style="margin-top:24px;font-size:14px"><b>Sujet :</b> ${subjectLabel}</p>
  <p style="margin-top:24px;font-size:13px;color:#64748b">Besoin d'ajouter quelque chose ? Réponds simplement à cet email.</p>
  <p style="margin-top:24px;font-size:12px;color:#64748b">— L'équipe Kreevo · <a href="https://www.kreevo.online/help">kreevo.online/help</a></p>
</div>`

  try {
    await Promise.all([
      resend.emails.send({
        from: FROM_EMAIL,
        to: SUPPORT_EMAIL,
        replyTo: email,
        subject: supportSubject,
        html: supportHtml.trim(),
      }),
      resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: userSubject,
        html: userHtml.trim(),
      }),
    ])
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[help/contact] Resend error', err)
    return NextResponse.json({ error: e.send }, { status: 500 })
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
