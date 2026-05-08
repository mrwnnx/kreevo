/**
 * Help Center — Homepage.
 * Sections:
 *  1. Hero with central search bar
 *  2. CategoryGrid (3×2 of HELP_CATEGORIES)
 *  3. Popular articles (top 5 by views)
 *
 * Data:
 *  - help_articles counts per category from Supabase
 *  - top 5 articles by `views`
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronRight } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { HelpHero } from '@/components/help/HelpHero'
import { CategoryGrid } from '@/components/help/CategoryGrid'
import { getHelpLang, HELP_T } from '@/lib/help/lang'
import { getCategoryBySlug, HELP_CATEGORIES } from '@/lib/help/categories'
import { siteUrl } from '@/lib/site'
import { websiteWithSearch } from '@/lib/help/jsonld'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getHelpLang()
  const t = HELP_T[lang]
  return {
    title: `${t.siteName} — ${t.heroTitle}`,
    description: t.heroSubtitle,
    alternates: {
      canonical: '/help',
      languages: {
        fr: siteUrl('/help'),
        en: siteUrl('/help'),
        'x-default': siteUrl('/help'),
      },
    },
    openGraph: {
      title: t.siteName,
      description: t.heroSubtitle,
      url: siteUrl('/help'),
      siteName: 'Kreevo',
      type: 'website',
      locale: lang === 'en' ? 'en_US' : 'fr_FR',
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function HelpHomePage() {
  const lang = await getHelpLang()
  const t = HELP_T[lang]

  // Counts per category + top articles by views, in parallel
  const [{ data: counts }, { data: top }] = await Promise.all([
    (supabaseAdmin as any)
      .from('help_articles')
      .select('category')
      .eq('published', true),
    (supabaseAdmin as any)
      .from('help_articles')
      .select('slug, category, title_fr, title_en, excerpt_fr, excerpt_en, views')
      .eq('published', true)
      .order('views', { ascending: false })
      .limit(5),
  ])

  const countsByCategory: Record<string, number> = {}
  for (const row of (counts ?? []) as Array<{ category: string }>) {
    countsByCategory[row.category] = (countsByCategory[row.category] ?? 0) + 1
  }
  // Ensure all known categories exist (0 if none)
  for (const cat of HELP_CATEGORIES) {
    countsByCategory[cat.slug] ??= 0
  }

  const popular = (top ?? []) as Array<{
    slug: string
    category: string
    title_fr: string
    title_en: string
    excerpt_fr: string | null
    excerpt_en: string | null
  }>

  const ldjson = websiteWithSearch(t.siteName, lang === 'en' ? 'en' : 'fr')

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldjson) }}
      />
      <HelpHero t={t} />
      <CategoryGrid countsByCategory={countsByCategory} lang={lang} t={t} />

      {popular.length > 0 && (
        <section className="max-w-[1080px] mx-auto px-4 sm:px-6 pb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8">
            {t.popularTitle}
          </h2>
          <div className="rounded-[24px] border border-border bg-card overflow-hidden divide-y divide-border">
            {popular.map((article) => {
              const cat = getCategoryBySlug(article.category)
              const title = lang === 'en' ? article.title_en : article.title_fr
              const excerpt = lang === 'en' ? article.excerpt_en : article.excerpt_fr
              return (
                <Link
                  key={article.slug}
                  href={`/help/${article.category}/${article.slug}`}
                  className="flex items-start gap-4 p-5 hover:bg-muted/40 transition-colors group"
                >
                  {cat?.icon && (
                    <div
                      className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${cat.iconBgClass} ${cat.iconColorClass}`}
                    >
                      <cat.icon className="size-4" strokeWidth={2.2} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {title}
                    </h3>
                    {excerpt && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
        </section>
      )}
    </>
  )
}
