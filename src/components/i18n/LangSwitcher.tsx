'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setLang } from '@/lib/i18n/actions'
import { cn } from '@/lib/utils'
import type { Lang } from '@/lib/i18n/tx'

interface Props {
  current: Lang
  /** Pill style (default) for menus, or `radio` for settings cards. */
  variant?: 'pill' | 'radio'
  className?: string
}

const LABELS: Record<Lang, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
}

const LANGS: readonly Lang[] = ['fr', 'en', 'ar']

export function LangSwitcher({ current, variant = 'pill', className }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function pick(lang: Lang) {
    if (lang === current || isPending) return
    startTransition(async () => {
      await setLang(lang)
      router.refresh()
    })
  }

  if (variant === 'radio') {
    return (
      <div className={cn('grid sm:grid-cols-2 gap-2', isPending && 'opacity-60', className)}>
        {LANGS.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => pick(lang)}
            disabled={isPending}
            aria-pressed={current === lang}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors text-left',
              current === lang
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40',
            )}
          >
            <span className="text-base font-bold uppercase font-mono w-8">{lang}</span>
            <span>{LABELS[lang]}</span>
            {current === lang && (
              <span className="ml-auto text-xs text-primary">✓</span>
            )}
          </button>
        ))}
      </div>
    )
  }

  // Pill variant
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-full bg-muted text-xs font-medium',
        isPending && 'opacity-60',
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => pick(lang)}
          disabled={isPending}
          aria-pressed={current === lang}
          className={cn(
            'px-3 py-1 rounded-full transition-colors uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            current === lang
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {lang}
        </button>
      ))}
    </div>
  )
}
