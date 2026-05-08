import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Eye, ThumbsUp, ThumbsDown } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { HelpArticleForm } from '@/components/admin/HelpArticleForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditHelpArticle({ params }: Props) {
  const { id } = await params

  const { data } = await (supabaseAdmin as any)
    .from('help_articles')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const totalVotes = (data.helpful ?? 0) + (data.not_helpful ?? 0)
  const helpfulRatio =
    totalVotes === 0 ? null : Math.round(((data.helpful ?? 0) / totalVotes) * 100)

  return (
    <div className="p-6 max-w-[1200px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{data.title_fr}</h1>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
          <span className="font-mono">/{data.slug}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3" /> {data.views ?? 0} vues
          </span>
          {helpfulRatio !== null && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <ThumbsUp className="size-3" /> {data.helpful ?? 0}
              </span>
              <span className="inline-flex items-center gap-1">
                <ThumbsDown className="size-3" /> {data.not_helpful ?? 0}
              </span>
              <span className="font-medium">({helpfulRatio}%)</span>
            </>
          )}
          <span>·</span>
          <Link
            href={`/help/${data.category}/${data.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Voir public <ExternalLink className="size-3" />
          </Link>
        </div>
      </div>

      <HelpArticleForm
        id={id}
        initial={{
          slug: data.slug,
          category: data.category,
          title_fr: data.title_fr,
          title_en: data.title_en,
          excerpt_fr: data.excerpt_fr ?? '',
          excerpt_en: data.excerpt_en ?? '',
          content_fr: data.content_fr,
          content_en: data.content_en,
          order_index: data.order_index ?? 0,
          published: data.published ?? true,
        }}
      />
    </div>
  )
}
