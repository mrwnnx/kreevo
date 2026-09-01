'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { SUBMISSION_KIND_PORTFOLIO } from '@/lib/utils/submission-constants'
import type { Json } from '@/types/database.types'

// NOTE: never import from '@/lib/utils/submissions' here — it instantiates
// the Anthropic SDK at module top-level, which breaks the client bundle this
// file is imported from (ProjectForm is a 'use client' component).

const SUBMISSIONS_BUCKET = 'submissions'

/**
 * Extracts a Storage object path from a public `submissions` bucket URL,
 * but only when it demonstrably belongs to `userId`. Anything else — a
 * different bucket, a malformed URL, a path that doesn't start with this
 * user's id — returns null instead of guessing. `files.images[].url` is
 * user-editable JSON; without this check a forged entry could delete
 * another user's storage objects.
 */
function extractOwnedStoragePath(url: unknown, userId: string): string | null {
  if (typeof url !== 'string') return null
  const marker = `/storage/v1/object/public/${SUBMISSIONS_BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  const path = url.slice(idx + marker.length)
  if (!path || !path.startsWith(`${userId}/`)) return null
  return path
}

/**
 * Single write path for a portfolio project — create and edit alike.
 * A portfolio project is never validated, never earns XP, and is never
 * attached to a challenge (enforced here AND by the DB check constraint
 * `submissions_portfolio_no_challenge`).
 */
export async function saveProject(formData: FormData): Promise<
  { ok: true; id: string } | { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const id = (formData.get('id') as string | null) || null
  const coverUrl = ((formData.get('coverUrl') as string | null) || '').trim()
  const title = ((formData.get('title') as string | null) || '').trim()
  const description = ((formData.get('description') as string | null) || '').trim() || null
  const link = ((formData.get('link') as string | null) || '').trim()
  const specialtyId = (formData.get('specialtyId') as string | null) || ''
  const industryId = (formData.get('industryId') as string | null) || ''
  const projectTypeId = (formData.get('projectTypeId') as string | null) || ''
  const publish = formData.get('publish') === '1'

  // A draft only needs a cover — `submissions.cover_url` is NOT NULL, so
  // that much is unavoidable regardless of draft/publish. Everything else
  // (title, taxonomy) is required to PUBLISH only: a draft exists precisely
  // so someone can start a project and come back to finish it later.
  if (!coverUrl) return { ok: false, error: 'Image de couverture requise' }

  let photos: { url: string; caption: string }[] = []
  try {
    const parsed = JSON.parse((formData.get('photos') as string | null) || '[]')
    if (Array.isArray(parsed)) {
      photos = parsed
        .map((p: any) => ({ url: String(p?.url ?? ''), caption: String(p?.caption ?? '') }))
        .filter((p) => p.url)
        .slice(0, 7)
    }
  } catch {}

  let tools: string[] = []
  try {
    const parsed = JSON.parse((formData.get('tools') as string | null) || '[]')
    if (Array.isArray(parsed)) {
      tools = parsed.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    }
  } catch {}

  // Publish-only gate — never applied to a draft. The server never trusts the
  // client's disabled-button state: this runs regardless of what validate()
  // did (or didn't) check in ProjectForm, since a draft can be posted directly.
  if (publish) {
    if (!title) return { ok: false, error: 'Un titre est requis pour publier' }
    if (!specialtyId || !industryId || !projectTypeId || tools.length === 0) {
      return { ok: false, error: 'Spécialité, industrie, type de projet et au moins un outil sont requis pour publier' }
    }
  }

  const files: Record<string, Json> = {}
  if (link) files.link = link
  if (photos.length) files.images = photos as unknown as Json

  const row = {
    kind: SUBMISSION_KIND_PORTFOLIO,
    challenge_id: null,
    user_id: user.id,
    cover_url: coverUrl,
    title: title || null,
    description,
    files: Object.keys(files).length ? (files as Json) : null,
    // Empty string, not null, is what an unfilled <select> posts — and these
    // are uuid columns, so '' would fail the insert with "invalid input
    // syntax for type uuid" instead of saving the draft. Normalize to null.
    specialty_id: specialtyId || null,
    industry_id: industryId || null,
    project_type_id: projectTypeId || null,
    tools,
    is_draft: !publish,
    is_visible: publish,
    // Explicit null, not an omission: `validation_status` defaults to
    // 'pending' and `xp_earned` to 0 at the column level (measured on
    // `submissions` — neither defaults to null). Leaving them out would let
    // every published portfolio row default to validation_status='pending',
    // which silently leaks it into /admin/submissions?tab=pending (filtered
    // on `validation_status = 'pending'` with no `kind` check) — a real
    // moderation-queue bug, not a cosmetic one. Nulling both here is the
    // "no write" the ticket asks for; ai_* fields are left untouched since
    // their defaults (false/0, NOT NULL) don't cause the same leak.
    validation_status: null,
    xp_earned: null,
  }

  if (id) {
    // Ownership + kind guard: this action must never repurpose a challenge
    // submission (or someone else's row) into a portfolio project.
    const { data: existing } = await supabase
      .from('submissions')
      .select('id, kind')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!existing) return { ok: false, error: 'Projet introuvable' }
    if (existing.kind !== SUBMISSION_KIND_PORTFOLIO) {
      return { ok: false, error: "Ce projet n'est pas un projet de portfolio" }
    }

    const { error } = await supabase
      .from('submissions')
      .update(row)
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) return { ok: false, error: error.message }

    revalidatePath('/dashboard/projects')
    return { ok: true, id }
  }

  const { data, error } = await supabase
    .from('submissions')
    .insert(row)
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard/projects')
  return { ok: true, id: data.id }
}

/**
 * Owner-only publish of an existing draft, without going through the form.
 * Re-checks the same publish gate as `saveProject` server-side (title +
 * full taxonomy) since a draft only ever guaranteed a cover.
 */
export async function publishProject(id: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('submissions')
    .select('id, kind, title, specialty_id, industry_id, project_type_id, tools')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!existing) return { ok: false, error: 'Projet introuvable' }
  if (existing.kind !== SUBMISSION_KIND_PORTFOLIO) {
    return { ok: false, error: "Ce projet n'est pas un projet de portfolio" }
  }
  if (!existing.title || !existing.specialty_id || !existing.industry_id || !existing.project_type_id || !existing.tools?.length) {
    return { ok: false, error: 'Titre, spécialité, industrie, type de projet et au moins un outil sont requis pour publier' }
  }

  const { error } = await supabase
    .from('submissions')
    .update({ is_draft: false, is_visible: true })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard/projects')
  return { ok: true }
}

/**
 * Owner-only delete of a portfolio project.
 *
 * `submissions` carries no DELETE policy (checked live in `pg_policies`,
 * 2026-09-01: only `submissions_owner_insert`, `submissions_visible`, and
 * `submissions_owner_update` exist) — by design, since a DELETE policy
 * would also let a challenge submission's author delete it, which the
 * product refuses. So a delete through the session-scoped client matches
 * zero rows under RLS: no error, `error` stays null, and the row survives
 * — the exact silent-no-op shape as the profiles bug (19/75 undeletable)
 * this ticket is named after. Every other write in this repo that needs
 * to get past RLS goes through `supabaseAdmin` (see migration 008's
 * comment); the delete does too, but only AFTER the ownership+kind check
 * below, which is the actual authorization gate — `supabaseAdmin` is not
 * queried until the row is confirmed to belong to this user.
 *
 * All FKs pointing at submissions.id cascade (comments, feedbacks,
 * submission_contests, submission_feedbacks, submission_likes,
 * submission_reports; comment_likes and comments.parent_id cascade in turn
 * off comments) — verified against pg_constraint, 2026-09-01. A single
 * DELETE therefore cleans up every child row in one transaction; no manual
 * per-table cleanup.
 *
 * `.select('id')` on the delete is what actually proves a row was removed:
 * checking only `error` would have hidden this exact bug, since a delete
 * that matches nothing still returns `error: null`.
 *
 * Storage cleanup (cover + `files.images[].url`) is collected BEFORE the
 * delete — once the row is gone there is no way to know which files were
 * ever attached to it — and removed AFTER, best-effort: a Storage failure
 * is logged, never surfaced as a failed deletion. The row is gone, which is
 * what the user cares about; an orphaned file is a cleanup job, not a
 * user-facing error.
 */
export async function deleteProject(id: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('submissions')
    .select('id, kind, cover_url, files')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!existing) return { ok: false, error: 'Projet introuvable' }
  if (existing.kind !== SUBMISSION_KIND_PORTFOLIO) {
    return { ok: false, error: "Ce projet n'est pas un projet de portfolio" }
  }

  const storagePaths = new Set<string>()
  const coverPath = extractOwnedStoragePath(existing.cover_url, user.id)
  if (coverPath) storagePaths.add(coverPath)
  const images = (existing.files as { images?: unknown } | null)?.images
  if (Array.isArray(images)) {
    for (const img of images) {
      const path = extractOwnedStoragePath((img as { url?: unknown })?.url, user.id)
      if (path) storagePaths.add(path)
    }
  }

  const { data: deleted, error } = await supabaseAdmin
    .from('submissions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!deleted) return { ok: false, error: 'Suppression sans effet (ligne introuvable)' }

  if (storagePaths.size) {
    try {
      const { error: storageError } = await supabaseAdmin.storage
        .from(SUBMISSIONS_BUCKET)
        .remove([...storagePaths])
      if (storageError) {
        console.error(`[deleteProject] storage cleanup failed for ${id}:`, storageError.message)
      }
    } catch (err) {
      console.error(`[deleteProject] storage cleanup threw for ${id}:`, err)
    }
  }

  revalidatePath('/dashboard/projects')
  return { ok: true }
}
