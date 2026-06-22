import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * MarketingStatCard — wrapper MARKETING reprenant la recette DS du StatCard
 * (rounded-[24px], border, label `uppercase tracking-widest font-bold`, value `font-bold`)
 * MAIS avec : GRAND chiffre (text-4xl/5xl), sous-texte optionnel, variant de fond,
 * et image de FOND optionnelle (avec scrim pour la lisibilité).
 *
 * ⚠️ N'IMPORTE PAS et NE MODIFIE PAS le StatCard original (partagé dashboard + /u).
 * Couleurs 100 % tokens DS : --card / --secondary / --foreground / --color-league-gold.
 */

type Variant = 'card' | 'muted' | 'dark' | 'accent' | 'glass'

const VARIANTS: Record<Variant, { wrap: string; fg: string; sub: string; style?: React.CSSProperties }> = {
  card:   { wrap: 'bg-card border border-border', fg: 'text-foreground', sub: 'text-muted-foreground' },
  muted:  { wrap: 'bg-secondary border border-border', fg: 'text-foreground', sub: 'text-muted-foreground' },
  dark:   { wrap: 'bg-foreground border border-transparent', fg: 'text-background', sub: 'text-background/70' },
  accent: { wrap: 'border border-transparent', fg: 'text-foreground', sub: 'text-foreground/70', style: { background: 'var(--color-league-gold)' } },
  // liquid glass (iOS) : translucide + backdrop-blur (laisse voir le gradient animé derrière) + sheen + ombre
  glass:  { wrap: 'relative border border-foreground/10 bg-background/35 backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-b before:from-background/40 before:to-transparent', fg: 'text-foreground', sub: 'text-foreground/70' },
}

export function MarketingStatCard({
  label,
  value,
  sub,
  variant = 'card',
  icon,
  valueClass,
  imageSrc,
  className,
}: {
  label: ReactNode
  value: ReactNode
  sub?: string
  variant?: Variant
  icon?: ReactNode
  valueClass?: string
  imageSrc?: string // image de FOND optionnelle
  className?: string
}) {
  const v = VARIANTS[variant]
  const onImage = !!imageSrc
  const fg = onImage ? 'text-background' : v.fg
  const subFg = onImage ? 'text-background/80' : v.sub

  return (
    <div
      className={cn(
        'relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-[24px] p-6',
        // image : padding 16px → arrondi interne (8px) = externe (24px) − padding (16px)
        onImage ? 'min-h-[240px] border border-transparent p-4' : v.wrap,
        className,
      )}
      style={onImage ? undefined : v.style}
    >
      {onImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSrc} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        </>
      )}

      <div className="relative z-10 flex items-center justify-between">
        <span className={cn('text-xs font-bold uppercase tracking-widest leading-none', fg)}>{label}</span>
        {icon && <span className={cn('inline-flex h-5 w-5 shrink-0 items-center justify-center', fg)}>{icon}</span>}
      </div>
      <div className={cn('relative z-10', onImage && 'rounded-lg bg-card p-4')}>
        <p
          className={cn(
            'font-bold leading-[0.95] tracking-tight',
            onImage ? 'text-foreground' : fg,
            valueClass ?? 'text-4xl sm:text-5xl',
          )}
        >
          {value}
        </p>
        {sub && (
          <p className={cn('mt-2 text-sm leading-snug', onImage ? 'text-muted-foreground' : subFg)}>{sub}</p>
        )}
      </div>
    </div>
  )
}

export default MarketingStatCard
