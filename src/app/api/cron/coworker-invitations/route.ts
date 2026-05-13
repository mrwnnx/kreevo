import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase/admin'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'Kreevo <hello@kreevo.io>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kreevo-tau.vercel.app'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildEmail(authorName: string, submissionTitle: string | null, url: string): { subject: string; html: string } {
  const subject = `${authorName} t'invite à co-signer une soumission sur Kreevo`
  const titleHtml = submissionTitle
    ? `<p style="font-size:14px;color:#0f172a;margin:16px 0 0">Projet : <b>${escapeHtml(submissionTitle)}</b></p>`
    : ''
  const html = `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:auto;color:#0f172a">
  <h2 style="font-size:20px;margin:0 0 16px">Tu as une nouvelle invitation 🤝</h2>
  <p style="font-size:15px;line-height:1.6"><b>${escapeHtml(authorName)}</b> t'a invité à co-signer une de ses soumissions Kreevo. Si tu acceptes, ton nom apparaît publiquement sur la soumission et tu reçois 50 % de l'XP de la soumission quand elle est validée.</p>
  ${titleHtml}
  <p style="margin-top:24px"><a href="${url}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Voir l'invitation</a></p>
  <p style="margin-top:24px;font-size:12px;color:#64748b">Tu n'es pas concerné(e) ? Tu peux ignorer cet email. — Kreevo</p>
</div>`.trim()
  return { subject, html }
}

export async function POST(request: Request) {
  return handle(request)
}
export async function GET(request: Request) {
  return handle(request)
}

async function handle(request: Request) {
  const auth = request.headers.get('authorization')?.replace('Bearer ', '')
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString()

  const { data: invites } = await (supabaseAdmin as any)
    .from('submission_coworkers')
    .select(`
      id,
      submission_id,
      user_id,
      invited_by,
      profiles:user_id(id, username),
      author:invited_by(id, username, full_name),
      submission:submission_id(id, title)
    `)
    .eq('status', 'pending')
    .is('email_sent_at', null)
    .lt('invited_at', cutoff)
    .limit(50)

  type Row = {
    id: string
    submission_id: string
    user_id: string
    profiles: { id: string; username: string } | null
    author: { id: string; username: string; full_name: string | null } | null
    submission: { id: string; title: string | null } | null
  }
  const rows = (invites ?? []) as Row[]

  let sent = 0
  let skipped = 0

  for (const row of rows) {
    let recipient: string | null = null
    try {
      const { data: authUser } = await (supabaseAdmin as any).auth.admin.getUserById(row.user_id)
      recipient = authUser?.user?.email ?? null
    } catch { recipient = null }
    if (!recipient) { skipped++; continue }
    const authorName = row.author?.full_name || row.author?.username || 'Un designer'
    const url = `${APP_URL}/dashboard/notifications`
    const { subject, html } = buildEmail(authorName, row.submission?.title ?? null, url)

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: recipient,
        subject,
        html,
      })
      await (supabaseAdmin as any)
        .from('submission_coworkers')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('id', row.id)
      sent++
    } catch (err) {
      console.error('[cron/coworker-invitations] resend error', err)
    }
  }

  return NextResponse.json({ checked: rows.length, sent, skipped })
}
