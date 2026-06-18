import { Clock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * ChallengePreviewCard — carte d'aperçu de challenge, PRÉSENTATIONNELLE.
 *
 * Extraction FIDÈLE du ChallengeCard pastel du dashboard
 * (src/app/(dashboard)/dashboard/challenges/page.tsx) : mêmes tokens DS, même
 * structure (cadre pastel rounded-[20px], emoji, titre 2xl, brief, pills,
 * pill XP blanche + /xp-flash.svg, deadline, bouton flèche rond). Aucune couleur
 * ni font inventée — la palette PASTELS est reprise VERBATIM de la carte existante.
 */

// ⬇️ Repris tel quel du ChallengeCard du dashboard (design system pastel multicolore).
const PASTELS: { top: string; pill: string }[] = [
  { top: 'bg-[hsl(217,91%,95%)] dark:bg-[hsl(217,40%,13%)]', pill: 'bg-[hsl(217,75%,86%)] text-[hsl(217,55%,30%)] dark:bg-[hsl(217,40%,24%)] dark:text-[hsl(217,70%,82%)]' },
  { top: 'bg-[hsl(25,95%,95%)] dark:bg-[hsl(25,40%,13%)]',   pill: 'bg-[hsl(25,80%,86%)] text-[hsl(25,60%,32%)] dark:bg-[hsl(25,40%,24%)] dark:text-[hsl(25,75%,82%)]' },
  { top: 'bg-[hsl(263,85%,95%)] dark:bg-[hsl(263,40%,13%)]', pill: 'bg-[hsl(263,70%,86%)] text-[hsl(263,50%,32%)] dark:bg-[hsl(263,40%,24%)] dark:text-[hsl(263,65%,82%)]' },
  { top: 'bg-[hsl(152,60%,95%)] dark:bg-[hsl(152,35%,13%)]', pill: 'bg-[hsl(152,50%,84%)] text-[hsl(152,45%,28%)] dark:bg-[hsl(152,35%,24%)] dark:text-[hsl(152,55%,80%)]' },
  { top: 'bg-[hsl(350,89%,95%)] dark:bg-[hsl(350,40%,13%)]', pill: 'bg-[hsl(350,75%,86%)] text-[hsl(350,55%,34%)] dark:bg-[hsl(350,40%,24%)] dark:text-[hsl(350,70%,82%)]' },
  { top: 'bg-[hsl(190,80%,95%)] dark:bg-[hsl(190,40%,13%)]', pill: 'bg-[hsl(190,65%,84%)] text-[hsl(190,55%,28%)] dark:bg-[hsl(190,40%,24%)] dark:text-[hsl(190,65%,80%)]' },
  { top: 'bg-[hsl(43,96%,95%)] dark:bg-[hsl(43,40%,13%)]',   pill: 'bg-[hsl(43,85%,84%)] text-[hsl(43,70%,30%)] dark:bg-[hsl(43,40%,24%)] dark:text-[hsl(43,80%,80%)]' },
  { top: 'bg-[hsl(290,80%,95%)] dark:bg-[hsl(290,40%,13%)]', pill: 'bg-[hsl(290,65%,86%)] text-[hsl(290,50%,34%)] dark:bg-[hsl(290,40%,24%)] dark:text-[hsl(290,65%,82%)]' },
]

export interface ChallengePreview {
  emoji?: string | null
  title: string
  brief: string
  specialty?: string | null
  type?: string | null
  industry?: string | null
  xp?: number | null
  deadlineDays?: number | null
  colorIndex?: number
}

export function ChallengePreviewCard({
  emoji, title, brief, specialty, type, industry, xp, deadlineDays, colorIndex = 0,
  xpLabel = 'XP', daysSuffix = 'j', // unités — remplaçables par l'i18n (t.xp / t.daysSuffix)
}: ChallengePreview & { xpLabel?: string; daysSuffix?: string }) {
  const style = PASTELS[colorIndex % PASTELS.length]
  const resolvedEmoji =
    emoji ||
    (specialty === 'UX Designer' ? '📱'
    : specialty === 'UI Designer' ? '🎨'
    : specialty === 'Graphic Designer' ? '✏️'
    : '🎯')
  const tags = [specialty, type, industry].filter(Boolean) as string[]

  return (
    <div className="group relative block rounded-[28px] border border-border bg-card overflow-hidden p-2 transition-all duration-150 hover:shadow-lg">
      {/* Cadre pastel intérieur */}
      <div className={cn('rounded-[20px] p-4 flex flex-col gap-6', style.top)}>
        <div>
          <div className="text-3xl mb-6 leading-none">{resolvedEmoji}</div>
          <h3 className="text-2xl font-semibold text-foreground leading-tight">{title}</h3>
          <p className="mt-1 text-sm text-foreground/70 leading-snug line-clamp-2">{brief}</p>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className={cn('rounded-lg px-3 py-1 text-sm font-medium', style.pill)}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm">
          {xp != null && xp > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-bold text-zinc-900 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/xp-flash.svg" alt="" className="size-4" />
              {xp} {xpLabel}
            </span>
          )}
          {deadlineDays != null && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-4" />
              <strong className="font-semibold text-foreground">{deadlineDays}</strong>{daysSuffix}
            </span>
          )}
        </div>
      </div>

      {/* Footer blanc : flèche ronde (état "available") */}
      <div className="flex items-center justify-end mt-2">
        <span className="size-9 rounded-full border border-border text-foreground flex items-center justify-center shrink-0 transition-colors group-hover:bg-foreground group-hover:text-background">
          <ArrowRight className="size-4" />
        </span>
      </div>
    </div>
  )
}
