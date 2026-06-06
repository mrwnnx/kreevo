import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidUsername } from '@/lib/username'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const allowed = [
    'full_name',
    'username',
    'bio',
    'country',
    'city',
    'specialty',
    'specialty_id',
    'objective',
    'objectives',
    'tools',
    'links',
    'avatar_url',
    'first_name',
    'last_name',
    'experience_level',
    'job_title',
    'behance_url',
    'linkedin_url',
    'onboarding_completed',
  ]
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  if (update.username !== undefined) {
    const candidate =
      typeof update.username === 'string' ? update.username.trim() : ''
    if (!isValidUsername(candidate)) {
      return NextResponse.json(
        { error: 'Invalid username format', code: 'INVALID_USERNAME' },
        { status: 400 },
      )
    }
    update.username = candidate

    const { data: existing } = await (supabase as any)
      .from('profiles')
      .select('id')
      .eq('username', candidate)
      .neq('id', user.id)
      .maybeSingle()
    if (existing) {
      return NextResponse.json(
        { error: 'Username already taken', code: 'USERNAME_TAKEN' },
        { status: 409 },
      )
    }
  }

  // PHASE 5 — normaliser vers specialty_id (FK), source de vérité du modèle scopé.
  //   - onboarding (dynamique) envoie directement `specialty_id` → on VALIDE qu'il
  //     pointe une spé ACTIVE (jamais écrire un UUID arbitraire).
  //   - l'ancien formulaire profil envoie le slug texte `specialty` → on le résout
  //     par slug en DB (PAS le resolver regex PHASE 4, figé ux_ui/graphic).
  if (update.specialty_id) {
    const { data: spec } = await (supabase as any)
      .from('specialties')
      .select('id')
      .eq('id', update.specialty_id)
      .eq('is_active', true)
      .maybeSingle()
    if (!spec) {
      return NextResponse.json({ error: 'Spécialité invalide', code: 'INVALID_SPECIALTY' }, { status: 400 })
    }
  } else if (typeof update.specialty === 'string' && update.specialty) {
    const { data: spec } = await (supabase as any)
      .from('specialties')
      .select('id')
      .eq('slug', update.specialty)
      .eq('is_active', true)
      .maybeSingle()
    // Échec BRUYANT : un slug qui ne résout pas à une spé active est refusé (jamais
    // d'écriture texte avec specialty_id NULL → ne recrée pas le bug FK-NULL PHASE 4).
    if (!spec) {
      return NextResponse.json({ error: 'Spécialité invalide', code: 'INVALID_SPECIALTY' }, { status: 400 })
    }
    update.specialty_id = spec.id
  }

  // Specialty change: allowed only while in Stone/Bronze (forfeits progression
  // and restarts from zero), locked from Silver and above. Keyed on specialty_id (FK).
  let specialtyReset = false
  if (update.specialty_id) {
    const { data: current } = await (supabase as any)
      .from('profiles')
      .select('specialty_id, onboarding_completed, league')
      .eq('id', user.id)
      .single()
    const changing =
      current?.onboarding_completed &&
      current?.specialty_id &&
      current.specialty_id !== update.specialty_id
    if (changing) {
      // Tiers that still allow a free discipline switch.
      const UNLOCKED = ['stone', 'bronze']
      const currentLeague = (current.league ?? 'Stone').toLowerCase()
      if (!UNLOCKED.includes(currentLeague)) {
        return NextResponse.json(
          { error: 'Specialty cannot be changed from Silver onward', code: 'SPECIALTY_LOCKED' },
          { status: 403 },
        )
      }
      // Allowed: forfeit progression and restart in the new discipline.
      update.xp = 0
      update.league = 'Stone'
      update.league_entered_at = new Date().toISOString()
      specialtyReset = true
    }
  }

  if (update.first_name || update.last_name) {
    const { data: current } = await (supabase as any)
      .from('profiles')
      .select('first_name, last_name, full_name')
      .eq('id', user.id)
      .single()
    const first = (update.first_name as string) ?? current?.first_name ?? ''
    const last = (update.last_name as string) ?? current?.last_name ?? ''
    const composed = `${first} ${last}`.trim()
    if (composed) update.full_name = composed
  }

  update.updated_at = new Date().toISOString()
  const { error } = await (supabase as any)
    .from('profiles')
    .update(update)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, specialtyReset })
}
