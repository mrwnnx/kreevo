import { BlogArticleForm } from '@/components/admin/BlogArticleForm'

export default function NewBlogArticle() {
  return (
    <div className="p-6 max-w-[1200px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvel article</h1>
        <p className="text-sm text-muted-foreground">Rédige un nouvel article de blog (Markdown).</p>
      </div>
      <BlogArticleForm />
    </div>
  )
}
