import { cn } from '@/lib/utils'

/**
 * Kreevo logo. Nouveau logo MULTICOLORE (squircle + wordmark), conçu pour fond clair.
 * Swap par thème (dark = class `.dark` sur <html>, cf. @custom-variant dark dans globals.css) :
 *   - fond clair  → logo couleur   (/logo_kreevo.svg)
 *   - fond sombre → variante claire (/logo_kreevo_light.svg)
 * 100 % CSS (deux <img>, l'un masqué via `dark:hidden`, l'autre via `hidden dark:block`),
 * aucun JS. API inchangée : <Logo className="h-5" /> contrôle la taille (h-4 par défaut).
 *
 * NOTE: /logo_kreevo_light.svg doit être déposé dans /public ; tant qu'il manque, le logo
 * en dark mode affichera une image cassée.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo_kreevo.svg" alt="Kreevo" className={cn('h-4 w-auto dark:hidden', className)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo_kreevo_light.svg" alt="Kreevo" className={cn('hidden h-4 w-auto dark:block', className)} />
    </>
  )
}
