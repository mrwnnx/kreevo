/**
 * Category page — lists all articles in a help category.
 * Layout: breadcrumb + header (icon + title + description) + 2-col (articles | sidebar)
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { GLASS_SURFACE, GLASS_GRADIENT } from '@/components/layout/GlassShell'
import { getCategoryBySlug, HELP_CATEGORIES } from '@/lib/help/categories'
import { getHelpLang, HELP_T } from '@/lib/help/lang'
import { HelpBreadcrumb } from '@/components/help/HelpBreadcrumb'
import { ArticleCard } from '@/components/help/ArticleCard'
import { CategorySidebar } from '@/components/help/CategorySidebar'
import { siteUrl } from '@/lib/site'
import { breadcrumbList } from '@/lib/help/jsonld'

interface Props {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const cat = getCategoryBySlug(category)
  if (!cat) return {}
  const lang = await getHelpLang()
  const label = lang === 'en' ? cat.label_en : cat.label_fr
  const description = lang === 'en' ? cat.description_en : cat.description_fr
  return {
    title: `${label} — ${HELP_T[lang].siteName}`,
    description,
    alternates: {
      canonical: `/help/${category}`,
      languages: {
        fr: siteUrl(`/help/${category}`),
        en: siteUrl(`/help/${category}`),
        'x-default': siteUrl(`/help/${category}`),
      },
    },
    openGraph: {
      title: label,
      description,
      url: siteUrl(`/help/${category}`),
      siteName: 'Kreevo',
      type: 'website',
      locale: lang === 'en' ? 'en_US' : 'fr_FR',
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function HelpCategoryPage({ params }: Props) {
  const { category } = await params
  const cat = getCategoryBySlug(category)
  if (!cat) notFound()

  const lang = await getHelpLang()
  const t = HELP_T[lang]
  const Icon = cat.icon
  const label = lang === 'en' ? cat.label_en : cat.label_fr
  const description = lang === 'en' ? cat.description_en : cat.description_fr

  // Articles in this category + counts (parallel)
  const [{ data: articles }, { data: allCounts }] = await Promise.all([
    (supabaseAdmin as any)
      .from('help_articles')
      .select('slug, title_fr, title_en, excerpt_fr, excerpt_en, order_index')
      .eq('category', category)
      .eq('published', true)
      .order('order_index', { ascending: true }),
    (supabaseAdmin as any)
      .from('help_articles')
      .select('category')
      .eq('published', true),
  ])

  const list = (articles ?? []) as Array<{
    slug: string
    title_fr: string
    title_en: string
    excerpt_fr: string | null
    excerpt_en: string | null
  }>

  const countsByCategory: Record<string, number> = {}
  for (const r of (allCounts ?? []) as Array<{ category: string }>) {
    countsByCategory[r.category] = (countsByCategory[r.category] ?? 0) + 1
  }
  for (const c of HELP_CATEGORIES) countsByCategory[c.slug] ??= 0

  const ldjson = breadcrumbList([
    { name: t.breadcrumbHome, url: '/help' },
    { name: label, url: `/help/${category}` },
  ])

  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldjson) }}
      />
      <HelpBreadcrumb
        items={[
          { label: t.breadcrumbHome, href: '/help' },
          { label },
        ]}
      />

      {/* Header */}
      <header className="flex items-start gap-4 sm:gap-5">
        <div
          className={`size-14 sm:size-16 rounded-2xl flex items-center justify-center shrink-0 ${cat.iconBgClass} ${cat.iconColorClass}`}
        >
          <Icon className="size-6 sm:size-7" strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            {label}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            {description}
          </p>
        </div>
      </header>

      {/* 2-col layout */}
      <div className="grid lg:grid-cols-[1fr_240px] gap-8">
        <div className="space-y-3">
          {list.length === 0 ? (
            <div className="space-y-3 rounded-[24px] border border-dashed border-[#dcdce8] bg-white/40 p-8 text-center backdrop-blur-[59.18px]">
              <p className="text-sm font-medium text-foreground">{t.notFound}</p>
              <Link
                href="/help/contact"
                className="inline-flex items-center justify-center bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full hover:opacity-85 transition-opacity"
              >
                {t.contactCta}
              </Link>
            </div>
          ) : (
            list.map((article) => (
              <ArticleCard
                key={article.slug}
                href={`/help/${category}/${article.slug}`}
                title={lang === 'en' ? article.title_en : article.title_fr}
                excerpt={lang === 'en' ? article.excerpt_en : article.excerpt_fr}
                t={t}
              />
            ))
          )}
        </div>

        <CategorySidebar
          current={cat.slug}
          countsByCategory={countsByCategory}
          lang={lang}
        />
      </div>
    </div>
  )
}
