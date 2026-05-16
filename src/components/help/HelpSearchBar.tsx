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
        'relative flex items-center w-full bg-white border border-border rounded-full transition-shadow focus-within:shadow-md focus-within:border-primary/40',
        isLg ? 'h-14 pl-5 pr-1.5' : 'h-11 pl-4 pr-1',
        className,
      )}
    >
      <Search
        className={cn(
          'shrink-0 text-muted-foreground',
          isLg ? 'size-5 mr-3' : 'size-4 mr-2',
        )}
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          'flex-1 bg-transparent outline-none placeholder:text-muted-foreground',
          isLg ? 'text-base' : 'text-sm',
        )}
      />
      <button
        type="submit"
        className={cn(
          'shrink-0 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold transition-opacity hover:opacity-85',
          isLg ? 'h-11 px-5 text-sm' : 'h-9 px-4 text-xs',
        )}
      >
        {isLg ? 'Rechercher' : 'Go'}
      </button>
    </form>
  )
}
