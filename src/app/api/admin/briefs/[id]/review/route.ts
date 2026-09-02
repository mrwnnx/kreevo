import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { validateBriefFields } from '@/components/features/brief/validate'

interface Params { params: Promise<{ id: string }> }

/**
 * POST /api/admin/briefs/[id]/review — { action: 'approve' | 'reject', reason? }.
 * Le seul contrôle humain avant qu'un brief B2B n'atteigne les designers, donc
 * deux pièges du chantier précédent à ne pas reproduire ici : les actions admin
 * de ce repo avalent silencieusement leurs erreurs (chaque écriture est lue et
 * remontée), et un UPDATE dont le WHERE ne matche aucune ligne renvoie 204 sans
 * erreur (chaque update est chaîné à `.select('id')`, la longueur du résultat
 * est ce qui prouve qu'une ligne a réellement été touchée).
 *
 * Approuver écrit à DEUX endroits, dans cet ordre précis : `companies
 * .first_brief_approved` D'ABORD, puis le brief. Cet ordre rend un retry sûr
 * après un échec partiel — si l'écriture du brief échoue alors que le drapeau
 * est déjà à `true`, relancer l'approbation refait le même update de
 * companies (idempotent, matche toujours) puis retente seulement le brief.
 * L'ordre inverse laisserait, en cas d'échec du second update, un brief publié
 * dont l'entreprise resterait bloquée en revue pour tous les briefs suivants.
 *
 * L'échéance est revalidée avec la même règle que la publication normale côté
 * entreprise — fin de journée UTC, cf. validate.ts — au lieu de réimplémenter
 * la comparaison : un brief resté en attente au-delà de sa deadline ne se
 * publie pas tel quel depuis l'admin non plus.
 */
export async function POST(request: Request, { params }: Params) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const action = body.action as 'approve' | 'reject' | undefined
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
  }
  if (action === 'reject' && !reason) {
    return NextResponse.json({ error: 'Motif de refus obligatoire' }, { status: 400 })
  }

  const { data: brief, error: fetchErr } = await admin!.supabase
    .from('briefs')
    .select('id, status, company_id, title, brief, deliverable, deadline_at')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  if (!brief) return NextResponse.json({ error: 'Brief introuvable' }, { status: 404 })
  if (brief.status !== 'pending_review') {
    return NextResponse.json({ error: "Ce brief n'est plus en attente de validation" }, { status: 409 })
  }

  if (action === 'reject') {
    const { data, error: updErr } = await admin!.supabase
      .from('briefs')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id)
      .eq('status', 'pending_review')
      .select('id')

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Le refus a échoué — réessaye.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  // action === 'approve'
  const { data: company, error: companyFetchErr } = await admin!.supabase
    .from('companies')
    .select('id, can_publish')
    .eq('id', brief.company_id)
    .maybeSingle()

  if (companyFetchErr) return NextResponse.json({ error: companyFetchErr.message }, { status: 500 })
  if (!company) return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 })

  const validation = validateBriefFields({
    action: 'publish',
    title: brief.title,
    brief: brief.brief,
    deliverable: brief.deliverable,
    deadlineAt: brief.deadline_at,
    maxResponsesRaw: null,
    canPublish: company.can_publish,
  })
  if (!validation.ok) {
    const messages: Record<string, string> = {
      cannot_publish: 'La publication est désactivée pour cette entreprise.',
      incomplete_for_publish: 'Ce brief est incomplet (titre, brief et livrable requis).',
      deadline_in_past: 'La date limite de ce brief est déjà passée.',
      invalid_max_responses: 'Plafond de réponses invalide.',
    }
    return NextResponse.json({ error: messages[validation.error] ?? 'Validation échouée' }, { status: 400 })
  }

  const { data: companyUpdate, error: companyErr } = await admin!.supabase
    .from('companies')
    .update({ first_brief_approved: true, updated_at: new Date().toISOString() })
    .eq('id', company.id)
    .select('id')

  if (companyErr) return NextResponse.json({ error: companyErr.message }, { status: 500 })
  if (!companyUpdate || companyUpdate.length === 0) {
    return NextResponse.json({ error: "La mise à jour de l'entreprise a échoué — réessaye." }, { status: 500 })
  }

  const { data: briefUpdate, error: briefErr } = await admin!.supabase
    .from('briefs')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending_review')
    .select('id')

  if (briefErr) return NextResponse.json({ error: briefErr.message }, { status: 500 })
  if (!briefUpdate || briefUpdate.length === 0) {
    return NextResponse.json({ error: 'La publication du brief a échoué — réessaye.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
