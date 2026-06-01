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

// ── AI generation (Lot 2) ────────────────────────────────────────────────────
// Cousin of translateChallenge: same client / model / structured-JSON shape.
// Generates the 6 fields in the SOURCE language only — translation to the other
// two stays a separate step (the existing "Traduire" button / translateChallenge).

export type GenerateResult =
  | { ok: true; fields: ChallengeFields }
  | { ok: false; error: string }

export async function generateChallenge(input: {
  sourceLang: ChallengeLang
  genBrief: string
  specialty?: string
  challengeType?: string
  industry?: string
  league?: string
  leagueTier?: number
}): Promise<GenerateResult> {
  const { error } = await requireAdmin()
  if (error) return { ok: false, error: 'Accès refusé.' }

  const { sourceLang, genBrief } = input
  if (!genBrief?.trim()) {
    return { ok: false, error: 'Décris le challenge à générer.' }
  }

  const ctx: string[] = []
  if (input.specialty) ctx.push(`Specialty: ${input.specialty}`)
  if (input.challengeType) ctx.push(`Challenge type: ${input.challengeType}`)
  if (input.industry) ctx.push(`Industry: ${input.industry}`)
  if (input.league) {
    ctx.push(`League / level: ${input.league}${input.leagueTier ? ` (tier ${input.leagueTier}/8 — 1 = easiest, 8 = hardest)` : ''}`)
  }

  const fieldList = FIELD_KEYS.map((k) => `- "${k}" (${FIELD_HINT[k]})`).join('\n')

  const prompt = `You are an expert design-challenge author for a design-practice platform where designers compete by submitting work. Write ONE complete, realistic design challenge in ${LANG_NAME[sourceLang]} only.

Admin's request:
${genBrief}

Context to respect:
${ctx.length ? ctx.join('\n') : '(none provided)'}

Write each field with a concrete, actionable "design brief" tone, calibrated to the league tier (higher tier → more ambitious scope and stricter constraints), and coherent with the specialty, challenge type and industry above:
- title: short, specific, punchy (not generic). PROSE (one line).
- brief: the mission — what to design and why — motivating, 2-4 sentences. PROSE (paragraph).
- context: a believable scenario / fictional client / background. PROSE (paragraph).
- deliverable: the concrete expected outputs (formats, number of screens, Figma link…), matching the challenge type. LIST.
- constraints: realistic constraints to respect (style, platform, accessibility, dimensions…). LIST.
- criteria: how the work will be judged. LIST (3-5 items).

FORMAT — strict:
- title, brief and context are PROSE: a single paragraph each, NO line breaks, NO bullets.
- deliverable, constraints and criteria are LISTS: write one short, concrete item per line, separated by a real newline character. Do NOT number the items and do NOT prefix them with a dash or bullet — just one item per line. Each item is a self-contained phrase.

Keep brand/tool names and design jargon (UI, UX, Figma, dashboard…) as-is. Return STRICTLY valid JSON with exactly these keys and string values, nothing else (no commentary, no code fences). Newlines inside the list values MUST be encoded as \\n (standard JSON string escaping):
${fieldList}`

  try {
    const res = await anthropic.messages.create({
      model: TRANSLATE_MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = res.content.map((b: any) => (b.type === 'text' ? b.text : '')).join('').trim()
    const obj = parseJsonObject(text)
    if (!obj) return { ok: false, error: 'Réponse IA illisible — réessaie.' }

    const fields: ChallengeFields = { title: '', brief: '', context: '', deliverable: '', constraints: '', criteria: '' }
    for (const k of FIELD_KEYS) {
      const v = obj[k]
      fields[k] = typeof v === 'string' ? v : ''
    }
    if (!fields.title.trim() && !fields.brief.trim()) {
      return { ok: false, error: 'Génération vide — réessaie avec un brief plus précis.' }
    }
    return { ok: true, fields }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Échec de la génération' }
  }
}
