import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select(
      'id, username, full_name, first_name, last_name, avatar_url, country, specialty, specialty_id, tools, objectives, experience_level, behance_url, linkedin_url, onboarding_completed'
    )
    .eq('id', user.id)
    .single()

  return NextResponse.json({ profile })
}
