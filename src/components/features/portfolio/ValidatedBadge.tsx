import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SUBMISSION_KIND_CHALLENGE, type SubmissionKind } from '@/lib/utils/submission-constants'

interface Props {
  kind: SubmissionKind
  label: string
  className?: string
}

/**
 * "Validated" badge — self-guarded: renders only for `kind === 'challenge'`,
 * `null` otherwise. A personal (`portfolio`) project never carries this
 * badge: the distinction values the challenge work instead of stigmatizing
 * the portfolio (product decision, see .scratch/portfolio-projets/spec.md).
 *
 * The guard lives here rather than in each caller on purpose — `kind` is
 * structural (a DB column, not user-editable), so this badge can't be faked
 * by a portfolio project, and a future caller (lot 08's feed cards) can pass
 * whatever `kind` it has without needing to know the rule itself.
 *
 * Reused on the public project page (`/p/[id]`) and, from lot 08, on feed
 * cards — kept dumb otherwise (no i18n/data fetching of its own) so both
 * call sites render the exact same markup instead of drifting apart.
 */
export function ValidatedBadge({ kind, label, className }: Props) {
  if (kind !== SUBMISSION_KIND_CHALLENGE) return null

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
