import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getContactRatelimit, clientIp } from '@/lib/ratelimit'

const resend = new Resend(process.env.RESEND_API_KEY)
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'support@kreevo.online'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@kreevo.online'

const VALID_SUBJECTS = ['bug', 'billing', 'suggestion', 'other'] as const
type Subject = (typeof VALID_SUBJECTS)[number]

const SUBJECT_LABELS: Record<Subject, { fr: string; en: string }> = {
  bug: { fr: 'Bug technique', en: 'Technical bug' },
  billing: { fr: 'Question facturation', en: 'Billing question' },
  suggestion: { fr: 'Suggestion', en: 'Suggestion' },
  other: { fr: 'Autre', en: 'Other' },
}

const ERR: Record<'fr' | 'en', { name: string; email: string; subject: string; message: string; send: string; rateLimited: string }> = {
  fr: {
    name: 'Nom invalide (2-100 caractères)',
    email: 'Email invalide',
    subject: 'Sujet invalide',
    message: 'Message trop court ou trop long (10-5000 caractères)',
    send: 'Échec de l\'envoi de l\'email',
    rateLimited: 'Trop de demandes. Réessaye dans un moment.',
  },
  en: {
    name: 'Invalid name (2–100 characters)',
    email: 'Invalid email',
    subject: 'Invalid subject',
    message: 'Message too short or too long (10–5000 characters)',
    send: 'Email send failed',
    rateLimited: 'Too many requests. Please try again later.',
  },
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const lang = (body.lang as 'fr' | 'en' | undefined) ?? 'fr'
  const e = ERR[lang]

  // Rate-limit by IP — 5/hour. Counted BEFORE honeypot/validation so invalid-
  // payload spam is capped too. FAIL-OPEN if Upstash isn't configured (dev / env
  // unset): the route still works, just uncapped. Anonymous access is preserved.
  const rl = getContactRatelimit()
  if (rl) {
    const { success } = await rl.limit(clientIp(request))
    if (!success) {
      return NextResponse.json({ error: e.rateLimited }, { status: 429 })
    }
  }

  const name = (body.name as string | undefined)?.trim() ?? ''
  const email = (body.email as string | undefined)?.trim() ?? ''
  const subject = body.subject as Subject | undefined
  const message = (body.message as string | undefined)?.trim() ?? ''
  const honeypot = (body.website as string | undefined) ?? ''

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

  // Single email → FIXED support address (no client-controlled recipient, so no
  // third-party spam vector). replyTo lets support answer the user directly.
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

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: SUPPORT_EMAIL,
      replyTo: email,
      subject: supportSubject,
      html: supportHtml.trim(),
    })
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
