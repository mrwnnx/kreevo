'use server'

/**
 * On-demand translation of an AI feedback into the user's active language.
 * Cousin of translateChallenge: same anthropic client, same model, same
 * tolerant JSON parsing. Translates `summary` + each item of the three lists
 * into the target language, preserves `score` and the array lengths, and
 * returns the translated content to the client. NOT persisted (light version).
 */

import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic/client'

const TRANSLATE_MODEL = 'claude-sonnet-4-6'

export type FeedbackLang = 'fr' | 'en' | 'ar'

export interface FeedbackContent {
  score: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
}

const LANG_NAME: Record<FeedbackLang, string> = {
  fr: 'French',
  en: 'English',
  ar: 'Arabic (Modern Standard Arabic)',
}

export type TranslateFeedbackResult =
  | { ok: true; content: FeedbackContent }
  | { ok: false; error: string }

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}

const toStrings = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)) : []

export async function translateFeedback(
  content: FeedbackContent,
  targetLang: FeedbackLang,
): Promise<TranslateFeedbackResult> {
  // Light auth gate — must be logged in (no admin requirement).
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non authentifié.' }

  if (!content || typeof content.summary !== 'string') {
    return { ok: false, error: 'Feedback invalide.' }
  }

  const payload = {
    summary: content.summary,
    strengths: toStrings(content.strengths),
    weaknesses: toStrings(content.weaknesses),
    suggestions: toStrings(content.suggestions),
  }

  const prompt = `You are translating an AI design-feedback object into ${LANG_NAME[targetLang]} for a design-practice platform.

Rules:
- Translate "summary" and EVERY item of "strengths", "weaknesses" and "suggestions" into ${LANG_NAME[targetLang]}.
- Keep the SAME keys and the SAME number of items in each array (translate item-for-item, do not merge, drop or add items).
- Keep brand/tool names and design jargon (UI, UX, Figma, dashboard…) as-is.
- Return STRICTLY valid JSON with exactly the keys "summary", "strengths", "weaknesses", "suggestions" and string values. No commentary, no code fences.

Source JSON:
${JSON.stringify(payload, null, 2)}`

  try {
    const res = await anthropic.messages.create({
      model: TRANSLATE_MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = res.content.map((b: any) => (b.type === 'text' ? b.text : '')).join('').trim()
    const obj = parseJsonObject(text)
    if (!obj) return { ok: false, error: 'Réponse IA illisible — réessaie.' }

    return {
      ok: true,
      content: {
        score: content.score, // preserved, never translated
        summary: typeof obj.summary === 'string' ? obj.summary : content.summary,
        strengths: toStrings(obj.strengths),
        weaknesses: toStrings(obj.weaknesses),
        suggestions: toStrings(obj.suggestions),
      },
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Échec de la traduction' }
  }
}
