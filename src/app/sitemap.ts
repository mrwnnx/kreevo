import type { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { HELP_CATEGORIES } from '@/lib/help/categories'
import { siteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl('/'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: siteUrl('/help'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: {
        languages: { fr: siteUrl('/help'), en: siteUrl('/help') },
      },
    },
    {
      url: siteUrl('/help/contact'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  // 6 category pages
  const categoryRoutes: MetadataRoute.Sitemap = HELP_CATEGORIES.map((c) => ({
    url: siteUrl(`/help/${c.slug}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
    alternates: {
      languages: {
        fr: siteUrl(`/help/${c.slug}`),
        en: siteUrl(`/help/${c.slug}`),
      },
    },
  }))

  // All published help articles
  const { data: articles } = await (supabaseAdmin as any)
    .from('help_articles')
    .select('slug, category, updated_at')
    .eq('published', true)

  const articleRoutes: MetadataRoute.Sitemap = (articles ?? []).map(
    (a: { slug: string; category: string; updated_at: string }) => ({
      url: siteUrl(`/help/${a.category}/${a.slug}`),
      lastModified: new Date(a.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      alternates: {
        languages: {
          fr: siteUrl(`/help/${a.category}/${a.slug}`),
          en: siteUrl(`/help/${a.category}/${a.slug}`),
        },
      },
    }),
  )

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes]
}
