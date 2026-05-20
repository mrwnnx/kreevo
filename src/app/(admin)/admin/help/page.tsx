'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Eye, Search, EyeOff, ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HELP_CATEGORIES } from '@/lib/help/categories'

interface Article {
  id: string
  slug: string
  category: string
  title_fr: string
  title_en: string
  views: number
  helpful: number
  not_helpful: number
  order_index: number
  published: boolean
  updated_at: string
}

export default function AdminHelpPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/admin/help/articles')
      .then((r) => r.json())
      .then((d) => {
        setArticles(d.articles ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return articles.filter((a) => {
      if (filter !== 'all' && a.category !== filter) return false
      if (!q) return true
      return (
        a.title_fr.toLowerCase().includes(q) ||
        a.title_en.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q)
      )
    })
  }, [articles, query, filter])

  const helpfulRatio = (a: Article) => {
    const total = a.helpful + a.not_helpful
    if (total === 0) return null
    return Math.round((a.helpful / total) * 100)
  }

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Help Center</h1>
          <p className="text-sm text-muted-foreground">
            {articles.length} articles · gérer le contenu du centre d&apos;aide
          </p>
        </div>
        <Link
          href="/admin/help/new"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full hover:opacity-85"
        >
          <Plus className="size-4" />
          Nouvel article
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par titre ou slug…"
            className="w-full h-10 pl-9 pr-3 rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 text-base md:text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 py-1 text-base md:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors"
        >
          <option value="all">Toutes catégories</option>
          {HELP_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label_fr}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Aucun article.</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Titre</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Catégorie</th>
                <th className="text-right px-4 py-3 hidden md:table-cell">Vues</th>
                <th className="text-right px-4 py-3 hidden md:table-cell">Helpful</th>
                <th className="text-center px-4 py-3 w-20">Statut</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => {
                const cat = HELP_CATEGORIES.find((c) => c.slug === a.category)
                const ratio = helpfulRatio(a)
                return (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/help/${a.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {a.title_fr}
                      </Link>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">
                        /{a.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {cat && (
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: cat.iconBg,
                            color: cat.iconColor,
                          }}
                        >
                          {cat.label_fr}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="size-3" />
                        {a.views ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      {ratio === null ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-xs font-medium tabular-nums',
                            ratio >= 70 ? 'text-emerald-600' : ratio >= 40 ? 'text-amber-600' : 'text-rose-600',
                          )}
                        >
                          {ratio >= 50 ? <ThumbsUp className="size-3" /> : <ThumbsDown className="size-3" />}
                          {ratio}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full',
                          a.published
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
                        )}
                      >
                        {a.published ? 'Publié' : (
                          <>
                            <EyeOff className="size-3" /> Draft
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/help/${a.id}`}
                        className="inline-flex items-center justify-center size-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Modifier"
                      >
                        <Pencil className="size-4" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
