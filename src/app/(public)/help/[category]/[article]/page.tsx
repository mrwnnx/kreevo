/**
 * Article page — renders a single help article with markdown content.
 * Sections: breadcrumb, title + last-updated, markdown content,
 * helpful Y/N feedback, related articles, contact CTA.
 *
 * Side effect: increments `views` counter (best-effort).
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Calendar } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCategoryBySlug } from '@/lib/help/categories'
import { getHelpLang, HELP_T } from '@/lib/help/lang'
import { HelpBreadcrumb } from '@/components/help/HelpBreadcrumb'
import { ArticleContent } from '@/components/help/ArticleContent'
import { ArticleFeedback } from '@/components/help/ArticleFeedback'
import { ArticleCard } from '@/components/help/ArticleCard'
import { siteUrl } from '@/lib/site'
import { articleSchema, breadcrumbList, maybeFaqSchema } from '@/lib/help/jsonld'

interface Props {
  params: Promise<{ category: string; article: string }>
}

type Article = {
  id: string
  slug: string
  category: string
  title_fr: string
  title_en: string
  content_fr: string
  content_en: string
  excerpt_fr: string | null
  excerpt_en: string | null
  updated_at: string
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, article } = await params
  const lang = await getHelpLang()

  const { data } = await (supabaseAdmin as any)
    .from('help_articles')
    .select('title_fr, title_en, excerpt_fr, excerpt_en')
    .eq('slug', article)
    .eq('category', category)
    .eq('published', true)
    .maybeSingle()

  if (!data) return {}
  const title = lang === 'en' ? data.title_en : data.title_fr
  const description =
    (lang === 'en' ? data.excerpt_en : data.excerpt_fr) ?? title
  return {
    title: `${title} — ${HELP_T[lang].siteName}`,
    description,
    alternates: {
      canonical: `/help/${category}/${article}`,
      languages: {
        fr: siteUrl(`/help/${category}/${article}`),
        en: siteUrl(`/help/${category}/${article}`),
        'x-default': siteUrl(`/help/${category}/${article}`),
      },
    },
    openGraph: {
      title,
      description: description ?? title,
      url: siteUrl(`/help/${category}/${article}`),
      siteName: 'Kreevo',
      type: 'article',
      locale: lang === 'en' ? 'en_US' : 'fr_FR',
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function HelpArticlePage({ params }: Props) {
  const { category, article: slug } = await params
  const cat = getCategoryBySlug(category)
  if (!cat) notFound()

  const lang = await getHelpLang()
  const t = HELP_T[lang]
  const label = lang === 'en' ? cat.label_en : cat.label_fr

  const { data: row } = await (supabaseAdmin as any)
    .from('help_articles')
    .select(
      'id, slug, category, title_fr, title_en, content_fr, content_en, excerpt_fr, excerpt_en, updated_at',
    )
    .eq('slug', slug)
    .eq('category', category)
    .eq('published', true)
    .maybeSingle()

  if (!row) notFound()
  const art = row as Article

  // Related articles in same category, excluding self (limit 3)
  const { data: relatedRows } = await (supabaseAdmin as any)
    .from('help_articles')
    .select('slug, title_fr, title_en, excerpt_fr, excerpt_en')
    .eq('category', category)
    .eq('published', true)
    .neq('slug', slug)
    .order('order_index', { ascending: true })
    .limit(3)
  const related = (relatedRows ?? []) as Array<{
    slug: string
    title_fr: string
    title_en: string
    excerpt_fr: string | null
    excerpt_en: string | null
  }>

  // Increment view count (best-effort, fire-and-forget)
  void (async () => {
    try {
      const { data: cur } = await (supabaseAdmin as any)
        .from('help_articles')
        .select('views')
        .eq('id', art.id)
        .single()
      await (supabaseAdmin as any)
        .from('help_articles')
        .update({ views: (cur?.views ?? 0) + 1 })
        .eq('id', art.id)
    } catch {
      /* ignore */
    }
  })()

  const title = lang === 'en' ? art.title_en : art.title_fr
  const content = lang === 'en' ? art.content_en : art.content_fr

  const langCode = lang === 'en' ? 'en' : 'fr'
  const articleLd = articleSchema({
    title,
    description: (lang === 'en' ? art.excerpt_en : art.excerpt_fr) ?? title,
    url: `/help/${category}/${slug}`,
    datePublished: art.updated_at,
    dateModified: art.updated_at,
    langCode,
  })
  const breadcrumbLd = breadcrumbList([
    { name: t.breadcrumbHome, url: '/help' },
    { name: label, url: `/help/${category}` },
    { name: title, url: `/help/${category}/${slug}` },
  ])
  const faqLd = maybeFaqSchema(content)

  const formattedDate = new Date(art.updated_at).toLocaleDateString(
    lang === 'en' ? 'en-US' : 'fr-FR',
    { year: 'numeric', month: 'long', day: 'numeric' },
  )

  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}

      <div className="mb-6">
        <HelpBreadcrumb
          items={[
            { label: t.breadcrumbHome, href: '/help' },
            { label, href: `/help/${category}` },
            { label: title },
          ]}
        />
      </div>

      {/* Article body */}
      <div className="max-w-[720px] mx-auto">
        <header className="mb-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
            {title}
          </h1>
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
            <Calendar className="size-3.5" />
            {t.lastUpdated} {formattedDate}
          </p>
        </header>

        <ArticleContent markdown={content} />

        <ArticleFeedback articleId={art.id} t={t} />

        {related.length > 0 && (
          <section className="mt-12 pt-8 border-t border-border">
            <h2 className="text-lg font-bold text-foreground mb-4">
              {t.relatedTitle}
            </h2>
            <div className="space-y-3">
              {related.map((r) => (
                <ArticleCard
                  key={r.slug}
                  href={`/help/${category}/${r.slug}`}
                  title={lang === 'en' ? r.title_en : r.title_fr}
                  excerpt={lang === 'en' ? r.excerpt_en : r.excerpt_fr}
                  t={t}
                />
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 text-center">
          <Link
            href={`/help/${category}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← {label}
          </Link>
        </div>
      </div>
    </div>
  )
}
