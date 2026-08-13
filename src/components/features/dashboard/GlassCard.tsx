import Link from 'next/link'

/**
 * GlassCard — carte « verre » de l'accueil refondue (Figma 431:5248).
 * Double bordure : anneau blanc 1.973px à l'extérieur, filet #dcdce8 0.986px à
 * l'intérieur. L'illustration 3D déborde en bas à droite, opacité 40 %.
 *
 * La carte entière est le lien ; la flèche n'est qu'un ornement (un <a> dans un
 * <a> serait invalide). Les transitions portent sur `translate`/`scale` et non
 * sur `transform` : en Tailwind v4 ces utilitaires écrivent dans les propriétés
 * CSS `translate` et `scale`, donc transitionner `transform` n'anime rien.
 */
export function GlassCard({
  href,
  label,
  illustration,
  illustrationClassName,
  className,
  children,
}: {
  href: string
  label: string
  illustration: string
  illustrationClassName?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`group relative flex items-start justify-center overflow-clip rounded-[31.563px] border-[1.973px] border-white shadow-[0px_3.945px_44.385px_0px_rgba(0,0,0,0.1)] backdrop-blur-[59.18px] transition-[translate,scale,box-shadow] duration-[1100ms] ease-[cubic-bezier(0,0,0,0.99)] hover:-translate-y-[9px] hover:scale-[1.006] hover:shadow-[0px_18px_60px_0px_rgba(0,0,0,0.14)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6040C0] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 ${className ?? ''}`}
      style={{
        backgroundImage:
          'linear-gradient(236.06deg, rgba(255,255,255,0.51) 23.035%, rgba(255,255,255,0.117) 119.63%)',
      }}
    >
      <div className="relative flex h-full min-w-px flex-[1_0_0] flex-col items-start gap-[15.781px] rounded-[31.563px] border-[0.986px] border-[#dcdce8] p-[24px]">
        <img
          src={illustration}
          alt=""
          aria-hidden
          className={`pointer-events-none absolute max-w-none opacity-40 transition-[translate,scale,opacity] duration-[950ms] ease-[cubic-bezier(0,0,0,0.99)] will-change-[translate,scale] group-hover:translate-x-[3px] group-hover:-translate-y-[3px] group-hover:scale-105 group-hover:opacity-[0.66] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100 ${illustrationClassName ?? ''}`}
        />
        {children}
        <span
          aria-hidden
          className="absolute end-[24px] top-[24px] rounded-[7.891px] border-[1.973px] border-white shadow-[0px_3.945px_44.385px_0px_rgba(0,0,0,0.1)] backdrop-blur-[59.18px] transition-[translate,scale] duration-[950ms] ease-[cubic-bezier(0,0,0,0.99)] group-hover:translate-x-[3px] group-hover:-translate-y-[3px] group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100"
          style={{
            backgroundImage:
              'linear-gradient(236.56deg, rgba(255,255,255,0.51) 23.035%, rgba(255,255,255,0.117) 119.63%)',
          }}
        >
          <span className="flex flex-col items-start rounded-[7.891px] border-[0.986px] border-[#dcdce8] p-[7.891px]">
            <span className="flex items-center justify-center rounded-full p-[1.973px]">
              <img
                src="/brand/icon-arrow-up-right.svg"
                alt=""
                aria-hidden
                className="size-[15.781px]"
              />
            </span>
          </span>
        </span>
      </div>
    </Link>
  )
}

/** Badge plein (STONE, PRO) — 10px extrabold, radius 4. */
export function CardBadge({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <span
      className={`flex items-center justify-center rounded-[4px] px-[6px] py-[4px] text-[10px] font-extrabold leading-none ${className ?? ''}`}
    >
      {label}
    </span>
  )
}

export default GlassCard
