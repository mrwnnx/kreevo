import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Calendar, Clock } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getDict } from '@/lib/i18n/lang'
import { siteUrl } from '@/lib/site'
import { blogPostingSchema } from '@/lib/seo/jsonld'
import { BlogContent } from '@/components/blog/BlogContent'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { Button } from '@/components/ui/button'

interface Props {
  params: Promise<{ slug: string }>
}

type Article = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  cover_image: string | null
  category: string | null
  meta_title: string | null
  meta_description: string | null
  reading_time: number | null
  published_at: string | null
  updated_at: string
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data } = await (supabaseAdmin as any)
    .from('articles')
    .select('title, excerpt, cover_image, meta_title, meta_description')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!data) return {}
  const title = (data.meta_title as string) || (data.title as string)
  const description = (data.meta_description as string) || (data.excerpt as string) || title
  const cover = data.cover_image as string | null

  return {
    title: `${title} — Kreevo`,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title,
      description,
      url: siteUrl(`/blog/${slug}`),
      siteName: 'Kreevo',
      type: 'article',
      ...(cover ? { images: [{ url: cover }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(cover ? { images: [cover] } : {}),
    },
  }
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params
  const dict = await getDict()

  const { data: row } = await (supabaseAdmin as any)
    .from('articles')
    .select(
      'id, slug, title, excerpt, content, cover_image, category, meta_title, meta_description, reading_time, published_at, updated_at',
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!row) notFound()
  const art = row as Article

  // Increment view count (best-effort, fire-and-forget, server-side only)
  void (async () => {
    try {
      const { data: cur } = await (supabaseAdmin as any)
        .from('articles')
        .select('views')
        .eq('id', art.id)
        .single()
      await (supabaseAdmin as any)
        .from('articles')
        .update({ views: (cur?.views ?? 0) + 1 })
        .eq('id', art.id)
    } catch {
      /* ignore */
    }
  })()

  const dateIso = art.published_at ?? art.updated_at
  const formattedDate = new Date(dateIso).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const ld = blogPostingSchema({
    title: art.meta_title || art.title,
    description: art.meta_description || art.excerpt || art.title,
    url: `/blog/${art.slug}`,
    image: art.cover_image,
    datePublished: dateIso,
    dateModified: art.updated_at,
  })

  return (
    <main className="relative min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <MarketingHeader t={dict.landing.nav} />

      <article className="mx-auto w-full max-w-[760px] px-4 sm:px-6 pt-10 pb-20 sm:pt-12">
        <header>
          {art.category && (
            <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {art.category}
            </span>
          )}
          <h1 className="mt-3 font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            {art.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              {formattedDate}
            </span>
            {art.reading_time != null && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {art.reading_time} min de lecture
              </span>
            )}
          </div>
        </header>

        {art.cover_image && (
          <div className="mt-8 overflow-hidden rounded-[24px] border border-border bg-secondary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={art.cover_image} alt={art.title} className="w-full object-cover" />
          </div>
        )}

        <div className="mt-8">
          <BlogContent html={art.content} />
        </div>

        {/* CTA inscription */}
        <div className="mt-12 rounded-[24px] border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-bold text-foreground">Prêt à passer à la pratique ?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Rejoins Kreevo : des challenges design réels, du feedback IA et un système de ligues pour progresser pour de
            vrai.
          </p>
          <div className="mt-5 flex justify-center">
            <Button size="lg" render={<a href="/signup" />}>
              Commencer gratuitement
            </Button>
          </div>
        </div>
      </article>

      <MarketingFooter />
    </main>
  )
}
