import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { anthropic } from '@/lib/anthropic/client'

interface Props { params: Promise<{ id: string }> }

const PROMPT = (brief: string, specialty: string, type: string, deliverable: string, criteria: string) => `Tu es un mentor designer senior. Analyse cette soumission de challenge en profondeur et donne un feedback constructif au designer.

Contexte du challenge :
- Spécialité : ${specialty || '—'}
- Type : ${type || '—'}
- Brief : ${brief || '—'}
- Livrable attendu : ${deliverable || '—'}
- Critères d'évaluation : ${criteria || '—'}

Analyse l'image attentivement (composition, hiérarchie, typographie, couleurs, espacement, alignement, clarté du message, fidélité au brief).

Réponds UNIQUEMENT en JSON valide, sans markdown ni texte autour :
{
  "score": <number entre 1 et 10>,
  "summary": "<1-2 phrases — verdict global>",
  "strengths": ["<point fort concret 1>", "<point fort 2>", "<point fort 3>"],
  "improvements": ["<axe d'amélioration actionnable 1>", "<axe 2>", "<axe 3>"]
}

Sois précis, technique et bienveillant. Évite le jargon vide. Chaque bullet doit pointer un détail visible dans l'image.`

export async function POST(_request: Request, { params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: profile }, { data: submission }] = await Promise.all([
    (supabase as any)
      .from('profiles')
      .select('plan, role')
      .eq('id', user.id)
      .single(),
    (supabaseAdmin as any)
      .from('submissions')
      .select('id, user_id, cover_url, validation_status, ai_feedback, ai_feedback_at, challenges(brief, specialty, challenge_types(name_fr), deliverable, criteria)')
      .eq('id', id)
      .single(),
  ])

  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = submission.user_id === user.id
  const isAdmin = profile?.role === 'admin'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (submission.validation_status !== 'approved') {
    return NextResponse.json(
      { error: 'Le feedback IA est disponible uniquement sur les soumissions validées.' },
      { status: 400 },
    )
  }

  const isPro = profile?.plan === 'pro' || profile?.plan === 'studio'
  if (isOwner && !isPro && !isAdmin) {
    return NextResponse.json(
      { error: 'Le feedback IA détaillé est réservé aux comptes Pro.' },
      { status: 402 },
    )
  }

  if (submission.ai_feedback) {
    return NextResponse.json({
      feedback: submission.ai_feedback,
      generated_at: submission.ai_feedback_at,
      cached: true,
    })
  }

  if (!submission.cover_url) {
    return NextResponse.json({ error: 'Cover manquante' }, { status: 400 })
  }

  const ch = submission.challenges ?? {}
  const prompt = PROMPT(
    ch.brief ?? '',
    ch.specialty ?? '',
    ch.challenge_types?.name_fr ?? '',
    ch.deliverable ?? '',
    ch.criteria ?? '',
  )

  try {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: submission.cover_url } },
            { type: 'text', text: prompt },
          ],
        },
      ],
    })

    const text = res.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim()

    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) {
      return NextResponse.json({ error: 'Réponse IA invalide' }, { status: 502 })
    }

    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1))
    const score = Number(parsed.score)
    const feedback = {
      score: Number.isFinite(score) ? Math.max(1, Math.min(10, Math.round(score))) : 0,
      summary: String(parsed.summary ?? ''),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5).map(String) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 5).map(String) : [],
    }

    const generatedAt = new Date().toISOString()
    await (supabaseAdmin as any)
      .from('submissions')
      .update({ ai_feedback: feedback, ai_feedback_at: generatedAt })
      .eq('id', id)

    return NextResponse.json({ feedback, generated_at: generatedAt, cached: false })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI feedback failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
