import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

// Upsert d'un seuil XP manuel pour un bucket (ligue × spécialité).
export async function PUT(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const leagueId = typeof body.league_id === 'string' ? body.league_id : null
  const specialtyId = typeof body.specialty_id === 'string' ? body.specialty_id : null
  const xp = body.xp_threshold

  if (!leagueId || !specialtyId) {
    return NextResponse.json({ error: 'league_id et specialty_id requis' }, { status: 400 })
  }
  // Entier >= 0 (0 = override explicite « pas de barrière XP »).
  if (typeof xp !== 'number' || !Number.isInteger(xp) || xp < 0) {
    return NextResponse.json({ error: 'xp_threshold doit être un entier ≥ 0' }, { status: 400 })
  }

  const { error: dbErr } = await (admin!.supabase as any)
    .from('league_specialty_thresholds')
    .upsert(
      { league_id: leagueId, specialty_id: specialtyId, xp_threshold: xp, updated_at: new Date().toISOString() },
      { onConflict: 'league_id,specialty_id' },
    )

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Supprime l'override → le bucket repasse au calcul auto (fallback).
export async function DELETE(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const body = await request.json().catch(() => ({}))
  const leagueId = typeof body.league_id === 'string' ? body.league_id : null
  const specialtyId = typeof body.specialty_id === 'string' ? body.specialty_id : null

  if (!leagueId || !specialtyId) {
    return NextResponse.json({ error: 'league_id et specialty_id requis' }, { status: 400 })
  }

  const { error: dbErr } = await (admin!.supabase as any)
    .from('league_specialty_thresholds')
    .delete()
    .eq('league_id', leagueId)
    .eq('specialty_id', specialtyId)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
