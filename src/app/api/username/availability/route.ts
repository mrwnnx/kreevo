import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isValidUsername } from '@/lib/username'

/**
 * Public endpoint used by the signup and profile-edit forms to tell the user
 * in real time whether a candidate username is well-formed and available.
 *
 *   GET /api/username/availability?u=foo[&self=<viewerId>]
 *     → { valid: boolean, available: boolean }
 *
 * `self` lets the profile editor exclude the viewer's current row from the
 * uniqueness check so that re-saving an unchanged username does not flag it
 * as taken. The viewer's own id is supplied client-side from a public field
 * (already exposed in their session); no auth is required here because the
 * endpoint reveals only public information (username existence).
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const candidate = (url.searchParams.get('u') ?? '').trim()
  const self = url.searchParams.get('self')?.trim() || null

  if (!isValidUsername(candidate)) {
    return NextResponse.json({ valid: false, available: false })
  }

  let query = (supabaseAdmin as any)
    .from('profiles')
    .select('id', { head: true, count: 'exact' })
    .eq('username', candidate)

  if (self) query = query.neq('id', self)

  const { count } = await query
  const taken = (count ?? 0) > 0

  return NextResponse.json({ valid: true, available: !taken })
}
