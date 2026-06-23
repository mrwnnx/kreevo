import Link from 'next/link'
import type { Metadata } from 'next'
import { Clock } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getDict } from '@/lib/i18n/lang'
import { siteUrl } from '@/lib/site'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

export const dynamic = 'force-dynamic'

const META = {
  title: 'Blog — Kreevo',
  description:
    'Conseils design, retours d’expérience et ressources pour progresser : UX/UI, portfolio, carrière et challenges Kreevo.',
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: META.title,
    description: META.description,
    alternates: { canonical: '/blog' },
    openGraph: {
      title: META.title,
      description: META.description,
      url: siteUrl('/blog'),
      siteName: 'Kreevo',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: META.title, description: META.description },
  }
}

type Row = {
  slug: string
  title: string
  excerpt: string | null
  cover_image: string | null
  category: string | null
  reading_time: number | null
  published_at: string | null
}

export default async function BlogIndexPage() {
  const dict = await getDict()
  const { data } = await (supabaseAdmin as any)
    .from('articles')
    .select('slug, title, excerpt, cover_image, category, reading_time, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  const articles = (data ?? []) as Row[]

  return (
    <main className="relative min-h-screen bg-background">
      <MarketingHeader t={dict.landing.nav} />

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-12 pb-20 sm:pt-16">
        <header className="mb-10 max-w-2xl">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Blog</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{META.description}</p>
        </header>

        {articles.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucun article pour le moment.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <article
                key={a.slug}
                className="group rounded-[24px] border border-border bg-card overflow-hidden transition-shadow hover:shadow-md"
              >
                <Link href={`/blog/${a.slug}`} className="block">
                  <div className="aspect-[16/9] overflow-hidden bg-secondary">
                    {a.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.cover_image}
                        alt={a.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                        <span className="text-4xl">✦</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    {a.category && (
                      <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {a.category}
                      </span>
                    )}
                    <h2 className="mt-2 text-lg font-semibold leading-snug text-foreground line-clamp-2">
                      {a.title}
                    </h2>
                    {a.excerpt && (
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground line-clamp-2">{a.excerpt}</p>
                    )}
                    <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                      {a.published_at && (
                        <span className="tabular-nums">
                          {new Date(a.published_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                      {a.reading_time != null && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {a.reading_time} min
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <MarketingFooter />
    </main>
  )
}
