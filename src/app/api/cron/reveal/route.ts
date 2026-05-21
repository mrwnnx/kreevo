import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  // Find challenges whose reveal_at has passed
  const { data: challenges, error: cErr } = await (supabase as any)
    .from('challenges')
    .select('id')
    .lte('reveal_at', new Date().toISOString())
    .eq('status', 'active')

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })
  if (!challenges?.length) return NextResponse.json({ revealed: 0 })

  const challengeIds = challenges.map((c: any) => c.id)

  const { data, error } = await (supabase as any)
    .from('submissions')
    .update({ is_visible: true })
    .in('challenge_id', challengeIds)
    .eq('is_visible', false)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ revealed: data?.length ?? 0, challengeIds })
}

// Vercel Cron triggers a GET request — alias it to the same handler.
export const GET = POST
