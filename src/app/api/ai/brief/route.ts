import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic/client'
import { createClient } from '@/lib/supabase/server'
import { awardBadge } from '@/lib/utils/badges'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { domain, type, difficulty, duration } = await request.json()
  if (!domain || !type || !difficulty || !duration) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  // Check plan + rate limit for free users
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (profile?.plan === 'free') {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await (supabase as any)
      .from('random_briefs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Limite mensuelle atteinte. Passe en Pro pour des briefs illimités.' },
        { status: 403 }
      )
    }
  }

  let briefData: Record<string, string>

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Tu es un expert en design UX/UI et graphic.
Génère un brief design professionnel en français.

Paramètres :
- Domaine : ${domain}
- Type : ${type}
- Difficulté : ${difficulty}
- Durée estimée : ${duration}

Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks, sans texte avant ou après :
{
  "title": "Titre court et accrocheur",
  "context": "Contexte du projet en 2-3 phrases",
  "objective": "Ce que le designer doit accomplir",
  "deliverable": "Ce qu'il doit produire concrètement",
  "constraints": "2-3 contraintes à respecter",
  "evaluation": "Sur quoi sera évalué le travail"
}`,
      }],
    })

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : ''
    briefData = JSON.parse(responseText)
  } catch (err) {
    return NextResponse.json({ error: 'Erreur génération brief' }, { status: 500 })
  }

  // Save to DB
  const { data: saved, error: dbErr } = await (supabase as any)
    .from('random_briefs')
    .insert({
      user_id: user.id,
      prompt: { domain, type, difficulty, duration },
      brief_text: JSON.stringify(briefData),
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  // XP + badges
  const { count: totalBriefs } = await (supabase as any)
    .from('random_briefs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const total = totalBriefs ?? 0

  // Award XP
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/xp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
    body: JSON.stringify({ userId: user.id, action: 'random_brief_complete' }),
  })

  // Award badges
  if (total === 1) await awardBadge(user.id, 'first_draft', {}, supabase as any)
  if (total === 5) await awardBadge(user.id, 'consistent', {}, supabase as any)
  if (total === 10) await awardBadge(user.id, 'machine', {}, supabase as any)
  if (total === 30) await awardBadge(user.id, 'obsessed', {}, supabase as any)

  return NextResponse.json({ brief: briefData, id: saved.id })
}
