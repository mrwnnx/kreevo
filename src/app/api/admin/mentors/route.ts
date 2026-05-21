import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await (supabase as any).from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: NextResponse.json({ error: 'Admin only' }, { status: 403 }) }
  return { user }
}

export const MENTOR_FIELDS = [
  'name', 'title', 'avatar_url', 'bio_short', 'bio_long',
  'specialty', 'tone', 'obsessions', 'system_prompt', 'is_active', 'language',
]

export async function GET() {
  const a = await requireAdmin()
  if (a.error) return a.error
  const { data } = await (supabaseAdmin as any).from('ai_mentors').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ mentors: data ?? [] })
}

export async function POST(request: Request) {
  const a = await requireAdmin()
  if (a.error) return a.error
  const body = await request.json()
  const row: Record<string, unknown> = {}
  for (const f of MENTOR_FIELDS) if (f in body) row[f] = body[f]
  if (!row.name || !row.title || !row.bio_short || !row.specialty || !row.tone || !row.system_prompt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const { data, error } = await (supabaseAdmin as any).from('ai_mentors').insert(row).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ mentor: data })
}
