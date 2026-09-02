import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateBriefAccessToken } from '@/lib/utils/brief-token'

interface Params { params: Promise<{ id: string }> }

/**
 * Régénère le jeton du lien privé d'un brief — invalide l'ancien lien
 * immédiatement. Propriété vérifiée par company_id (RLS + `.eq` explicite),
 * et succès conditionné à une ligne réellement modifiée : un UPDATE dont le
 * WHERE ne matche rien renvoie 204 sans erreur, piège connu de ce repo.
 */
export async function POST(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })

  const { id } = await params

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!company) return NextResponse.json({ error: 'no_company' }, { status: 403 })

  const { data: brief } = await supabase
    .from('briefs')
    .select('id, visibility')
    .eq('id', id)
    .eq('company_id', company.id)
    .maybeSingle()
  if (!brief) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (brief.visibility !== 'private') {
    return NextResponse.json({ error: 'not_private' }, { status: 400 })
  }

  const accessToken = generateBriefAccessToken()

  const { data, error } = await supabase
    .from('briefs')
    .update({ access_token: accessToken })
    .eq('id', id)
    .eq('company_id', company.id)
    .select('id')

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, accessToken })
}
