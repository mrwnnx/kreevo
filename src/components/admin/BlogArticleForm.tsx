'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BlogEditor } from './BlogEditor'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { saveArticle, deleteArticle, type BlogArticleInput } from '@/app/(admin)/admin/blog/actions'

const labelCls = 'block text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1.5'
const inputCls =
  'w-full h-10 rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 py-1 text-base md:text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors'

function slugify(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export interface BlogFormInitial {
  id?: string
  title?: string
  slug?: string
  excerpt?: string
  content?: string
  cover_image?: string | null
  category?: string
  tags?: string[]
  meta_title?: string
  meta_description?: string
  status?: 'draft' | 'published'
}

export function BlogArticleForm({ initial, id }: { initial?: BlogFormInitial; id?: string }) {
  const router = useRouter()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug)
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [cover, setCover] = useState<string | null>(initial?.cover_image ?? null)
  const [category, setCategory] = useState(initial?.category ?? '')
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(', '))
  const [metaTitle, setMetaTitle] = useState(initial?.meta_title ?? '')
  const [metaDescription, setMetaDescription] = useState(initial?.meta_description ?? '')
  const [status, setStatus] = useState<'draft' | 'published'>(initial?.status ?? 'draft')

  const [error, setError] = useState<string | null>(null)
  const [saving, startSaving] = useTransition()
  const [deleting, startDeleting] = useTransition()

  function onTitleChange(value: string) {
    setTitle(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  function handleSave() {
    setError(null)
    const payload: BlogArticleInput = {
      id,
      title,
      slug,
      excerpt,
      content,
      cover_image: cover,
      category,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      meta_title: metaTitle,
      meta_description: metaDescription,
      status,
    }
    startSaving(async () => {
      const res = await saveArticle(payload)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.push('/admin/blog')
      router.refresh()
    })
  }

  function handleDelete() {
    if (!id) return
    if (!confirm('Supprimer cet article définitivement ?')) return
    setError(null)
    startDeleting(async () => {
      const res = await deleteArticle(id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.push('/admin/blog')
      router.refresh()
    })
  }

  const busy = saving || deleting

  return (
    <div className="space-y-6">
      {/* Title + slug */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="title">Titre</label>
          <input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className={inputCls}
            placeholder="Comment réussir un challenge de design"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="slug">Slug</label>
          <input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))
            }}
            className={inputCls}
            placeholder="reussir-un-challenge-de-design"
          />
          <p className="text-[10px] text-muted-foreground mt-1">a-z, 0-9, tirets — auto depuis le titre, éditable</p>
        </div>
      </div>

      {/* Category + tags */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="category">Catégorie</label>
          <input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputCls}
            placeholder="Design, Carrière, Tutoriel…"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="tags">Tags</label>
          <input
            id="tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className={inputCls}
            placeholder="ux, ui, portfolio (séparés par des virgules)"
          />
        </div>
      </div>

      {/* Excerpt */}
      <div>
        <label className={labelCls} htmlFor="excerpt">Excerpt</label>
        <textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          maxLength={300}
          className={cn(inputCls, 'h-auto py-2 resize-y')}
          placeholder="Courte accroche affichée dans la liste et les métadonnées (300 max)."
        />
      </div>

      {/* Cover image */}
      <div>
        <label className={labelCls}>Image de couverture</label>
        <ImageUpload bucket="email-banners" value={cover} onChange={setCover} className="aspect-[16/9] max-w-md" />
      </div>

      {/* Content (WYSIWYG → HTML) */}
      <div>
        <label className={labelCls}>Contenu</label>
        <BlogEditor value={content} onChange={setContent} />
      </div>

      {/* SEO meta */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <label className={labelCls} htmlFor="meta_title">Meta title (SEO)</label>
          <input
            id="meta_title"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            className={inputCls}
            placeholder="Laisse vide pour utiliser le titre"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="meta_description">Meta description (SEO)</label>
          <input
            id="meta_description"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            className={inputCls}
            maxLength={200}
            placeholder="Laisse vide pour utiliser l'excerpt"
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label className={labelCls}>Statut</label>
        <button
          type="button"
          onClick={() => setStatus((s) => (s === 'published' ? 'draft' : 'published'))}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg border border-border text-sm w-full sm:w-auto',
            status === 'published'
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
              : 'bg-zinc-50 dark:bg-zinc-900/40 text-muted-foreground',
          )}
        >
          <span
            className={cn(
              'relative inline-flex h-5 w-9 rounded-full transition-colors',
              status === 'published' ? 'bg-emerald-500' : 'bg-zinc-400',
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block size-4 rounded-full bg-white shadow transition-transform mt-0.5',
                status === 'published' ? 'translate-x-4' : 'translate-x-0.5',
              )}
            />
          </span>
          <span className="font-medium">{status === 'published' ? 'Publié' : 'Brouillon'}</span>
        </button>
        <p className="text-[10px] text-muted-foreground mt-1">
          La date de publication est définie automatiquement au passage en « Publié ».
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive font-mono bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full hover:opacity-85 disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {id ? 'Enregistrer' : "Créer l'article"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Annuler
        </button>

        {id && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="ms-auto inline-flex items-center gap-2 text-sm text-destructive hover:bg-destructive/5 px-4 py-2 rounded-full transition-colors disabled:opacity-60"
          >
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Supprimer
          </button>
        )}
      </div>
    </div>
  )
}
