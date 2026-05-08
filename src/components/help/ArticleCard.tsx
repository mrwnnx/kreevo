import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { HelpDictionary } from '@/lib/help/lang'

interface Props {
  href: string
  title: string
  excerpt?: string | null
  t: HelpDictionary
}

export function ArticleCard({ href, title, excerpt, t }: Props) {
  return (
    <Link
      href={href}
      className="group flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5 hover:bg-muted/40 hover:border-primary/30 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug mb-1">
          {title}
        </h3>
        {excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2">{excerpt}</p>
        )}
        <span className="inline-block text-xs font-medium text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {t.readMore}
        </span>
      </div>
      <ChevronRight
        className="size-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
        aria-hidden
      />
    </Link>
  )
}
