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
 *
 * Every UPDATE that targets a specific, already-ownership-verified id
 * chains `.select('id')` and checks that a row actually came back —
 * `{ error: null }` alone does NOT mean a row was touched under RLS/PostgREST:
 * a WHERE that matches nothing still returns success with zero rows changed
 * (the exact silent-no-op shape the DELETE-policy bug in this chantier
 * already produced once). The ownership pre-check makes a genuine mismatch
 * here unexpected, but "unexpected" is not "impossible" (a row could vanish
 * between the check and the write), so it's still verified, not assumed.
 * The bulk "clear previous pin" UPDATE is the one exception: it's filtered
 * only by `user_id = user.id` (server-derived from the session, never
 * client input, so there's no ownership mismatch it could hide) and zero
 * rows is its normal outcome whenever nothing was pinned before — so its
 * row count is observed but not treated as a failure signal.
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
        .select('id')
    )
  )
  const writeError = writes.find((w) => w.error)?.error
  if (writeError) return NextResponse.json({ error: writeError.message }, { status: 500 })
  // `{ error: null }` is not proof of a write — a WHERE that matches nothing
  // returns exactly that shape. Every item here already passed the ownership
  // check above, so a 0-row result means the write silently didn't happen.
  const unmatched = writes.find((w) => !w.data || w.data.length === 0)
  if (unmatched) {
    return NextResponse.json({ error: 'A position write matched no row' }, { status: 500 })
  }

  if (hasPinChange) {
    const clearQuery = supabaseAdmin
      .from('submissions')
      .update({ pinned_at: null })
      .eq('user_id', user.id)
      .not('pinned_at', 'is', null) // only rows that actually need clearing —
      // without this, `.eq('user_id', …)` alone matches every OTHER row the
      // user owns (touched empirically: 12 rows came back on a save with
      // nothing else pinned), which is harmless value-wise but makes "0 rows
      // matched" meaningless as a signal. With it, 0 really does mean
      // "nothing was pinned before", matching the reasoning below.
      .select('id')
    const { error: clearError } = pinnedId
      ? await clearQuery.neq('id', pinnedId)
      : await clearQuery
    // No row-count gate here on purpose — see the doc comment above: this
    // clears "whatever was pinned before, if anything", and 0 is a normal
    // outcome (nothing was pinned). `.select('id')` is kept for the same
    // prove-it discipline, just not treated as a failure signal.
    if (clearError) return NextResponse.json({ error: clearError.message }, { status: 500 })

    if (pinnedId) {
      const { data: pinData, error: pinError } = await supabaseAdmin
        .from('submissions')
        .update({ pinned_at: new Date().toISOString() })
        .eq('id', pinnedId)
        .eq('user_id', user.id)
        .select('id')
      if (pinError) return NextResponse.json({ error: pinError.message }, { status: 500 })
      if (!pinData || pinData.length === 0) {
        return NextResponse.json({ error: 'Pin write matched no row' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ ok: true })
}
