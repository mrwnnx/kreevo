'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setHelpLang } from '@/app/help/lang-action'
import { cn } from '@/lib/utils'
import type { HelpLang } from '@/lib/help/lang'

export function LanguageSwitcher({ current }: { current: HelpLang }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function pick(lang: HelpLang) {
    if (lang === current) return
    startTransition(async () => {
      await setHelpLang(lang)
      router.refresh()
    })
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-full bg-muted text-xs font-medium',
        isPending && 'opacity-60',
      )}
      role="group"
      aria-label="Language"
    >
      {(['fr', 'en'] as const).map((lang) => (
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
