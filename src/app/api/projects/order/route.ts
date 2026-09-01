import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const MAX_ORDER_ITEMS = 200

interface OrderItem {
  id: string
  position: number
}

/**
 * `items` is the ordered showcase (challenge + portfolio rows mixed — order
 * applies to the author's whole vitrine, see spec.md). Empty and >200-entry
 * arrays are rejected, and every `position` must be a positive integer —
 * this repo's routes historically have no input guard at all, so this is
 * exactly the floor asked for, nothing more (no uniqueness/contiguity check).
 */
function parseItems(raw: unknown): OrderItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_ORDER_ITEMS) return null
  const items: OrderItem[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') return null
    const { id, position } = entry as Record<string, unknown>
    if (typeof id !== 'string' || id.length === 0) return null
    if (typeof position !== 'number' || !Number.isInteger(position) || position <= 0) return null
    items.push({ id, position })
  }
  return items
}

/**
 * PATCH /api/projects/order
 * Body: `{ items: { id: string; position: number }[], pinnedId?: string | null }`
 *
 * `items` reorders `portfolio_position` for both submission kinds — an
 * author can intercalate a challenge submission between two personal
 * projects, the whole showcase is one ordered list (spec.md).
 *
 * `pinnedId`, when present in the body (including explicit `null`), sets
 * the single pinned submission: a string pins that row and unpins whatever
 * was pinned before across the caller's ENTIRE showcase (not just the rows
 * in `items`), `null` clears the pin. Omitting the key entirely leaves the
 * pin state untouched. Only one submission can be pinned at a time — by
 * design, simpler than a free pin count and it avoids an all-pinned vitrine.
 *
 * Security: the id list (items + pinnedId) is ownership-checked in a single
 * query BEFORE any write — a single foreign id rejects the whole request
 * with 403 and writes nothing. `submissions` carries an owner UPDATE policy
 * (`submissions_owner_update`, verified live 2026-09-01 — see
 * src/components/features/portfolio/actions.ts) but no RLS decision is
 * trusted here: `supabaseAdmin` is used for the ownership check itself
 * (RLS's public-visibility branch would otherwise make someone else's
 * publicly visible submission look "visible" through the session client,
 * which is not the same as "owned") and for the writes, which stay
 * additionally scoped by `.eq('user_id', user.id)` as defense in depth.
 *
 * Each row's `portfolio_position` is written with its own targeted UPDATE
 * rather than a single upsert — `submissions` has NOT NULL columns with no
 * default (e.g. `cover_url`) that a partial-column upsert would try to
 * re-validate via its INSERT-tuple path even on the ON CONFLICT DO UPDATE
 * branch. A plain UPDATE only touches the column(s) it sets, so it can't
 * trip that. The pin/unpin pair are each a single UPDATE statement (atomic
 * on their own, and the "clear" one already covers every previously pinned
 * row in one statement regardless of how many there are).
 */
export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const items = parseItems((body as Record<string, unknown> | null)?.items)
  if (!items) return NextResponse.json({ error: 'Invalid items' }, { status: 400 })

  const hasPinChange = !!body && Object.prototype.hasOwnProperty.call(body, 'pinnedId')
  const rawPinned = hasPinChange ? (body as Record<string, unknown>).pinnedId : undefined
  if (hasPinChange && rawPinned !== null && typeof rawPinned !== 'string') {
    return NextResponse.json({ error: 'Invalid pinnedId' }, { status: 400 })
  }
  const pinnedId = (rawPinned ?? null) as string | null

  // Ownership check — every id this request touches (items + pinnedId),
  // in one query, via the service role client so RLS's "publicly visible"
  // branch can't be mistaken for ownership.
  const ids = Array.from(new Set([
    ...items.map((i) => i.id),
    ...(hasPinChange && pinnedId ? [pinnedId] : []),
  ]))
  const { data: owned, error: ownError } = await supabaseAdmin
    .from('submissions')
    .select('id')
    .in('id', ids)
    .eq('user_id', user.id)
  if (ownError) return NextResponse.json({ error: ownError.message }, { status: 500 })
  if (!owned || owned.length !== ids.length) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const writes = await Promise.all(
    items.map((item) =>
      supabaseAdmin
        .from('submissions')
        .update({ portfolio_position: item.position })
        .eq('id', item.id)
        .eq('user_id', user.id)
    )
  )
  const writeError = writes.find((w) => w.error)?.error
  if (writeError) return NextResponse.json({ error: writeError.message }, { status: 500 })

  if (hasPinChange) {
    const clearQuery = supabaseAdmin
      .from('submissions')
      .update({ pinned_at: null })
      .eq('user_id', user.id)
    const { error: clearError } = pinnedId
      ? await clearQuery.neq('id', pinnedId)
      : await clearQuery
    if (clearError) return NextResponse.json({ error: clearError.message }, { status: 500 })

    if (pinnedId) {
      const { error: pinError } = await supabaseAdmin
        .from('submissions')
        .update({ pinned_at: new Date().toISOString() })
        .eq('id', pinnedId)
        .eq('user_id', user.id)
      if (pinError) return NextResponse.json({ error: pinError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
