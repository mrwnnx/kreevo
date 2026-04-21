import Link from 'next/link'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  label: string
  done: boolean
  href: string
}

interface GettingStartedProps {
  steps: Step[]
}

export function GettingStarted({ steps }: GettingStartedProps) {
  const completed = steps.filter(s => s.done).length
  const total = steps.length

  if (completed === total) {
    return (
      <div className="rounded-2xl border border-green-200 dark:border-green-900/50 bg-green-50/60 dark:bg-green-900/20 p-4 text-center space-y-2">
        <p className="text-2xl">🎉</p>
        <p className="font-semibold text-green-800 dark:text-green-400">Profil complet !</p>
        <p className="text-sm text-green-700 dark:text-green-500">Tu as terminé toutes les étapes de démarrage.</p>
      </div>
    )
  }

  const firstActiveIndex = steps.findIndex(s => !s.done)

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Pour commencer 🚀</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{completed}/{total} complétés</p>
        </div>
        <span className="text-sm font-mono text-primary font-semibold">
          {Math.round((completed / total) * 100)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${(completed / total) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <ul className="space-y-2">
        {steps.map((step, i) => {
          const isActive = i === firstActiveIndex
          const isDone = step.done
          const isLocked = !isDone && i > firstActiveIndex

          return (
            <li key={step.id}>
              <Link
                href={isDone || isActive ? step.href : '#'}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all',
                  isDone && 'bg-muted/60 text-muted-foreground cursor-default',
                  isActive && 'bg-card border border-primary/30 shadow-sm font-semibold text-foreground hover:border-primary/60',
                  isLocked && 'text-muted-foreground/50 cursor-default'
                )}
              >
                {isDone
                  ? <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                  : <Circle className={cn('size-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground/40')} />
                }
                <span className={cn(isDone && 'line-through')}>{step.label}</span>
                {isActive && (
                  <span className="ml-auto text-[10px] font-mono text-primary uppercase tracking-widest">
                    À faire
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
