import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface Props { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Props) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  // Plus de seuil XP ici : il n'existe pas au niveau ligue (seuils par bucket
  // ligue × spécialité, cf. /admin/specialties/[id]/leagues). On ne renvoie que
  // le nombre de challenges publiés de la ligue (toutes spés).
  const challengeCount = await supabaseAdmin
    .from('challenges')
    .select('*', { count: 'exact', head: true })
    .eq('league_id', id)
    .eq('is_published', true)
    .then(r => r.count ?? 0)

  return NextResponse.json({ challengeCount })
}
