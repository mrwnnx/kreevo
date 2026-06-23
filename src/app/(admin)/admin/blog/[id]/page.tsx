import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { BlogArticleForm } from '@/components/admin/BlogArticleForm'

export const dynamic = 'force-dynamic'

type ArticleRow = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image: string | null
  category: string | null
  tags: string[] | null
  meta_title: string | null
  meta_description: string | null
  status: 'draft' | 'published'
}

export default async function EditBlogArticle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data } = await (supabaseAdmin as any)
    .from('articles')
    .select('id, title, slug, excerpt, content, cover_image, category, tags, meta_title, meta_description, status')
    .eq('id', id)
    .maybeSingle()

  if (!data) notFound()
  const a = data as ArticleRow

  return (
    <div className="p-6 max-w-[1200px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modifier l&apos;article</h1>
        <p className="text-sm text-muted-foreground font-mono">/blog/{a.slug}</p>
      </div>
      <BlogArticleForm
        id={a.id}
        initial={{
          id: a.id,
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt ?? '',
          content: a.content,
          cover_image: a.cover_image,
          category: a.category ?? '',
          tags: a.tags ?? [],
          meta_title: a.meta_title ?? '',
          meta_description: a.meta_description ?? '',
          status: a.status,
        }}
      />
    </div>
  )
}
