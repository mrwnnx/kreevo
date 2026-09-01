import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  className?: string
}

/**
 * "Validated" badge — shown only for `kind === 'challenge'` submissions.
 * A personal (`portfolio`) project never carries this badge: the distinction
 * values the challenge work instead of stigmatizing the portfolio (product
 * decision, see .scratch/portfolio-projets/spec.md).
 *
 * `kind` is structural (a DB column, not user-editable), so this badge can't
 * be faked by a portfolio project pretending to be validated.
 *
 * Reused on the public project page (`/p/[id]`) and, from lot 08, on feed
 * cards — kept dumb (no i18n/data fetching of its own) so both call sites
 * render the exact same markup instead of drifting apart.
 */
export function ValidatedBadge({ label, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700',
        className,
      )}
    >
      <CheckCircle2 className="size-3.5" />
      {label}
    </span>
  )
}
