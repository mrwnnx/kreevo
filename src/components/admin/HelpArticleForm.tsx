'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MarkdownEditor } from './MarkdownEditor'
import { HELP_CATEGORIES } from '@/lib/help/categories'

export interface HelpArticleFormData {
  slug: string
  category: string
  title_fr: string
  title_en: string
  excerpt_fr: string
  excerpt_en: string
  content_fr: string
  content_en: string
  order_index: number
  published: boolean
}

const EMPTY: HelpArticleFormData = {
  slug: '',
  category: 'getting-started',
  title_fr: '',
  title_en: '',
  excerpt_fr: '',
  excerpt_en: '',
  content_fr: '',
  content_en: '',
  order_index: 0,
  published: true,
}

const labelCls = 'block text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1.5'
const inputCls = 'w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring'

export function HelpArticleForm({
  initial,
  id,
}: {
  initial?: Partial<HelpArticleFormData>
  id?: string
}) {
  const router = useRouter()
  const [form, setForm] = useState<HelpArticleFormData>({ ...EMPTY, ...initial })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof HelpArticleFormData>(key: K, value: HelpArticleFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const url = id ? `/api/admin/help/articles/${id}` : '/api/admin/help/articles'
    const method = id ? 'PATCH' : 'POST'
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Erreur')
        setSaving(false)
        return
      }
      router.push('/admin/help')
      router.refresh()
    } catch (e: any) {
      setError(e?.message ?? 'Erreur réseau')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!confirm('Supprimer cet article définitivement ?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/help/articles/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Erreur suppression')
        setDeleting(false)
        return
      }
      router.push('/admin/help')
      router.refresh()
    } catch (e: any) {
      setError(e?.message ?? 'Erreur réseau')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Meta row 1 — slug + category */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="slug">Slug</label>
          <input
            id="slug"
            value={form.slug}
            onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))}
            className={inputCls}
            placeholder="comment-creer-un-compte"
          />
          <p className="text-[10px] text-muted-foreground mt-1">a-z, 0-9, tirets uniquement</p>
        </div>

        <div>
          <label className={labelCls} htmlFor="category">Catégorie</label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className={inputCls}
          >
            {HELP_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label_fr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Meta row 2 — order + published toggle */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="order_index">Ordre</label>
          <input
            id="order_index"
            type="number"
            value={form.order_index}
            onChange={(e) => set('order_index', parseInt(e.target.value) || 0)}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Statut</label>
          <button
            type="button"
            onClick={() => set('published', !form.published)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg border border-border text-sm w-full',
              form.published
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
                : 'bg-zinc-50 dark:bg-zinc-900/40 text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'relative inline-flex h-5 w-9 rounded-full transition-colors',
                form.published ? 'bg-emerald-500' : 'bg-zinc-400',
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block size-4 rounded-full bg-white shadow transition-transform mt-0.5',
                  form.published ? 'translate-x-4' : 'translate-x-0.5',
                )}
              />
            </span>
            <span className="font-medium">{form.published ? 'Publié' : 'Brouillon'}</span>
          </button>
        </div>
      </div>

      {/* FR + EN titles + excerpts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4 rounded-xl border border-border p-4 bg-card/50">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">FR (par défaut)</p>
          <div>
            <label className={labelCls}>Titre FR</label>
            <input
              value={form.title_fr}
              onChange={(e) => set('title_fr', e.target.value)}
              className={inputCls}
              placeholder="Comment créer un compte"
            />
          </div>
          <div>
            <label className={labelCls}>Excerpt FR</label>
            <input
              value={form.excerpt_fr}
              onChange={(e) => set('excerpt_fr', e.target.value)}
              className={inputCls}
              maxLength={200}
              placeholder="Courte description (200 chars max)"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border p-4 bg-card/50">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">EN</p>
          <div>
            <label className={labelCls}>Title EN</label>
            <input
              value={form.title_en}
              onChange={(e) => set('title_en', e.target.value)}
              className={inputCls}
              placeholder="How to create an account"
            />
          </div>
          <div>
            <label className={labelCls}>Excerpt EN</label>
            <input
              value={form.excerpt_en}
              onChange={(e) => set('excerpt_en', e.target.value)}
              className={inputCls}
              maxLength={200}
              placeholder="Short description (200 chars max)"
            />
          </div>
        </div>
      </div>

      {/* Content FR */}
      <MarkdownEditor
        label="Contenu FR (Markdown)"
        value={form.content_fr}
        onChange={(v) => set('content_fr', v)}
        placeholder="## Section\n\nContenu markdown ici…"
      />

      {/* Content EN */}
      <MarkdownEditor
        label="Content EN (Markdown)"
        value={form.content_en}
        onChange={(v) => set('content_en', v)}
        placeholder="## Section\n\nMarkdown content here…"
      />

      {error && (
        <p className="text-sm text-destructive font-mono bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || deleting}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full hover:opacity-85 disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {id ? 'Enregistrer' : 'Créer l\'article'}
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
            disabled={deleting || saving}
            className="ml-auto inline-flex items-center gap-2 text-sm text-destructive hover:bg-destructive/5 px-4 py-2 rounded-full transition-colors disabled:opacity-60"
          >
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Supprimer
          </button>
        )}
      </div>
    </div>
  )
}
