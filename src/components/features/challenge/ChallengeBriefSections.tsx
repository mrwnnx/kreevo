import { CheckCircle2 } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

/**
 * Renders the structured brief sections of a challenge (context, deliverable,
 * constraints, evaluation criteria). Reusable by both the dashboard detail
 * page and the public detail page. Sections with no content are omitted.
 */

interface ChallengeBrief {
  context?: string | null
  deliverable?: string | null
  constraints?: string | null
  criteria?: string | null
}

interface Props {
  challenge: ChallengeBrief
  t: Dictionary['challengeDetail']['sections']
}

export function ChallengeBriefSections({ challenge, t }: Props) {
  return (
    <>
      {challenge.context && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold"><span className="mr-1">🎬</span>{t.scenario}</h2>
          <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">{challenge.context}</p>
        </section>
      )}

      {challenge.deliverable && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold"><span className="mr-1">📦</span>{t.deliverable}</h2>
          <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">{challenge.deliverable}</p>
        </section>
      )}

      {challenge.constraints && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold"><span className="mr-1">🚧</span>{t.constraints}</h2>
          <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">{challenge.constraints}</p>
        </section>
      )}

      {challenge.criteria && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold"><span className="mr-1">🎯</span>{t.criteria}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t.criteriaIntro}</p>
          </div>
          <div className="space-y-3">
            {challenge.criteria.split(/[.•\n]/).filter((s) => s.trim().length > 10).map((criterion, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                <p className="text-base text-foreground leading-relaxed">{criterion.trim()}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
