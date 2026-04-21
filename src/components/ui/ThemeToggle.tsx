'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark' | 'system'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  }
}

const OPTIONS: { value: Theme; Icon: React.FC<{ className?: string; strokeWidth?: number }>; label: string }[] = [
  { value: 'light',  Icon: Sun,     label: 'Mode clair'  },
  { value: 'dark',   Icon: Moon,    label: 'Mode sombre' },
  { value: 'system', Icon: Monitor, label: 'Système'     },
]

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as Theme) || 'system'
    setTheme(saved)
  }, [])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  function select(t: Theme) {
    setTheme(t)
    localStorage.setItem('theme', t)
    applyTheme(t)
  }

  return (
    <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-full p-1">
      {OPTIONS.map(({ value, Icon, label }) => (
        <button
          key={value}
          onClick={() => select(value)}
          title={label}
          className={cn(
            'flex items-center justify-center size-7 rounded-full transition-all duration-150',
            theme === value
              ? 'bg-white dark:bg-zinc-700 shadow-sm text-foreground'
              : 'text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700/50'
          )}
        >
          <Icon className="size-3.5" strokeWidth={1.5} />
        </button>
      ))}
    </div>
  )
}
