import { HelpArticleForm } from '@/components/admin/HelpArticleForm'

export default function NewHelpArticle() {
  return (
    <div className="p-6 max-w-[1200px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvel article</h1>
        <p className="text-sm text-muted-foreground">
          Créer un nouvel article du centre d&apos;aide (FR + EN obligatoire).
        </p>
      </div>
      <HelpArticleForm />
    </div>
  )
}
