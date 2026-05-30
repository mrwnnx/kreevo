import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

/**
 * Renders the structured brief sections of a challenge (context, deliverable,
 * constraints, evaluation criteria). Reusable by both the dashboard detail
 * page and the public detail page. Sections with no content are omitted.
 *
 * deliverable / constraints / criteria are rendered as a real bullet list when
 * the content is a list (line breaks or an inline numbered enumeration), and as
 * a plain paragraph otherwise — so legacy prose challenges stay readable and a
 * single-line value never shows a lonely bullet. RTL-safe (no physical classes).
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

/** Strip a leading list marker: "- ", "• ", "* ", "1. ", "2) ", "(3) ". */
const stripMarker = (s: string) => s.replace(/^\s*(?:[-*•–·]|\(?\d+[.)])\s+/, '').trim()

/**
 * Split a field into list items. Splits on line breaks; if there are none but
 * the text contains an inline numbered enumeration (≥2 of "1." / "2)" / "(3)"),
 * splits on those markers. Returns a single item for plain prose.
 */
function toListItems(raw: string | null | undefined): string[] {
  const text = (raw ?? '').trim()
  if (!text) return []

  let normalized = text
  if (!/\r?\n/.test(text)) {
    // Count enumeration markers (require whitespace after the marker so "WCAG 2.1" is not split).
    const markers = text.match(/(?:^|\s)\(?\d+[.)]\s/g) || []
    if (markers.length >= 2) {
      normalized = text.replace(/\s(?=\(?\d+[.)]\s)/g, '\n')
    }
  }

  return normalized
    .split(/\r?\n+/)
    .map(stripMarker)
    .filter((s) => s.length > 1)
}

/** A section whose body is a bullet list (multi-item) or a paragraph (single). */
function ListSection({ icon, title, intro, value }: { icon: string; title: string; intro?: string; value: string }) {
  const items = toListItems(value)
  const asList = items.length > 1

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold"><span className="me-1">{icon}</span>{title}</h2>
        {intro && <p className="text-sm text-muted-foreground mt-1">{intro}</p>}
      </div>
      {asList ? (
        <ul className="space-y-2.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="size-1.5 rounded-full bg-primary mt-2.5 shrink-0" aria-hidden />
              <span className="text-base text-foreground leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">{value}</p>
      )}
    </section>
  )
}

export function ChallengeBriefSections({ challenge, t }: Props) {
  return (
    <>
      {challenge.context && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold"><span className="me-1">🎬</span>{t.scenario}</h2>
          <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">{challenge.context}</p>
        </section>
      )}

      {challenge.deliverable && (
        <ListSection icon="📦" title={t.deliverable} value={challenge.deliverable} />
      )}

      {challenge.constraints && (
        <ListSection icon="🚧" title={t.constraints} value={challenge.constraints} />
      )}

      {challenge.criteria && (
        <ListSection icon="🎯" title={t.criteria} intro={t.criteriaIntro} value={challenge.criteria} />
      )}
    </>
  )
}
