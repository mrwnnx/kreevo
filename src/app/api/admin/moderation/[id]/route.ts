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

    const patch = sub.kind === SUBMISSION_KIND_PORTFOLIO
      ? { is_visible: true }
      : { validation_status: 'approved' }

    const { data, error: dbError } = await (admin!.supabase as any)
      .from('submissions').update(patch).eq('id', id).select('id')
    if (dbError || !data?.length) {
      return NextResponse.json({ error: dbError?.message ?? 'Échec de la mise à jour' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}
