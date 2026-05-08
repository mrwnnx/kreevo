import Link from 'next/link'
import { HELP_CATEGORIES, type HelpCategorySlug } from '@/lib/help/categories'
import { cn } from '@/lib/utils'
import type { HelpLang } from '@/lib/help/lang'

interface Props {
  current: HelpCategorySlug
  countsByCategory: Record<string, number>
  lang: HelpLang
}

export function CategorySidebar({ current, countsByCategory, lang }: Props) {
  return (
    <aside className="space-y-1.5">
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 px-3">
        {lang === 'en' ? 'All categories' : 'Toutes les catégories'}
      </p>
      {HELP_CATEGORIES.map((cat) => {
        const isActive = cat.slug === current
        const Icon = cat.icon
        const label = lang === 'en' ? cat.label_en : cat.label_fr
        return (
          <Link
            key={cat.slug}
            href={`/help/${cat.slug}`}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isActive
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <span
              className={cn(
                'size-7 rounded-lg flex items-center justify-center shrink-0',
                isActive ? cat.iconBgClass : '',
                cat.iconColorClass,
              )}
            >
              <Icon className="size-3.5" strokeWidth={2.4} />
            </span>
            <span className="flex-1 truncate">{label}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {countsByCategory[cat.slug] ?? 0}
            </span>
          </Link>
        )
      })}
    </aside>
  )
}
