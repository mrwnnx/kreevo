import { Button } from '@/components/ui/button'
import { Pencil, ExternalLink, Zap, Play, Trash2, ArrowRight, Plus, Save, Settings } from 'lucide-react'

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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs text-muted-foreground font-mono w-24 shrink-0">{label}</span>
      {children}
    </div>
  )
}

export default function DesignSystemPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto space-y-12 pb-20">

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Design System — Buttons</h1>
        <p className="text-sm text-muted-foreground mt-1">Tous les variants, tailles et états</p>
      </div>

      {/* ── Variants ── */}
      <Section title="Variants">
        <Row label="default">
          <Button>Default</Button>
          <Button><Zap />With icon</Button>
        </Row>
        <Row label="outline">
          <Button variant="outline">Outline</Button>
          <Button variant="outline"><ExternalLink />With icon</Button>
        </Row>
        <Row label="secondary">
          <Button variant="secondary">Secondary</Button>
          <Button variant="secondary"><Settings />With icon</Button>
        </Row>
        <Row label="ghost">
          <Button variant="ghost">Ghost</Button>
          <Button variant="ghost"><ArrowRight />With icon</Button>
        </Row>
        <Row label="destructive">
          <Button variant="destructive">Destructive</Button>
          <Button variant="destructive"><Trash2 />With icon</Button>
        </Row>
        <Row label="link">
          <Button variant="link">Link button</Button>
        </Row>
      </Section>

      {/* ── Sizes ── */}
      <Section title="Sizes">
        <Row label="xs">
          <Button size="xs">Extra small</Button>
          <Button size="xs" variant="outline">Outline xs</Button>
        </Row>
        <Row label="sm">
          <Button size="sm">Small</Button>
          <Button size="sm" variant="outline">Outline sm</Button>
        </Row>
        <Row label="default">
          <Button>Default</Button>
          <Button variant="outline">Outline</Button>
        </Row>
        <Row label="lg">
          <Button size="lg">Large</Button>
          <Button size="lg" variant="outline">Outline lg</Button>
        </Row>
      </Section>

      {/* ── Icon buttons ── */}
      <Section title="Icon buttons">
        <Row label="icon-xs">
          <Button size="icon-xs"><Plus /></Button>
          <Button size="icon-xs" variant="outline"><Plus /></Button>
          <Button size="icon-xs" variant="ghost"><Plus /></Button>
        </Row>
        <Row label="icon-sm">
          <Button size="icon-sm"><Pencil /></Button>
          <Button size="icon-sm" variant="outline"><Pencil /></Button>
          <Button size="icon-sm" variant="ghost"><Pencil /></Button>
        </Row>
        <Row label="icon">
          <Button size="icon"><Save /></Button>
          <Button size="icon" variant="outline"><Save /></Button>
          <Button size="icon" variant="ghost"><Save /></Button>
          <Button size="icon" variant="destructive"><Trash2 /></Button>
        </Row>
        <Row label="icon-lg">
          <Button size="icon-lg"><Play /></Button>
          <Button size="icon-lg" variant="outline"><Play /></Button>
        </Row>
      </Section>

      {/* ── States ── */}
      <Section title="States">
        <Row label="normal">
          <Button>Normal</Button>
          <Button variant="outline">Normal</Button>
        </Row>
        <Row label="disabled">
          <Button disabled>Disabled</Button>
          <Button disabled variant="outline">Disabled</Button>
          <Button disabled variant="destructive">Disabled</Button>
        </Row>
        <Row label="loading">
          <Button disabled>
            <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading…
          </Button>
          <Button disabled variant="outline">
            <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading…
          </Button>
        </Row>
        <Row label="w-full">
          <div className="w-full max-w-xs space-y-2">
            <Button className="w-full">Full width default</Button>
            <Button className="w-full" variant="outline">Full width outline</Button>
          </div>
        </Row>
      </Section>

      {/* ── Real usage examples ── */}
      <Section title="Exemples réels">
        <div className="flex items-center gap-2 flex-wrap p-4 rounded-2xl border border-border bg-card">
          <Button>
            <Pencil />
            Modifier mon profil
          </Button>
          <Button variant="outline">
            <ExternalLink />
            Profil public
          </Button>
          <Button variant="destructive">
            <Trash2 />
            Supprimer
          </Button>
          <Button variant="ghost" size="icon">
            <Settings />
          </Button>
        </div>
      </Section>

    </div>
  )
}
