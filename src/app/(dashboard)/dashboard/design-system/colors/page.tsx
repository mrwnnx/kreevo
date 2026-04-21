function Swatch({
  label,
  value,
  bg,
  fg = 'text-foreground',
  border = false,
}: {
  label: string
  value: string
  bg: string
  fg?: string
  border?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`h-14 rounded-xl ${bg} ${border ? 'border border-border' : ''}`}
      />
      <p className="text-xs font-semibold leading-tight">{label}</p>
      <p className="text-[10px] font-mono text-muted-foreground">{value}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function ColorsPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto space-y-12 pb-20">

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Design System — Colors</h1>
        <p className="text-sm text-muted-foreground mt-1">Toutes les couleurs sémantiques du thème</p>
      </div>

      {/* ── Base ── */}
      <Section title="Base">
        <div className="grid grid-cols-2 gap-3">
          <Swatch label="background" value="oklch(0.98 0.002 265)" bg="bg-background" border />
          <Swatch label="foreground" value="oklch(0.12 0.008 265)" bg="bg-foreground" />
        </div>
      </Section>

      {/* ── Surface ── */}
      <Section title="Surface">
        <div className="grid grid-cols-2 gap-3">
          <Swatch label="card" value="oklch(1 0 0)" bg="bg-card" border />
          <Swatch label="card-foreground" value="oklch(0.12 0.008 265)" bg="bg-card-foreground" />
          <Swatch label="popover" value="oklch(1 0 0)" bg="bg-popover" border />
          <Swatch label="popover-foreground" value="oklch(0.12 0.008 265)" bg="bg-popover-foreground" />
        </div>
      </Section>

      {/* ── Brand ── */}
      <Section title="Brand — Primary">
        <div className="grid grid-cols-2 gap-3">
          <Swatch label="primary" value="oklch(0.52 0.22 275) — violet" bg="bg-primary" />
          <Swatch label="primary-foreground" value="oklch(0.98 0 0)" bg="bg-primary-foreground" border />
          <Swatch label="primary / 10%" value="bg-primary/10" bg="bg-primary/10" border />
          <Swatch label="primary / 20%" value="bg-primary/20" bg="bg-primary/20" border />
        </div>
      </Section>

      {/* ── Secondary ── */}
      <Section title="Secondary & Muted">
        <div className="grid grid-cols-2 gap-3">
          <Swatch label="secondary" value="oklch(0.94 0.004 265)" bg="bg-secondary" border />
          <Swatch label="secondary-foreground" value="oklch(0.30 0.008 265)" bg="bg-secondary-foreground" />
          <Swatch label="muted" value="oklch(0.94 0.004 265)" bg="bg-muted" border />
          <Swatch label="muted-foreground" value="oklch(0.50 0.010 265)" bg="bg-muted-foreground" />
        </div>
      </Section>

      {/* ── Accent ── */}
      <Section title="Accent">
        <div className="grid grid-cols-2 gap-3">
          <Swatch label="accent" value="oklch(0.94 0.004 265)" bg="bg-accent" border />
          <Swatch label="accent-foreground" value="oklch(0.30 0.008 265)" bg="bg-accent-foreground" />
        </div>
      </Section>

      {/* ── Feedback ── */}
      <Section title="Feedback">
        <div className="grid grid-cols-2 gap-3">
          <Swatch label="destructive" value="oklch(0.55 0.22 25) — rouge" bg="bg-destructive" />
          <Swatch label="destructive / 10%" value="bg-destructive/10" bg="bg-destructive/10" border />
          <Swatch label="green-400" value="Tailwind green-400" bg="bg-green-400" />
          <Swatch label="green-50/60" value="bg-green-50/60" bg="bg-green-50/60" border />
        </div>
      </Section>

      {/* ── UI Chrome ── */}
      <Section title="UI Chrome">
        <div className="grid grid-cols-2 gap-3">
          <Swatch label="border" value="oklch(0.88 0.004 265)" bg="bg-border" />
          <Swatch label="input" value="oklch(0.88 0.004 265)" bg="bg-input" border />
          <Swatch label="ring" value="oklch(0.52 0.22 275)" bg="bg-ring" />
        </div>
      </Section>

      {/* ── Leagues ── */}
      <Section title="Leagues">
        <div className="grid grid-cols-5 gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="h-14 rounded-xl league-bg-rookie border border-border" />
            <p className="text-xs font-semibold">rookie</p>
            <p className="text-[10px] font-mono text-muted-foreground">oklch(0.45 0.02 60)</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-14 rounded-xl league-bg-rising border border-border" />
            <p className="text-xs font-semibold">rising</p>
            <p className="text-[10px] font-mono text-muted-foreground">oklch(0.45 0.01 265)</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-14 rounded-xl league-bg-pro border border-border" />
            <p className="text-xs font-semibold">pro</p>
            <p className="text-[10px] font-mono text-muted-foreground">oklch(0.55 0.16 85)</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-14 rounded-xl league-bg-elite border border-border" />
            <p className="text-xs font-semibold">elite</p>
            <p className="text-[10px] font-mono text-muted-foreground">oklch(0.45 0.18 240)</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-14 rounded-xl league-bg-legend border border-border" />
            <p className="text-xs font-semibold">legend</p>
            <p className="text-[10px] font-mono text-muted-foreground">oklch(0.50 0.22 15)</p>
          </div>
        </div>

        {/* League solid colors */}
        <div className="grid grid-cols-5 gap-3 mt-2">
          {[
            { name: 'rookie', cls: 'from-stone-400 to-stone-500' },
            { name: 'rising', cls: 'from-slate-400 to-slate-500' },
            { name: 'pro',    cls: 'from-yellow-400 to-yellow-500' },
            { name: 'elite',  cls: 'from-blue-400 to-blue-500' },
            { name: 'legend', cls: 'from-pink-500 to-red-500' },
          ].map(l => (
            <div key={l.name} className="flex flex-col gap-1.5">
              <div className={`h-14 rounded-xl bg-gradient-to-br ${l.cls}`} />
              <p className="text-xs font-semibold">{l.name} gradient</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── XP gradient ── */}
      <Section title="XP Gradient">
        <div className="h-14 rounded-xl xp-gradient" />
        <p className="text-xs font-mono text-muted-foreground">
          from oklch(0.52 0.22 275) → oklch(0.62 0.18 310)
        </p>
      </Section>

      {/* ── Text shades ── */}
      <Section title="Text hierarchy">
        <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
          <p className="text-base font-bold text-foreground">foreground — titre principal</p>
          <p className="text-sm font-medium text-foreground">foreground — body text</p>
          <p className="text-sm text-muted-foreground">muted-foreground — label secondaire</p>
          <p className="text-xs text-muted-foreground">muted-foreground xs — caption</p>
          <p className="text-sm text-primary font-semibold">primary — lien ou accent</p>
          <p className="text-sm text-destructive">destructive — erreur</p>
        </div>
      </Section>

      {/* ── Effects ── */}
      <Section title="Effects">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-14 rounded-xl bg-primary glow-primary flex items-center justify-center">
            <span className="text-xs font-mono text-primary-foreground">.glow-primary</span>
          </div>
          <div className="h-14 rounded-xl bg-card border border-border card-sharp flex items-center justify-center">
            <span className="text-xs font-mono text-muted-foreground">.card-sharp</span>
          </div>
        </div>
      </Section>

    </div>
  )
}
