import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireAdmin } from '@/lib/admin'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { recipients, specificUser, subject, content } = await request.json()
  if (!subject?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'Sujet et contenu requis' }, { status: 400 })
  }

  let emails: string[] = []

  if (recipients === 'specific') {
    // Find by email or username
    const { data: u } = await (admin!.supabase as any)
      .from('profiles')
      .select('id')
      .eq('username', specificUser)
      .single()

    if (u) {
      const { data: authUser } = await admin!.supabase.auth.admin.getUserById(u.id)
      if (authUser?.user?.email) emails = [authUser.user.email]
    }
    if (!emails.length) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  } else {
    const query = (admin!.supabase as any).from('profiles').select('id')
    if (recipients === 'free') query.eq('plan', 'free')
    if (recipients === 'pro') query.eq('plan', 'pro')
    const { data: profiles } = await query

    for (const p of profiles ?? []) {
      const { data: au } = await admin!.supabase.auth.admin.getUserById(p.id)
      if (au?.user?.email) emails.push(au.user.email)
    }
  }

  if (!emails.length) return NextResponse.json({ error: 'Aucun destinataire trouvé' }, { status: 400 })

  // Send in batches of 50
  let sent = 0
  for (let i = 0; i < emails.length; i += 50) {
    const batch = emails.slice(i, i + 50)
    await Promise.all(batch.map(email =>
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'noreply@kreevo.io',
        to: email,
        subject,
        text: content,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:auto">${content.replace(/\n/g, '<br>')}</div>`,
      })
    ))
    sent += batch.length
  }

  return NextResponse.json({ sent })
}
