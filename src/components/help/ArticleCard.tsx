import Link from 'next/link'
import { GLASS_SURFACE, GLASS_GRADIENT } from '@/components/layout/GlassShell'
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
      className={`${GLASS_SURFACE} group flex items-start justify-between gap-4 p-5 transition-[translate,scale,box-shadow] duration-[1100ms] ease-[cubic-bezier(0,0,0,0.99)] hover:-translate-y-[6px] hover:shadow-[0px_18px_60px_0px_rgba(0,0,0,0.14)] motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
      style={GLASS_GRADIENT}
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
