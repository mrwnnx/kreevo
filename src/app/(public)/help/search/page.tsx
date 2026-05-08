/**
 * Search results page — full-text search against help_articles.search_vector.
 * Uses Supabase JS .textSearch('search_vector', q, { type: 'websearch' }).
 * If 0 results : empty state with category suggestions + contact CTA.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { Search, ChevronRight } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getHelpLang, HELP_T } from '@/lib/help/lang'
import { HelpBreadcrumb } from '@/components/help/HelpBreadcrumb'
import { HelpSearchBar } from '@/components/help/HelpSearchBar'
import { CategoryGrid } from '@/components/help/CategoryGrid'
import { getCategoryBySlug, HELP_CATEGORIES } from '@/lib/help/categories'

interface Props {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const sp = await searchParams
  const q = (sp.q ?? '').trim()
  const lang = await getHelpLang()
  const t = HELP_T[lang]
  return {
    title: q
      ? `"${q}" — ${t.siteName}`
      : `${lang === 'en' ? 'Search' : 'Recherche'} — ${t.siteName}`,
    robots: { index: false, follow: true },
  }
}

export const dynamic = 'force-dynamic'

export default async function HelpSearchPage({ searchParams }: Props) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim()
  const lang = await getHelpLang()
  const t = HELP_T[lang]

  // Run FTS only if we have at least 2 chars
  let results: Array<{
    slug: string
    category: string
    title_fr: string
    title_en: string
    excerpt_fr: string | null
    excerpt_en: string | null
  }> = []

  if (q.length >= 2) {
    const { data } = await (supabaseAdmin as any)
      .from('help_articles')
      .select('slug, category, title_fr, title_en, excerpt_fr, excerpt_en')
      .eq('published', true)
      .textSearch('search_vector', q, { type: 'websearch', config: 'simple' })
      .limit(20)
    results = data ?? []
  }

  const totalLabel =
    lang === 'en'
      ? `${results.length} result${results.length === 1 ? '' : 's'} for "${q}"`
      : `${results.length} résultat${results.length === 1 ? '' : 's'} pour « ${q} »`

  // Counts for empty-state CategoryGrid
  const countsByCategory: Record<string, number> = {}
  if (results.length === 0 && q) {
    const { data: counts } = await (supabaseAdmin as any)
      .from('help_articles')
      .select('category')
      .eq('published', true)
    for (const r of (counts ?? []) as Array<{ category: string }>) {
      countsByCategory[r.category] = (countsByCategory[r.category] ?? 0) + 1
    }
    for (const c of HELP_CATEGORIES) countsByCategory[c.slug] ??= 0
  }

  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <HelpBreadcrumb
        items={[
          { label: t.breadcrumbHome, href: '/help' },
          { label: lang === 'en' ? 'Search' : 'Recherche' },
        ]}
      />

      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          {lang === 'en' ? 'Search the Help Center' : "Rechercher dans l'aide"}
        </h1>
        <div className="max-w-[560px]">
          <HelpSearchBar
            placeholder={t.searchPlaceholder}
            defaultValue={q}
            size="md"
          />
        </div>
        {q && (
          <p className="text-sm text-muted-foreground">{totalLabel}</p>
        )}
      </div>

      {q.length < 2 ? (
        <p className="text-sm text-muted-foreground italic">
          {lang === 'en'
            ? 'Type at least 2 characters to start searching.'
            : 'Saisis au moins 2 caractères pour lancer la recherche.'}
        </p>
      ) : results.length === 0 ? (
        <>
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center space-y-3">
            <Search className="size-6 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-foreground">{t.notFound}</p>
            <p className="text-xs text-muted-foreground">
              {lang === 'en'
                ? 'Try different keywords, or browse by category below.'
                : 'Essaie avec d\'autres mots-clés, ou parcours par catégorie ci-dessous.'}
            </p>
            <Link
              href="/help/contact"
              className="inline-flex items-center justify-center bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full hover:opacity-85 transition-opacity"
            >
              {t.contactCta}
            </Link>
          </div>

          <CategoryGrid
            countsByCategory={countsByCategory}
            lang={lang}
            t={t}
          />
        </>
      ) : (
        <div className="rounded-[24px] border border-border bg-card overflow-hidden divide-y divide-border">
          {results.map((r) => {
            const cat = getCategoryBySlug(r.category)
            const title = lang === 'en' ? r.title_en : r.title_fr
            const excerpt = lang === 'en' ? r.excerpt_en : r.excerpt_fr
            const catLabel = cat
              ? lang === 'en'
                ? cat.label_en
                : cat.label_fr
              : r.category
            return (
              <Link
                key={r.slug}
                href={`/help/${r.category}/${r.slug}`}
                className="flex items-start gap-4 p-5 hover:bg-muted/40 transition-colors group"
              >
                {cat?.icon && (
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${cat.iconBgClass} ${cat.iconColorClass}`}
                  >
                    <cat.icon className="size-4" strokeWidth={2.2} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                    {catLabel}
                  </p>
                  <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                    {title}
                  </h3>
                  {excerpt && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {excerpt}
                    </p>
                  )}
                </div>
                <ChevronRight
                  className="size-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                  aria-hidden
                />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
