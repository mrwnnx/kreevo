'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SUBMISSION_KIND_PORTFOLIO } from '@/lib/utils/submission-constants'
import type { Json } from '@/types/database.types'

// NOTE: never import from '@/lib/utils/submissions' here — it instantiates
// the Anthropic SDK at module top-level, which breaks the client bundle this
// file is imported from (ProjectForm is a 'use client' component).

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
