import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { anthropic } from '@/lib/anthropic/client'

interface Params { params: Promise<{ id: string }> }

interface Feedback {
  summary: string
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  score: number
}

const PRO_PLANS = new Set(['pro', 'studio'])

async function getSubmission(submissionId: string) {
  const { data } = await (supabaseAdmin as any)
    .from('submissions')
    .select(`
      id, user_id, title, description, cover_url,
      challenges:challenge_id (title, brief, context, deliverable, constraints, criteria, specialty, challenge_type, industry)
    `)
    .eq('id', submissionId)
    .single()
  return data
}

async function getExistingFeedback(submissionId: string): Promise<Feedback | null> {
  const { data } = await (supabaseAdmin as any)
    .from('submission_feedbacks')
    .select('content')
    .eq('submission_id', submissionId)
    .maybeSingle()
  return (data?.content as Feedback) ?? null
}

function buildPrompt(sub: any): string {
  const c = sub.challenges
  return `You are a senior design critic reviewing a submission for the Kreevo design challenges platform.

CHALLENGE BRIEF:
- Title: ${c?.title ?? 'N/A'}
- Specialty: ${c?.specialty ?? 'N/A'}
- Type: ${c?.challenge_type ?? 'N/A'}
- Industry: ${c?.industry ?? 'N/A'}
- Brief: ${c?.brief ?? 'N/A'}
- Scenario: ${c?.context ?? 'N/A'}
- Expected deliverable: ${c?.deliverable ?? 'N/A'}
- Constraints: ${c?.constraints ?? 'N/A'}
- Evaluation criteria: ${c?.criteria ?? 'N/A'}

USER SUBMISSION:
- Title: ${sub.title ?? 'Untitled'}
- Description: ${sub.description ?? '(no description)'}
- The cover image is attached.

Please analyze this submission against the brief and return a JSON object with this exact shape:
{
  "summary": "2-3 sentence overall impression",
  "strengths": ["specific strength 1", "strength 2", ...],   // 3-5 items
  "weaknesses": ["specific weakness 1", ...],                 // 2-4 items
  "suggestions": ["actionable suggestion 1", ...],            // 3-5 items
  "score": 75   // 0-100 based on brief fit, craft, and originality
}

Be specific, reference visual elements you see. Constructive, no fluff. Output ONLY the JSON, no preamble.`
}

async function generateFeedback(sub: any): Promise<Feedback> {
  const userContent: Anthropic_MessageContentBlock[] = []
  if (sub.cover_url) {
    userContent.push({
      type: 'image',
      source: { type: 'url', url: sub.cover_url },
    } as any)
  }
  userContent.push({ type: 'text', text: buildPrompt(sub) })

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: userContent as any }],
  })

  const textBlock = res.content.find((b: any) => b.type === 'text') as { type: 'text'; text: string } | undefined
  const raw = textBlock?.text ?? ''
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI did not return JSON')
  const parsed = JSON.parse(jsonMatch[0]) as Feedback
  // Defensive normalization
  return {
    summary: String(parsed.summary ?? ''),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.map(String) : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map(String) : [],
    score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 0,
  }
}

// Used for the user content typing — Anthropic SDK exports its own type but we keep it loose here.
type Anthropic_MessageContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'url'; url: string } }

export async function GET(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const sub = await getSubmission(id)
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (sub.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const existing = await getExistingFeedback(id)
  return NextResponse.json({ feedback: existing })
}

export async function POST(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const sub = await getSubmission(id)
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (sub.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Pro gate
  const { data: profile } = await (supabaseAdmin as any)
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()
  if (!PRO_PLANS.has(String(profile?.plan ?? ''))) {
    return NextResponse.json({ error: 'Pro plan required' }, { status: 402 })
  }

  // Reuse existing if already generated
  const existing = await getExistingFeedback(id)
  if (existing) return NextResponse.json({ feedback: existing, cached: true })

  let feedback: Feedback
  try {
    feedback = await generateFeedback(sub)
  } catch (err) {
    return NextResponse.json({ error: 'Generation failed', detail: String(err) }, { status: 500 })
  }

  const { error: insertErr } = await (supabaseAdmin as any)
    .from('submission_feedbacks')
    .insert({ submission_id: id, user_id: user.id, content: feedback })
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({ feedback, cached: false })
}
