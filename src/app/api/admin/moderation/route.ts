import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function GET(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'comments'

  let data: unknown[] = []

  if (type === 'comments') {
    const { data: items } = await (admin!.supabase as any)
      .from('comments')
      .select('*, profiles(username, avatar_url), submissions(challenge_id, challenges(title))')
      .eq('is_reported', true)
      .order('created_at', { ascending: false })
    data = items ?? []
  } else if (type === 'human_review') {
    const { data: items } = await (admin!.supabase as any)
      .from('submissions')
      .select('id, title, description, cover_url, ai_analysis, ai_rejection_count, created_at, challenge_id, profiles:user_id(username, avatar_url), challenges(title, brief)')
      .eq('validation_status', 'pending_human_review')
      .order('created_at', { ascending: false })
    data = items ?? []
  } else if (type === 'briefs') {
    // La file de modération B2B : le seul contrôle humain avant qu'un brief
    // n'atteigne les designers, donc le contenu complet (pas un extrait) et
    // les colonnes de la fiche entreprise qui l'accompagnent à l'affichage.
    const { data: items } = await admin!.supabase
      .from('briefs')
      .select('id, title, context, brief, constraints, criteria, deliverable, created_at, companies(name, logo_url)')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true })
    data = items ?? []
  } else {
    const { data: items } = await (admin!.supabase as any)
      .from('submissions')
      .select('*, profiles(username, avatar_url), challenges(title)')
      .eq('is_reported', true)
      .order('created_at', { ascending: false })
    data = items ?? []
  }

  return NextResponse.json({ items: data })
}
