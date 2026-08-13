import { MovingGradientBackground } from '@/components/marketing/MovingGradientBackground'

/**
 * GlassShell — enveloppe visuelle de la refonte : blobs pastel animés en fond,
 * panneau verre par-dessus, contenu au-dessus. Utilisé par l'accueil refondue
 * et le Help Center.
 */
export function GlassShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`relative min-h-screen overflow-x-clip bg-background ${className ?? ''}`}>
      <MovingGradientBackground intensity="strong" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 rounded-b-[32px] border-x-2 border-b-2 border-white bg-gradient-to-t from-white/0 to-white/[0.32] shadow-[0px_4px_45px_0px_rgba(0,0,0,0.1)] backdrop-blur-[32px]"
      />
      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  )
}

/** Recette « verre » des cartes (Figma 440:408) — anneau blanc + dégradé. */
export const GLASS_SURFACE =
  'rounded-[24px] border-[1.973px] border-white shadow-[0px_3.945px_44.385px_0px_rgba(0,0,0,0.1)] backdrop-blur-[59.18px]'

export const GLASS_GRADIENT = {
  backgroundImage:
    'linear-gradient(236.06deg, rgba(255,255,255,0.51) 23.035%, rgba(255,255,255,0.117) 119.63%)',
} as const

export default GlassShell
