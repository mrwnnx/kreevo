import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic/client'
import { getBriefImproveRatelimit } from '@/lib/ratelimit'

export const maxDuration = 30

/**
 * POST /api/briefs/improve — reformule UN champ d'un brief à la demande.
 * Renvoie une proposition, n'écrit RIEN en base : c'est BriefForm (client) qui
 * décide d'appliquer ou non (accepter/refuser). Le B2B garde la main du début
 * à la fin, cf. spec.md §Parcours du B2B point 5.
 *
 * N'importe rien depuis `src/lib/utils/submissions.ts` : ce fichier instancie
 * le SDK Anthropic au niveau module et casse le build Turbopack dès qu'un
 * composant client se trouve dans la chaîne d'imports. `@/lib/anthropic/client`
 * fait la même chose mais n'est importé que par du code serveur (routes,
 * server actions) — jamais par un composant client.
 *
 * C'est la seule route de ce lot qui dépense de l'argent à chaque appel :
 * l'ordre des gardes est authentification → propriété d'une entreprise →
 * plafond dédié (avant de lire/valider le corps, même convention que
 * /api/help/contact et /api/submissions/analyze : un spam de payloads
 * invalides est capé lui aussi) → validation d'entrée → appel Anthropic.
 */

const FIELDS = ['title', 'context', 'brief', 'constraints', 'criteria', 'deliverable'] as const
type Field = (typeof FIELDS)[number]

const FIELD_LABEL: Record<Field, string> = {
  title: 'le titre du brief',
  context: "le contexte (présentation de l'entreprise et du projet)",
  brief: "le brief (l'exercice demandé aux designers)",
  constraints: 'les contraintes',
  criteria: 'les critères de réussite',
  deliverable: 'le livrable attendu',
}

const MODEL = 'claude-sonnet-4-6'
const MAX_VALUE_LENGTH = 4000
// Troncature défensive du contexte (pas un refus — le champ demandé, lui, est
// borné par un vrai 400) : un `context.<field>` disproportionné ferait gonfler
// le coût du prompt sans que ce soit ce qui est reformulé.
const MAX_CONTEXT_FIELD_LENGTH = 4000

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!company) return NextResponse.json({ error: 'no_company' }, { status: 403 })

  // Plafond DÉDIÉ (rl:brief-improve, cf. src/lib/ratelimit.ts) — jamais le seau
  // de getAiRatelimit(), qui protège les routes de soumission. FAIL-OPEN sans
  // UPSTASH_REDIS_REST_URL/_TOKEN : rl vaut alors null et rien n'est plafonné.
  const rl = getBriefImproveRatelimit()
  if (rl) {
    const { success } = await rl.limit(`improve:${user.id}`)
    if (!success) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    }
  }

  const body = await req.json().catch(() => ({}) as Record<string, unknown>)
  const field = typeof body.field === 'string' ? body.field : ''
  const value = typeof body.value === 'string' ? body.value.trim() : ''
  const rawContext =
    body.context && typeof body.context === 'object' ? (body.context as Record<string, unknown>) : {}

  if (!FIELDS.includes(field as Field)) {
    return NextResponse.json({ error: 'invalid_field' }, { status: 400 })
  }
  if (!value || value.length > MAX_VALUE_LENGTH) {
    return NextResponse.json({ error: 'invalid_value' }, { status: 400 })
  }

  const context: Partial<Record<Field, string>> = {}
  for (const f of FIELDS) {
    if (f === field) continue
    const v = rawContext[f]
    if (typeof v === 'string' && v.trim()) context[f] = v.trim().slice(0, MAX_CONTEXT_FIELD_LENGTH)
  }

  const contextLines = FIELDS
    .filter((f) => f !== field && context[f])
    .map((f) => `- ${FIELD_LABEL[f]} : ${context[f]}`)
    .join('\n')

  const prompt = `Tu aides une entreprise à rédiger ${FIELD_LABEL[field as Field]} d'un brief destiné à des designers freelances, sur une plateforme de challenges créatifs.

Voici ce que l'entreprise a écrit pour ce champ :
"""
${value}
"""
${contextLines ? `\nAutres champs déjà rédigés par la même entreprise, pour rester cohérent avec eux :\n${contextLines}\n` : ''}
Reformule UNIQUEMENT ce champ pour le rendre plus clair, plus précis et mieux écrit. Réponds dans la MÊME LANGUE que le texte d'origine (français, anglais ou arabe). Garde le même sens et les mêmes informations factuelles, n'invente rien de nouveau. Réponds avec le texte reformulé SEUL — sans préambule, sans guillemets, sans commentaire.`

  // Compteur d'appels réellement partis chez Anthropic — pour que la facture
  // ne se découvre jamais après coup (exigence explicite du ticket).
  console.log(`[briefs/improve] anthropic call — user=${user.id} field=${field} value_chars=${value.length}`)

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const suggestion = response.content
      .map((b: any) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim()
    if (!suggestion) return NextResponse.json({ error: 'empty_response' }, { status: 502 })
    return NextResponse.json({ suggestion })
  } catch (err) {
    console.error('[briefs/improve] anthropic error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'ai_failed' }, { status: 502 })
  }
}
