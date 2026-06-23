import Link from 'next/link'
import { Plus, Pencil, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type Row = {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
  views: number | null
  published_at: string | null
  updated_at: string
}

export default async function AdminBlogPage() {
  const { data } = await (supabaseAdmin as any)
    .from('articles')
    .select('id, title, slug, status, views, published_at, updated_at')
    .order('updated_at', { ascending: false })
  const articles = (data ?? []) as Row[]

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-sm text-muted-foreground">
            {articles.length} article{articles.length > 1 ? 's' : ''} · gérer le contenu du blog
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full hover:opacity-85"
        >
          <Plus className="size-4" />
          Nouvel article
        </Link>
      </div>

      {articles.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Aucun article. Crée le premier.</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-start px-4 py-3">Titre</th>
                <th className="text-end px-4 py-3 hidden md:table-cell">Vues</th>
                <th className="text-start px-4 py-3 hidden md:table-cell">Date</th>
                <th className="text-center px-4 py-3 w-20">Statut</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {articles.map((a) => {
                const date = a.published_at ?? a.updated_at
                return (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/blog/${a.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {a.title}
                      </Link>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">/blog/{a.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-end tabular-nums hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="size-3" />
                        {a.views ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground tabular-nums">
                      {new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full',
                          a.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
                        )}
                      >
                        {a.status === 'published' ? 'Publié' : (
                          <>
                            <EyeOff className="size-3" /> Draft
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Link
                        href={`/admin/blog/${a.id}`}
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
