'use server'

/**
 * Translate a single taxonomy label (challenge type or industry name) from a
 * source language into the two others. Mirrors translateChallenge: same client,
 * same model, structured JSON output. Returns the translations to the form
 * (not persisted); the admin reviews/edits, then saves + validates.
 */

import { requireAdmin } from '@/lib/admin'
import { anthropic } from '@/lib/anthropic/client'

const TRANSLATE_MODEL = 'claude-sonnet-4-6'

export type TaxoLang = 'fr' | 'en' | 'ar'

const LANG_NAME: Record<TaxoLang, string> = {
  fr: 'French',
  en: 'English',
  ar: 'Arabic (Modern Standard Arabic)',
}

export type TranslateLabelResult =
  | { ok: true; translations: Partial<Record<TaxoLang, string>> }
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

export async function translateLabel(input: {
  sourceLang: TaxoLang
  name: string
  kind: 'type' | 'industry'
}): Promise<TranslateLabelResult> {
  const { error } = await requireAdmin()
  if (error) return { ok: false, error: 'Accès refusé.' }

  const { sourceLang, name, kind } = input
  if (!name?.trim()) {
    return { ok: false, error: 'Saisis le nom dans la langue source avant de traduire.' }
  }

  const targets = (['fr', 'en', 'ar'] as TaxoLang[]).filter((l) => l !== sourceLang)
  const kindLabel = kind === 'type' ? 'design-challenge type' : 'industry / sector'

  const prompt = `Translate this short ${kindLabel} label for a design-practice platform, from ${LANG_NAME[sourceLang]} into ${targets.map((t) => LANG_NAME[t]).join(' and ')}.

Rules:
- It is a short UI label (1-3 words). Keep it concise.
- Do NOT translate brand/product names or design jargon normally kept in English (UI, UX, SaaS, Fintech, Crypto, Dashboard, Design System, Motion, Logo…). If the label is such a term, keep it as-is.
- Return strictly valid JSON with exactly these keys: ${targets.map((t) => `"${t}"`).join(', ')}. No commentary, no code fences.

Label (${LANG_NAME[sourceLang]}): ${JSON.stringify(name)}`

  try {
    const res = await anthropic.messages.create({
      model: TRANSLATE_MODEL,
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = res.content.map((b: any) => (b.type === 'text' ? b.text : '')).join('').trim()
    const obj = parseJsonObject(text)
    if (!obj) return { ok: false, error: 'Réponse IA illisible.' }

    const translations: Partial<Record<TaxoLang, string>> = {}
    for (const t of targets) {
      const v = obj[t]
      if (typeof v === 'string') translations[t] = v
    }
    return { ok: true, translations }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Échec de la traduction' }
  }
}
