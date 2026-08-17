import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  analyzeSubmissionForPublish,
  MAX_PUBLISH_IMAGES,
  type ImageInput,
} from '@/lib/utils/submissions'
import { specialtyMismatch, SPECIALTY_GUARD_MESSAGE } from '@/lib/challenges/specialty'
import { getAiRatelimit } from '@/lib/ratelimit'

export const maxDuration = 30

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Chaque appel qui arrive au bout de cette route paie une requête Anthropic, et
  // rien ici n'est mis en cache — contrairement à la route feedback. Le plafond
  // est posé avant tout travail.
  const rl = getAiRatelimit()
  if (rl) {
    const { success } = await rl.limit(`analyze:${user.id}`)
    if (!success) {
      return NextResponse.json({ error: 'Trop d\'analyses en peu de temps. Réessaie dans un moment.' }, { status: 429 })
    }
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const challengeId = typeof body.challenge_id === 'string' ? body.challenge_id : null
  const title = typeof body.title === 'string' ? body.title : ''
  const description = typeof body.description === 'string' ? body.description : ''
  const rawImages = Array.isArray(body.images) ? body.images : []

  if (!challengeId) return NextResponse.json({ error: 'challenge_id requis' }, { status: 400 })
  if (!title.trim()) return NextResponse.json({ error: 'Titre requis' }, { status: 400 })

  const images: ImageInput[] = rawImages
    .map((it: any) => ({ url: typeof it?.url === 'string' ? it.url : '', is_cover: !!it?.is_cover }))
    .filter((it: ImageInput) => !!it.url)
    .slice(0, MAX_PUBLISH_IMAGES)

  if (images.length === 0) return NextResponse.json({ error: 'Au moins une image requise' }, { status: 400 })
  if (!images.some((i) => i.is_cover)) return NextResponse.json({ error: 'Cover requise' }, { status: 400 })

  const { data: challenge } = await (supabaseAdmin as any)
    .from('challenges')
    .select('id, brief, context, deliverable, constraints, criteria, specialty, specialty_id, leagues(name)')
    .eq('id', challengeId)
    .single()
  if (!challenge) return NextResponse.json({ error: 'Challenge introuvable' }, { status: 404 })

  // PHASE 4 — garde-fou cross-spé avant l'appel IA (anti-gaspillage de tokens).
  const { data: analyzeProfile } = await supabase
    .from('profiles').select('specialty_id').eq('id', user.id).single()
  const mismatch = specialtyMismatch(analyzeProfile?.specialty_id, challenge.specialty_id)
  if (mismatch) {
    return NextResponse.json({ error: SPECIALTY_GUARD_MESSAGE[mismatch], code: mismatch }, { status: 403 })
  }

  const leagueName = challenge.leagues?.name ?? null
  // AI no longer gates publishing — it analyzes every submission (all leagues) to
  // produce an informational verdict (match / no-match) that drives XP only.
  const result = await analyzeSubmissionForPublish(challenge, images, title, description)

  // Journal d'audit — ATTENDU, pas en fire-and-forget. Le `void` précédent
  // laissait la requête en vol : en serverless la fonction gèle au `return`, et
  // l'insertion mourait avant d'atteindre Supabase. Symptôme : 81 soumissions
  // portent un validation_status (donc la route a tourné des dizaines de fois)
  // alors que la table est restée vide. Le surcoût est négligeable ici — on sort
  // d'un appel Anthropic qui dure des secondes.
  const { error: logErr } = await (supabaseAdmin as any).from('ai_analysis_logs').insert({
    user_id: user.id,
    challenge_id: challengeId,
    submission_id: null,
    n_images: images.length,
    n_rejected: result.rejected_count,
    model: result.model,
    duration_ms: result.duration_ms,
    error: result.error ?? null,
  })
  // Un échec de journalisation ne doit pas faire échouer la publication, mais il
  // ne doit plus être invisible : c'est ce silence qui a masqué le bug.
  if (logErr) console.error('[ai_analysis_logs] insertion échouée:', logErr.message)

  return NextResponse.json({
    skipped: false,
    league: leagueName,
    global_valid: result.global_valid,
    rejected_count: result.rejected_count,
    images: result.images,
    description_bonus_eligible: result.description_bonus_eligible,
    description_bonus_reason: result.description_bonus_reason,
    model: result.model,
    duration_ms: result.duration_ms,
  })
}
