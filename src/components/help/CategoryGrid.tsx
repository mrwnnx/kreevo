import { HELP_CATEGORIES } from '@/lib/help/categories'
import { CategoryCard } from './CategoryCard'
import type { HelpLang, HelpDictionary } from '@/lib/help/lang'

interface Props {
  countsByCategory: Record<string, number>
  lang: HelpLang
  t: HelpDictionary
}

export function CategoryGrid({ countsByCategory, lang, t }: Props) {
  return (
    <section className="max-w-[1080px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h2 className="mb-6 text-xl font-semibold leading-[1.1] text-[#2b2c36] sm:mb-8 sm:text-2xl">
        {t.categoriesTitle}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {HELP_CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.slug}
            category={cat}
            count={countsByCategory[cat.slug] ?? 0}
            lang={lang}
            t={t}
          />
        ))}
      </div>
    </section>
  )
}
