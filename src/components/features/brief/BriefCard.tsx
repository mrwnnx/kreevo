import Link from 'next/link'
import { Clock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GLASS_SURFACE, GLASS_GRADIENT } from '@/components/layout/GlassShell'
import { tx, type Lang } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

export interface BriefCardData {
  id: string
  title: string | null
  deadlineAt: string | null
  maxResponses: number | null
  closed: boolean
  companyName: string
  companyLogoUrl: string
  specialtyLabel: string
}

/**
 * Designer-facing brief card — `/dashboard/briefs`. Fermé, pas caché : a
 * closed brief still renders (dimmed, "Fermé" badge), it never disappears
 * from the list.
 */
export function BriefCard({ brief, lang, t }: { brief: BriefCardData; lang: Lang; t: Dictionary['briefsPage'] }) {
  const locale = lang === 'ar' ? 'ar' : lang === 'en' ? 'en-US' : 'fr-FR'
  const deadlineLabel = brief.deadlineAt
    ? new Date(brief.deadlineAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <Link
      href={`/dashboard/briefs/${brief.id}`}
      className={cn(
        GLASS_SURFACE,
        'group block overflow-hidden transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg',
        brief.closed && 'opacity-70',
      )}
      style={GLASS_GRADIENT}
    >
      <div className="flex h-full flex-col gap-3 rounded-[20px] border border-[#dcdce8] p-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brief.companyLogoUrl}
            alt=""
            className="size-10 shrink-0 rounded-lg border border-border object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-muted-foreground">{brief.companyName}</p>
            <h3 className="truncate text-base font-semibold text-foreground">{brief.title}</h3>
          </div>
          <span
            className={cn(
              'ms-auto shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
              brief.closed
                ? 'bg-muted text-muted-foreground'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            )}
          >
            {brief.closed ? t.statusClosed : t.statusOpen}
          </span>
        </div>

        {brief.specialtyLabel && (
          <span className="w-fit rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {brief.specialtyLabel}
          </span>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {deadlineLabel && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {deadlineLabel}
            </span>
          )}
          {!brief.closed && brief.maxResponses != null && (
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" />
              {tx(t.spotsLeft, { n: brief.maxResponses })}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
