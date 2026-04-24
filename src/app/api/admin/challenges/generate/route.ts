import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { anthropic } from '@/lib/anthropic/client'

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const { specialty, type, industry, league, deadline } = await request.json()

  const prompt = `Tu es expert en design et en pédagogie. Génère un brief de challenge de design professionnel.

Contexte :
- Spécialité : ${specialty}
- Type de défi : ${type}
- Industrie : ${industry}
- Ligue : ${league}
- Durée : ${deadline} jours

Génère un challenge réaliste, stimulant et adapté au niveau de la ligue (Stone = débutant, Legend = expert).

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks, dans ce format exact :
{
  "title": "Titre court et accrocheur (max 60 chars)",
  "brief": "Description courte du défi en 2-3 phrases (le contexte business + ce qu'on demande)",
  "context": "Contexte détaillé : l'entreprise fictive, ses besoins, son marché. 3-4 phrases.",
  "deliverable": "Ce que le participant doit livrer concrètement. 2-3 phrases.",
  "constraints": "Contraintes techniques et créatives. Format liste à puces avec tirets.",
  "criteria": "Critères d'évaluation. Format liste à puces avec tirets."
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (message.content[0] as { type: string; text: string }).text.trim()

  let brief: Record<string, string>
  try {
    brief = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 })
    brief = JSON.parse(match[0])
  }

  return NextResponse.json({ brief })
}
