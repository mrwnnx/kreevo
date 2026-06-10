import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { tx } from '@/lib/i18n/tx'
import { cn } from '@/lib/utils'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

interface Props {
  name: string
  title: string
  description: string
  imageUrl: string | null
  current: number
  total: number
  t: Dictionary['onboardingTour'] // labels chrome : stepOf / skip / back / next / finish
  isFirst: boolean
  isLast: boolean
  dir?: 'ltr' | 'rtl'
  onBack?: () => void
  onSkip?: () => void
  onNext?: () => void
  interactive?: boolean // false → boutons inertes (aperçu admin)
}

// Rendu visuel d'UNE slide du tour — SOURCE UNIQUE partagée par OnboardingTour
// (modal user) et l'aperçu admin (OnboardingStepForm). Ne contient PAS le Dialog :
// le parent fournit le « cartouche » (rounded-2xl / border / bg-popover / overflow).
export function OnboardingSlide({
  name, title, description, imageUrl, current, total, t,
  isFirst, isLast, dir, onBack, onSkip, onNext, interactive = true,
}: Props) {
  return (
    <div dir={dir}>
      {/* ── Header : image si fournie, sinon gradient placeholder ── */}
      <div className="relative h-44 w-full">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--xp-from)] to-[var(--xp-to)]">
            <Sparkles className="size-14 text-white/90" strokeWidth={1.6} />
          </div>
        )}
      </div>

      {/* ── Corps ── */}
      <div className="px-6 pt-5 pb-1 space-y-1.5 text-start">
        <p className="text-sm text-muted-foreground">{tx(t.stepOf, { current, total, name })}</p>
        <h2 className="text-lg font-medium leading-snug">{title}</h2>
        <p className="text-base text-muted-foreground">{description}</p>
      </div>

      {/* ── Footer ── */}
      <div className={cn('flex items-center justify-between px-6 py-4', !interactive && 'pointer-events-none')}>
        <Button variant="secondary" onClick={onBack} className={cn(isFirst && 'invisible')}>{t.back}</Button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.skip}
          </button>
          {/* Next : violet brand via token --xp-from, pas de hardcode. */}
          <Button
            onClick={onNext}
            className="bg-[var(--xp-from)] text-white hover:bg-[var(--accent-hover)] hover:opacity-100"
          >
            {isLast ? t.finish : t.next}
          </Button>
        </div>
      </div>
    </div>
  )
}
