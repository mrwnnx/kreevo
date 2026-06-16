import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Presentational stat card — shared by the dashboard (`StatCards`) and the public
 * profile (`/u/[username]`). Pure visual: no business data, no i18n. Callers pass
 * the already-localized `label`, the `icon` node, the `value` node, and per-stat
 * color classes (`valueClass`). Visual spec = the dashboard card: filled `bg-card`,
 * `rounded-[24px]`, icon to the right, bold tracked label, large bold value.
 */
export function StatCard({
  label,
  icon,
  value,
  valueClass,
  iconClass,
}: {
  label: string
  icon: ReactNode
  value: ReactNode
  valueClass?: string
  iconClass?: string
}) {
  return (
    <div className="h-full flex flex-col justify-between gap-4 bg-card border border-border rounded-[24px] p-4 hover:shadow-sm transition-shadow duration-200">
      <div className="flex items-center justify-between h-5">
        <span className="text-xs font-bold text-foreground tracking-widest leading-none uppercase">
          {label}
        </span>
        <span className={cn('inline-flex items-center justify-center w-5 h-5 shrink-0', iconClass)}>
          {icon}
        </span>
      </div>
      <p className={cn('text-2xl sm:text-xl font-bold', valueClass)}>{value}</p>
    </div>
  )
}
