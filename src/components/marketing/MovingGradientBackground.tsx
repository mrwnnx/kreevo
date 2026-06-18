/**
 * MovingGradientBackground — fond à gradient animé (blobs de couleurs qui dérivent).
 * 100 % design system : couleurs = tokens `--color-league-*` (signature Kreevo),
 * aucune couleur en dur. Animation = transform (translate) only → perf. Opacité basse
 * pour rester lisible sur le fond clair. Respecte prefers-reduced-motion.
 *
 * Se place derrière le contenu : <main className="relative ... bg-background">
 *   <MovingGradientBackground /> <div className="relative z-10">…</div>
 */
export function MovingGradientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <style>{`
        @keyframes kvDrift1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(9vw,7vh) scale(1.08)} 66%{transform:translate(-7vw,5vh) scale(0.96)} }
        @keyframes kvDrift2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-11vw,-7vh) scale(1.1)} }
        @keyframes kvDrift3 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(8vw,-9vh) scale(1.05)} 80%{transform:translate(-6vw,6vh) scale(0.94)} }
        @media (prefers-reduced-motion: reduce) { .kv-blob { animation: none !important; } }
      `}</style>

      {/* Couleurs ÉCLAIRCIES : color-mix(token ligue, blanc) → pastel. Éparpillées aux coins/bords. */}
      <span className="kv-blob absolute -top-[10%] -left-[4%] h-[34vw] w-[34vw] rounded-full blur-[90px]"
        style={{ background: 'color-mix(in oklch, var(--color-league-gold) 32%, white)', opacity: 0.5, animation: 'kvDrift1 24s ease-in-out infinite' }} />
      <span className="kv-blob absolute -top-[6%] right-[2%] h-[32vw] w-[32vw] rounded-full blur-[90px]"
        style={{ background: 'color-mix(in oklch, var(--color-league-diamond) 32%, white)', opacity: 0.5, animation: 'kvDrift2 28s ease-in-out infinite' }} />
      <span className="kv-blob absolute top-[38%] -left-[6%] h-[34vw] w-[34vw] rounded-full blur-[100px]"
        style={{ background: 'color-mix(in oklch, var(--color-league-master) 28%, white)', opacity: 0.45, animation: 'kvDrift3 30s ease-in-out infinite' }} />
      <span className="kv-blob absolute top-[44%] -right-[6%] h-[32vw] w-[32vw] rounded-full blur-[100px]"
        style={{ background: 'color-mix(in oklch, var(--color-league-legend) 28%, white)', opacity: 0.42, animation: 'kvDrift1 26s ease-in-out infinite reverse' }} />
      <span className="kv-blob absolute -bottom-[8%] left-[26%] h-[34vw] w-[34vw] rounded-full blur-[100px]"
        style={{ background: 'color-mix(in oklch, var(--color-league-platinum) 36%, white)', opacity: 0.5, animation: 'kvDrift2 34s ease-in-out infinite' }} />
      <span className="kv-blob absolute -bottom-[6%] right-[24%] h-[30vw] w-[30vw] rounded-full blur-[90px]"
        style={{ background: 'color-mix(in oklch, var(--color-league-bronze) 30%, white)', opacity: 0.45, animation: 'kvDrift3 31s ease-in-out infinite reverse' }} />
    </div>
  )
}

export default MovingGradientBackground
