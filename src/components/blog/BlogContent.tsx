/**
 * BlogContent — rendu HTML d'un article de blog (output WYSIWYG Tiptap).
 * Le contenu est de l'HTML de confiance (écriture admin-only via Server Actions
 * + requireAdmin), donc pas de DOMPurify — même raisonnement que ArticleContent.
 * Réutilise le pattern « prose maison » (sélecteurs arbitraires + tokens DS) et
 * ajoute le radius signature sur les images. Composant distinct d'ArticleContent
 * (toujours utilisé par le help center).
 */
export function BlogContent({ html }: { html: string }) {
  return (
    <div
      className="
        max-w-none text-foreground text-[1.0625rem]
        [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-10 [&_h1]:mb-4
        [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-foreground
        [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-7 [&_h3]:mb-2 [&_h3]:text-foreground
        [&_p]:leading-relaxed [&_p]:text-foreground/90 [&_p]:my-5
        [&_strong]:font-semibold [&_strong]:text-foreground
        [&_em]:italic
        [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-80
        [&_ul]:my-5 [&_ul]:ps-6 [&_ul]:space-y-2 [&_ul]:list-disc
        [&_ol]:my-5 [&_ol]:ps-6 [&_ol]:space-y-2 [&_ol]:list-decimal
        [&_li]:leading-relaxed [&_li]:text-foreground/90
        [&_blockquote]:border-s-4 [&_blockquote]:border-primary/40 [&_blockquote]:bg-muted/40 [&_blockquote]:rounded-e-lg [&_blockquote]:px-5 [&_blockquote]:py-3 [&_blockquote]:my-6 [&_blockquote]:italic [&_blockquote]:text-foreground/80
        [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[0.85em] [&_code]:font-mono [&_code]:text-foreground
        [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-2xl [&_pre]:my-6 [&_pre]:overflow-x-auto
        [&_pre_code]:bg-transparent [&_pre_code]:p-0
        [&_img]:rounded-[24px] [&_img]:my-7 [&_img]:w-full
        [&_hr]:my-10 [&_hr]:border-border
      "
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default BlogContent
