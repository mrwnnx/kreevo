'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  placeholder: string
  defaultValue?: string
  size?: 'lg' | 'md'
  className?: string
}

export function HelpSearchBar({
  placeholder,
  defaultValue = '',
  size = 'md',
  className,
}: Props) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    router.push(`/help/search?q=${encodeURIComponent(q)}`)
  }

  const isLg = size === 'lg'

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className={cn(
        'relative flex items-center w-full h-10 pl-3 pr-1 bg-transparent dark:bg-input/30 border border-input rounded-[var(--radius-input)] transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        className,
      )}
    >
      <Search className="shrink-0 size-4 mr-2 text-muted-foreground" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="flex-1 min-w-0 bg-transparent outline-none text-base md:text-sm placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        className="shrink-0 inline-flex items-center justify-center h-8 px-4 rounded-[calc(var(--radius-input)-2px)] bg-primary text-primary-foreground text-sm font-semibold transition-opacity hover:opacity-85"
      >
        {isLg ? 'Rechercher' : 'Go'}
      </button>
    </form>
  )
}
