import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type ChecklistItem = {
  key: keyof Dictionary['dashboard']['completeProfile']['checklist']
  weight: number
  label: string
  done: boolean
}

function getCompletion(
  profile: any,
  labels: Dictionary['dashboard']['completeProfile']['checklist'],
): ChecklistItem[] {
  const fields: { key: ChecklistItem['key']; weight: number }[] = [
    { key: 'full_name', weight: 20 },
    { key: 'avatar_url', weight: 20 },
    { key: 'experience_level', weight: 20 },
    { key: 'objectives', weight: 20 },
    { key: 'specialty', weight: 20 },
  ]
  return fields.map(f => ({
    ...f,
    label: labels[f.key],
    done: Array.isArray(profile?.[f.key])
      ? profile[f.key]?.length > 0
      : !!profile?.[f.key],
  }))
}

export function CompleteProfile({
  profile,
  t,
}: {
  profile: any
  t: Dictionary['dashboard']['completeProfile']
}) {
  const checklist = getCompletion(profile, t.checklist)
  const completion = checklist.reduce((acc, f) => acc + (f.done ? f.weight : 0), 0)

  if (completion === 100) return null

  return (
    <div className="bg-card border border-border rounded-[24px] p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-sm">{t.title}</h3>
        <span className="text-sm font-bold text-orange-500">{completion}%</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {t.subtitle}
      </p>

      <div className="h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-orange-400 rounded-full transition-all duration-700"
          style={{ width: `${completion}%` }}
        />
      </div>

      <div className="space-y-2 mb-5">
        {checklist.map(item => (
          <div key={item.key} className="flex items-center gap-2">
            <div
              className={cn(
                'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                item.done ? 'bg-orange-400 text-white' : 'border-2 border-muted-foreground/30',
              )}
            >
              {item.done && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
            </div>
            <span
              className={cn(
                'text-sm transition-colors',
                item.done ? 'line-through text-muted-foreground' : 'text-foreground',
              )}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <Link href="/dashboard/profile">
        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm">
          {t.cta}
        </Button>
      </Link>
    </div>
  )
}
