'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin'

/**
 * Server actions for the blog (table `articles`). Every mutation re-checks admin
 * server-side via requireAdmin() and writes through admin.supabase (service-role).
 * `articles` isn't in the generated DB types → casts to any, like the rest of the codebase.
 */

export type BlogArticleInput = {
  id?: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string | null
  category: string
  tags: string[]
  meta_title: string
  meta_description: string
  status: 'draft' | 'published'
}

function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function saveArticle(input: BlogArticleInput) {
  const { error, admin } = await requireAdmin()
  if (error || !admin) return { ok: false as const, error: 'Accès refusé.' }
  const db = admin.supabase as any

  const title = input.title.trim()
  const slug = normalizeSlug(input.slug)
  if (!title) return { ok: false as const, error: 'Le titre est requis.' }
  if (!slug) return { ok: false as const, error: 'Le slug est requis.' }
  if (!input.content.trim()) return { ok: false as const, error: 'Le contenu est requis.' }

  // Slug uniqueness (exclude self on edit)
  const { data: clash } = await db.from('articles').select('id').eq('slug', slug).maybeSingle()
  if (clash && clash.id !== input.id) {
    return { ok: false as const, error: 'Ce slug est déjà utilisé par un autre article.' }
  }

  // reading_time = words / 200 (min 1)
  const words = input.content.trim().split(/\s+/).filter(Boolean).length
  const reading_time = Math.max(1, Math.ceil(words / 200))

  const base = {
    title,
    slug,
    excerpt: input.excerpt.trim() || null,
    content: input.content,
    cover_image: input.cover_image || null,
    category: input.category.trim() || null,
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
    meta_title: input.meta_title.trim() || null,
    meta_description: input.meta_description.trim() || null,
    status: input.status,
    reading_time,
    updated_at: new Date().toISOString(),
  }

  if (input.id) {
    // published_at set automatically on first transition to 'published', kept thereafter
    const { data: cur } = await db
      .from('articles')
      .select('published_at')
      .eq('id', input.id)
      .single()
    const published_at =
      input.status === 'published' ? cur?.published_at ?? new Date().toISOString() : cur?.published_at ?? null

    const { error: dbErr } = await db.from('articles').update({ ...base, published_at }).eq('id', input.id)
    if (dbErr) return { ok: false as const, error: dbErr.message }

    revalidatePath('/admin/blog')
    revalidatePath('/blog')
    revalidatePath(`/blog/${slug}`)
    return { ok: true as const, id: input.id }
  }

  const published_at = input.status === 'published' ? new Date().toISOString() : null
  const { data, error: dbErr } = await db
    .from('articles')
    .insert({ ...base, published_at, author_id: admin.user.id, locale: 'fr' })
    .select('id')
    .single()
  if (dbErr) return { ok: false as const, error: dbErr.message }

  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  return { ok: true as const, id: data.id as string }
}

export async function deleteArticle(id: string) {
  const { error, admin } = await requireAdmin()
  if (error || !admin) return { ok: false as const, error: 'Accès refusé.' }

  const { error: dbErr } = await (admin.supabase as any).from('articles').delete().eq('id', id)
  if (dbErr) return { ok: false as const, error: dbErr.message }

  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  return { ok: true as const }
}
