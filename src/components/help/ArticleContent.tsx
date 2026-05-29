import { marked } from 'marked'

// Configure marked once for help articles
marked.setOptions({
  gfm: true,
  breaks: false,
})

/**
 * Server-side markdown renderer.
 * Trusted content (admin-only writes via RLS) → no DOMPurify needed.
 * Output styled via Tailwind `prose` utility classes on the wrapper.
 */
export function ArticleContent({ markdown }: { markdown: string }) {
  const html = marked.parse(markdown, { async: false }) as string

  return (
    <article
      className="
        max-w-none text-foreground
        [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4
        [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-foreground
        [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-foreground
        [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:text-foreground/90 [&_p]:my-4
        [&_strong]:font-semibold [&_strong]:text-foreground
        [&_em]:italic
        [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-80
        [&_ul]:my-4 [&_ul]:ps-6 [&_ul]:space-y-1.5 [&_ul]:list-disc
        [&_ol]:my-4 [&_ol]:ps-6 [&_ol]:space-y-1.5 [&_ol]:list-decimal
        [&_li]:text-[15px] [&_li]:leading-relaxed [&_li]:text-foreground/90
        [&_blockquote]:border-s-4 [&_blockquote]:border-primary/40 [&_blockquote]:bg-muted/40 [&_blockquote]:rounded-e-lg [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-foreground/80
        [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_code]:font-mono [&_code]:text-foreground
        [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-2xl [&_pre]:my-4 [&_pre]:overflow-x-auto
        [&_pre_code]:bg-transparent [&_pre_code]:p-0
        [&_table]:w-full [&_table]:my-4 [&_table]:text-sm [&_table]:border-collapse
        [&_th]:text-start [&_th]:font-semibold [&_th]:bg-muted/40 [&_th]:px-3 [&_th]:py-2 [&_th]:border [&_th]:border-border
        [&_td]:px-3 [&_td]:py-2 [&_td]:border [&_td]:border-border
        [&_hr]:my-8 [&_hr]:border-border
      "
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
