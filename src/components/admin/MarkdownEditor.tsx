'use client'

import { useMemo, useState } from 'react'
import { marked } from 'marked'
import { Eye, Pencil, Columns2 } from 'lucide-react'
import { cn } from '@/lib/utils'

marked.setOptions({ gfm: true, breaks: false })

interface Props {
  value: string
  onChange: (next: string) => void
  label?: string
  placeholder?: string
  rows?: number
}

type Mode = 'edit' | 'split' | 'preview'

const previewClass = `
  max-w-none text-foreground text-sm
  [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-3
  [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2
  [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5
  [&_p]:my-3 [&_p]:leading-relaxed
  [&_strong]:font-semibold
  [&_em]:italic
  [&_a]:text-primary [&_a]:underline
  [&_ul]:my-3 [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:list-disc
  [&_ol]:my-3 [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:list-decimal
  [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:bg-muted/40 [&_blockquote]:rounded-r [&_blockquote]:px-3 [&_blockquote]:py-2 [&_blockquote]:my-3 [&_blockquote]:italic
  [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
  [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded [&_pre]:my-3 [&_pre]:overflow-x-auto
  [&_pre_code]:bg-transparent [&_pre_code]:p-0
  [&_table]:w-full [&_table]:my-3 [&_table]:text-xs
  [&_th]:text-left [&_th]:font-semibold [&_th]:bg-muted/40 [&_th]:px-2 [&_th]:py-1.5 [&_th]:border [&_th]:border-border
  [&_td]:px-2 [&_td]:py-1.5 [&_td]:border [&_td]:border-border
  [&_hr]:my-4
`

export function MarkdownEditor({
  value,
  onChange,
  label,
  placeholder = 'Markdown content…',
  rows = 18,
}: Props) {
  const [mode, setMode] = useState<Mode>('split')
  const html = useMemo(() => marked.parse(value || '', { async: false }) as string, [value])

  const tabs: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: 'edit', label: 'Edit', icon: <Pencil className="size-3.5" /> },
    { id: 'split', label: 'Split', icon: <Columns2 className="size-3.5" /> },
    { id: 'preview', label: 'Preview', icon: <Eye className="size-3.5" /> },
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        {label && (
          <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            {label}
          </label>
        )}
        <div className="ml-auto inline-flex items-center gap-0.5 p-0.5 bg-muted rounded-lg">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setMode(t.id)}
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md transition-colors',
                mode === t.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-pressed={mode === t.id}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        className={cn(
          'grid gap-3 border border-border rounded-xl overflow-hidden bg-background',
          mode === 'split' && 'md:grid-cols-2',
          mode !== 'split' && 'grid-cols-1',
        )}
      >
        {(mode === 'edit' || mode === 'split') && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            spellCheck={false}
            className="w-full font-mono text-xs leading-relaxed p-3 bg-background outline-none border-0 md:border-r md:border-border resize-y min-h-[280px]"
          />
        )}
        {(mode === 'preview' || mode === 'split') && (
          <div
            className={cn(
              'p-4 overflow-y-auto bg-card min-h-[280px]',
              !html && 'flex items-center justify-center text-muted-foreground italic text-sm',
            )}
          >
            {html ? (
              <div className={previewClass} dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <span>Preview will appear here.</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
