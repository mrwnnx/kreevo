'use server'

/**
 * Challenge translation — Model C.
 * The admin writes a challenge in one source language; this action asks Claude
 * to translate the 6 text fields into the two other languages, field by field
 * (each field keeps its own structure and "design brief" tone — never merged
 * into one block). The result is returned to the form (NOT persisted); the admin
 * reviews/edits, then saves the 3 versions together.
 */

import { requireAdmin } from '@/lib/admin'
import { anthropic } from '@/lib/anthropic/client'

const TRANSLATE_MODEL = 'claude-sonnet-4-6'

export type ChallengeLang = 'fr' | 'en' | 'ar'

/** The 6 translatable challenge fields. */
export interface ChallengeFields {
  title: string
  brief: string
  context: string
  deliverable: string
  constraints: string
  criteria: string
}

const FIELD_KEYS: (keyof ChallengeFields)[] = [
  'title', 'brief', 'context', 'deliverable', 'constraints', 'criteria',
]

const LANG_NAME: Record<ChallengeLang, string> = {
  fr: 'French',
  en: 'English',
  ar: 'Arabic (Modern Standard Arabic)',
}

const FIELD_HINT: Record<keyof ChallengeFields, string> = {
  title: 'short challenge title',
  brief: 'main brief / mission statement',
  context: 'scenario / background context',
  deliverable: 'expected deliverable',
  constraints: 'constraints the designer must respect',
  criteria: 'evaluation criteria',
}

export type TranslateResult =
  | { ok: true; translations: Partial<Record<ChallengeLang, ChallengeFields>> }
  | { ok: false; error: string }

/** Extract a JSON object from a model response (tolerates code fences / prose). */
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

async function translateToLang(
  target: ChallengeLang,
  sourceLang: ChallengeLang,
  fields: ChallengeFields,
): Promise<ChallengeFields> {
  // Only translate non-empty fields; empties stay empty (e.g. optional context).
  const present = FIELD_KEYS.filter((k) => fields[k]?.trim())
  const payload: Record<string, string> = {}
  for (const k of present) payload[k] = fields[k]

  const fieldList = present.map((k) => `- "${k}" (${FIELD_HINT[k]})`).join('\n')

  const prompt = `You are translating a design-challenge brief from ${LANG_NAME[sourceLang]} to ${LANG_NAME[target]} for a design-practice platform.

Rules:
- Translate EACH field independently. Keep each field's own structure: line breaks, bullet/numbered lists, and paragraph breaks must be preserved exactly. Never merge fields into one block.
- Keep the concise, motivating "design brief" tone of the original.
- Do NOT translate: brand/product/tool names (Figma, Behance, Dribbble…), design jargon that is normally kept in English (UI, UX, wireframe, design system, dashboard, branding…), URLs, units (px, A3), and emojis.
- Translate ONLY the keys provided. Return strictly valid JSON with exactly those keys and no others. No commentary, no code fences.

Fields to translate:
${fieldList}

Source (${LANG_NAME[sourceLang]}) JSON:
${JSON.stringify(payload, null, 2)}`

  const res = await anthropic.messages.create({
    model: TRANSLATE_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = res.content.map((b: any) => (b.type === 'text' ? b.text : '')).join('').trim()
  const obj = parseJsonObject(text)
  if (!obj) throw new Error(`Réponse IA illisible pour ${target}`)

  // Build a full ChallengeFields: translated where present, '' otherwise.
  const out: ChallengeFields = { title: '', brief: '', context: '', deliverable: '', constraints: '', criteria: '' }
  for (const k of FIELD_KEYS) {
    const v = obj[k]
    out[k] = typeof v === 'string' ? v : ''
  }
  return out
}

/**
 * Translate the source-language fields into the two other languages.
 * Returns the translations only (not persisted) so the admin can review/edit.
 */
export async function translateChallenge(input: {
  sourceLang: ChallengeLang
  fields: ChallengeFields
}): Promise<TranslateResult> {
  const { error } = await requireAdmin()
  if (error) return { ok: false, error: 'Accès refusé.' }

  const { sourceLang, fields } = input
  if (!fields?.title?.trim() || !fields?.brief?.trim()) {
    return { ok: false, error: 'Le titre et le brief de la langue source sont requis avant de traduire.' }
  }

  const targets = (['fr', 'en', 'ar'] as ChallengeLang[]).filter((l) => l !== sourceLang)

  try {
    const results = await Promise.all(targets.map((t) => translateToLang(t, sourceLang, fields)))
    const translations: Partial<Record<ChallengeLang, ChallengeFields>> = {}
    targets.forEach((t, i) => { translations[t] = results[i] })
    return { ok: true, translations }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Échec de la traduction'
    return { ok: false, error: msg }
  }
}
