import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { buildI18nColumns } from '@/lib/challenges/columns'
import { resolveSpecialtyId } from '@/lib/challenges/specialty'

export async function GET(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const leagueId = searchParams.get('league_id')

  let query = (admin!.supabase as any)
    .from('challenges')
    .select('*, leagues(id, name, icon), challenge_types(name_fr), industries(name_fr)')
    .order('created_at', { ascending: false })

  if (leagueId) query = query.eq('league_id', leagueId)

  const { data: challenges } = await query
  return NextResponse.json({ challenges: challenges ?? [] })
}

export async function POST(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const body = await request.json()

  // PHASE 4 — un challenge DOIT avoir une specialty_id (sinon imparticipable avec
  // le garde-fou cross-spé). On résout le texte → FK et on refuse si inconnu.
  const specialtyResolved = await resolveSpecialtyId(body.specialty, admin!.supabase as any)
  if ('error' in specialtyResolved) {
    return NextResponse.json({ error: specialtyResolved.error }, { status: 400 })
  }

  const { data, error: dbErr } = await (admin!.supabase as any)
    .from('challenges')
    .insert({
      // Localized text fields (18 columns) + legacy mirror + source_lang + status.
      ...buildI18nColumns(body),
      league_id: body.league_id || null,
      xp_reward: body.xp_reward || null,
      deadline_days: body.deadline_days || null,
      is_published: body.is_published ?? false,
      specialty: body.specialty || null,
      specialty_id: specialtyResolved.id, // PHASE 4 — FK résolue (texte gardé jusqu'à PHASE 7)
      emoji: body.emoji || null,
      // Type / industry are now FK-only (legacy text columns no longer written).
      ...(body.challenge_type_id ? { challenge_type_id: body.challenge_type_id } : {}),
      ...(body.industry_id ? { industry_id: body.industry_id } : {}),
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ challenge: data })
}
