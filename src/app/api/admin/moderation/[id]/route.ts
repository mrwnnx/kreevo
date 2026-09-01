import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { SUBMISSION_KIND_PORTFOLIO } from '@/lib/utils/submission-constants'

interface Props { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const { type, action } = await request.json()

  if (type === 'comments') {
    if (action === 'ignore') {
      const { data, error: dbError } = await (admin!.supabase as any)
        .from('comments').update({ is_reported: false }).eq('id', id).select('id')
      if (dbError || !data?.length) {
        return NextResponse.json({ error: dbError?.message ?? 'Commentaire introuvable' }, { status: 404 })
      }
      return NextResponse.json({ ok: true })
    }
    if (action === 'delete') {
      const { data, error: dbError } = await (admin!.supabase as any)
        .from('comments').delete().eq('id', id).select('id')
      if (dbError || !data?.length) {
        return NextResponse.json({ error: dbError?.message ?? 'Commentaire introuvable' }, { status: 404 })
      }
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
  }

  // type === 'submissions'
  if (action === 'delete') {
    const { data, error: dbError } = await (admin!.supabase as any)
      .from('submissions').delete().eq('id', id).select('id')
    if (dbError || !data?.length) {
      return NextResponse.json({ error: dbError?.message ?? 'Soumission introuvable' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'hide') {
    // Admin take-down of a personal project, reachable from
    // /admin/submissions/[id] before the 3-report threshold is met.
    // Deliberately the same patch shape the threshold applies in
    // api/submissions/[id]/report — is_visible=false + reported_at — so
    // 'ignore' below restores it identically either way. Refused on a
    // challenge submission: that one is gated by validation_status, and
    // flipping is_visible there would leave it in no queue at all.
    const { data: sub, error: fetchError } = await (admin!.supabase as any)
      .from('submissions').select('kind').eq('id', id).single()
    if (fetchError || !sub) {
      return NextResponse.json({ error: fetchError?.message ?? 'Soumission introuvable' }, { status: 404 })
    }
    if (sub.kind !== SUBMISSION_KIND_PORTFOLIO) {
      return NextResponse.json(
        { error: 'Masquer ne s\u2019applique qu\u2019\u00e0 un projet perso. Utilise Rejeter pour une soumission de challenge.' },
        { status: 409 },
      )
    }

    const { data, error: dbError } = await (admin!.supabase as any)
      .from('submissions')
      .update({ is_visible: false, reported_at: new Date().toISOString() })
      .eq('id', id)
      .select('id')
    if (dbError || !data?.length) {
      return NextResponse.json({ error: dbError?.message ?? '\u00c9chec de la mise \u00e0 jour' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'ignore') {
    // "Ignorer" = lever le hold. Le champ à restaurer dépend du type : une
    // soumission de challenge est masquée par validation_status (la RLS
    // n'accepte que 'approved'), un projet perso par is_visible (la RLS
    // l'accepte quel que soit validation_status).
    const { data: sub, error: fetchError } = await (admin!.supabase as any)
      .from('submissions').select('kind').eq('id', id).single()
    if (fetchError || !sub) {
      return NextResponse.json({ error: fetchError?.message ?? 'Soumission introuvable' }, { status: 404 })
    }

    // Reset the report counter with it: `reports_count` never decreases on
    // its own, so without this a restored item is one report — not three —
    // away from being auto-hidden again. `submission_reports` rows are kept
    // (this only clears a denormalized counter, not the report history).
    const patch = sub.kind === SUBMISSION_KIND_PORTFOLIO
      ? { is_visible: true, reports_count: 0, reported_at: null }
      : { validation_status: 'approved', reports_count: 0, reported_at: null }

    const { data, error: dbError } = await (admin!.supabase as any)
      .from('submissions').update(patch).eq('id', id).select('id')
    if (dbError || !data?.length) {
      return NextResponse.json({ error: dbError?.message ?? 'Échec de la mise à jour' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}
