import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GLASS_SURFACE, GLASS_GRADIENT } from '@/components/layout/GlassShell'
import type { HelpCategory } from '@/lib/help/categories'
import type { HelpLang, HelpDictionary } from '@/lib/help/lang'

interface Props {
  category: HelpCategory
  count: number
  lang: HelpLang
  t: HelpDictionary
}

export function CategoryCard({ category, count, lang, t }: Props) {
  const Icon = category.icon
  const label = lang === 'en' ? category.label_en : category.label_fr
  const description = lang === 'en' ? category.description_en : category.description_fr

  return (
    <Link
      href={`/help/${category.slug}`}
      className={cn(
        GLASS_SURFACE,
        'group block p-5 transition-[translate,scale,box-shadow] duration-[1100ms] ease-[cubic-bezier(0,0,0,0.99)]',
        'hover:-translate-y-[9px] hover:scale-[1.006] hover:shadow-[0px_18px_60px_0px_rgba(0,0,0,0.14)]',
        'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6040C0]',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100',
      )}
      style={GLASS_GRADIENT}
    >
      <div
        className={cn(
          'size-11 rounded-2xl flex items-center justify-center mb-4',
          category.iconBgClass,
          category.iconColorClass,
        )}
      >
        <Icon className="size-5" strokeWidth={2.2} />
      </div>

      <h3 className="text-base font-semibold text-foreground mb-1 leading-tight">
        {label}
      </h3>
      <p className="text-sm text-muted-foreground leading-snug mb-4 line-clamp-2">
        {description}
      </p>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {count} {count === 1 ? t.article : t.articles}
        </span>
        <ChevronRight
          className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all"
          aria-hidden
        />
      </div>
    </Link>
  )
}
