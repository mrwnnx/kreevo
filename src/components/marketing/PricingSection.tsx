import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Reveal } from './Reveal'

/**
 * PricingSection — bloc abonnement Free / Pro, même style que FeaturesSection
 * (header titre+body, frame glass gris translucide, cartes bg-card dedans).
 *
 * Données = modèle réel Kreevo (Free vs Pro : ligues hautes + commentaires illimités
 * réservés au Pro). Tokens uniquement, aucune nouvelle font.
 *
 * ⚠️ PRIX = PLACEHOLDER (le vrai prix vient de Paddle) + copy en placeholders
 * (FR/EN/AR final fourni plus tard → i18n).
 */

type Plan = {
  name: string
  price: string
  period: string
  badge?: string
  features: string[]
  cta: string
}

const COPY: { header: { title: string; body: string }; free: Plan; pro: Plan } = {
  header: {
    title: 'Passe au niveau supérieur',
    body: 'Commence gratuitement. Passe en Pro quand tu veux débloquer toutes les ligues et le feedback sans limite.',
  },
  free: {
    name: 'Free',
    price: 'Gratuit',
    period: 'pour toujours',
    features: [
      'Un défi design chaque semaine',
      'Feedback IA sur tes soumissions',
      'Ligues de Stone à Gold',
      'Portfolio public partageable',
      'Commentaires limités par jour',
    ],
    cta: 'Commencer gratuitement',
  },
  pro: {
    name: 'Pro',
    badge: 'Populaire',
    price: '149 TND',
    period: '/ an',
    features: [
      'Tout le plan Free',
      'Toutes les ligues, jusqu’à Legend',
      'Commentaires illimités',
      'Feedback IA approfondi & prioritaire',
      'Soutiens le projet Kreevo',
    ],
    cta: 'Passer en Pro',
  },
}

function PlanCard({ plan, highlight = false, gradient = false }: { plan: Plan; highlight?: boolean; gradient?: boolean }) {
  return (
    <div className={cn('relative flex flex-col overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8')}>
      {/* Fond gradient du landing, contenu dans la carte (blobs tokens de ligue éclaircis). */}
      {gradient && (
        <div aria-hidden className="absolute inset-0">
          <span className="absolute -left-[15%] -top-[20%] size-[70%] rounded-full blur-[50px]" style={{ background: 'color-mix(in oklch, var(--color-league-gold) 25%, white)', opacity: 0.6 }} />
          <span className="absolute -right-[18%] -top-[12%] size-[65%] rounded-full blur-[55px]" style={{ background: 'color-mix(in oklch, var(--color-league-diamond) 23%, white)', opacity: 0.55 }} />
          <span className="absolute -bottom-[25%] left-[6%] size-[75%] rounded-full blur-[55px]" style={{ background: 'color-mix(in oklch, var(--color-league-master) 21%, white)', opacity: 0.5 }} />
          <span className="absolute -bottom-[18%] -right-[12%] size-[60%] rounded-full blur-[50px]" style={{ background: 'color-mix(in oklch, var(--color-league-legend) 21%, white)', opacity: 0.5 }} />
        </div>
      )}

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-heading text-xl font-bold text-foreground">{plan.name}</h3>
          {plan.badge && (
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              {plan.badge}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="font-heading text-4xl font-bold tracking-tight text-foreground">{plan.price}</span>
          <span className="text-sm text-muted-foreground">{plan.period}</span>
        </div>

        <ul className="mt-6 flex flex-col gap-3">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm leading-snug text-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-8">
          <Button
            size="lg"
            variant={highlight ? 'default' : 'outline'}
            className="w-full"
            render={<a href="/signup" />}
          >
            {plan.cta}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function PricingSection() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-20 sm:px-6 sm:py-28">
      <Reveal>
      {/* Header — titre + body (placeholders, i18n plus tard) */}
      <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
        <h2 className="font-heading text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
          {COPY.header.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {COPY.header.body}
        </p>
      </div>

      {/* Frame glass gris translucide (même style que Features) */}
      <div className="rounded-[28px] bg-secondary/50 p-2 backdrop-blur-xl">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <PlanCard plan={COPY.free} />
          <PlanCard plan={COPY.pro} highlight gradient />
        </div>
      </div>
      </Reveal>
    </section>
  )
}

export default PricingSection
