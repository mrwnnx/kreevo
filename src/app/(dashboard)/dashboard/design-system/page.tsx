'use client'

import {
  Pencil, ExternalLink, Zap, Play, Trash2, ArrowRight, Plus, Save,
  Settings, Star, Bell, Check, ChevronRight, Info, AlertCircle,
  Sun, Moon, Monitor, User, Layers, Type, Palette, SquareCode,
  Minus, SlidersHorizontal, CreditCard, MessageSquare,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card, CardHeader, CardTitle, CardDescription,
  CardContent, CardFooter, CardAction,
} from '@/components/ui/card'
import {
  Avatar, AvatarImage, AvatarFallback,
  AvatarGroup, AvatarGroupCount, AvatarBadge,
} from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from '@/components/ui/tooltip'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

// ─── Nav sections ─────────────────────────────────────────────
const SECTIONS = [
  { id: 'typography',   label: 'Typography',   icon: Type },
  { id: 'colors',       label: 'Colors',       icon: Palette },
  { id: 'buttons',      label: 'Buttons',      icon: SquareCode },
  { id: 'badges',       label: 'Badges',       icon: Star },
  { id: 'cards',        label: 'Cards',        icon: CreditCard },
  { id: 'avatar',       label: 'Avatar',       icon: User },
  { id: 'inputs',       label: 'Inputs',       icon: SlidersHorizontal },
  { id: 'progress',     label: 'Progress',     icon: Layers },
  { id: 'tabs',         label: 'Tabs',         icon: Layers },
  { id: 'separator',    label: 'Separator',    icon: Minus },
  { id: 'tooltip',      label: 'Tooltip',      icon: MessageSquare },
  { id: 'theme',        label: 'ThemeToggle',  icon: Sun },
  { id: 'spacing',      label: 'Spacing',      icon: Layers },
  { id: 'leagues',      label: 'Leagues',      icon: Star },
]

// ─── Helper components ─────────────────────────────────────────

function Section({ id, title, description, children }: {
  id: string; title: string; description?: string; children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-6">
      <div className="border-b border-border pb-3">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function Block({ label, children, mono }: { label: string; children: React.ReactNode; mono?: string }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{label}</p>
      <div className="flex items-center gap-3 flex-wrap">{children}</div>
      {mono && (
        <pre className="text-[11px] font-mono text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 overflow-x-auto">
          {mono}
        </pre>
      )}
    </div>
  )
}

function Preview({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className}`}>
      {children}
    </div>
  )
}

function CodeSnip({ code }: { code: string }) {
  return (
    <pre className="text-[11px] font-mono text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 overflow-x-auto leading-relaxed">
      {code}
    </pre>
  )
}

// ─── Page ──────────────────────────────────────────────────────

export default function DesignSystemPage() {
  return (
    <TooltipProvider>
      <div className="flex min-h-screen">

        {/* ── Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-52 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-border pt-6 pb-10 px-4 overflow-y-auto">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-3 px-2">
            Components
          </p>
          <nav className="space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <Icon className="size-3.5 shrink-0" />
                {label}
              </a>
            ))}
          </nav>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 min-w-0 p-8 max-w-[920px] space-y-16 pb-24">

          {/* Header */}
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-primary bg-primary/10 px-2.5 py-1 rounded-full mb-3">
              <Layers className="size-3" />
              kreevo / design-system
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Design System</h1>
            <p className="text-muted-foreground mt-2 max-w-lg">
              Documentation complète de tous les composants, tokens et patterns utilisés dans Kreevo.
              Basé sur <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">Base UI</span> +{' '}
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">Tailwind v4</span>.
            </p>
          </div>

          {/* ═══════════════ TYPOGRAPHY ═══════════════ */}
          <Section id="typography" title="Typography" description="Plus Jakarta Sans (display) + Space Mono (code)">

            <Block label="Headings">
              <div className="w-full space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">H1 — 36px bold</h1>
                <h2 className="text-3xl font-bold tracking-tight">H2 — 30px bold</h2>
                <h3 className="text-2xl font-bold tracking-tight">H3 — 24px bold</h3>
                <h4 className="text-xl font-bold tracking-tight">H4 — 20px bold</h4>
                <h5 className="text-lg font-semibold">H5 — 18px semibold</h5>
                <h6 className="text-base font-semibold">H6 — 16px semibold</h6>
              </div>
            </Block>

            <Block label="Body text">
              <div className="w-full space-y-2">
                <p className="text-base text-foreground">text-base — Corps principal (16px)</p>
                <p className="text-sm text-foreground">text-sm — Corps secondaire (14px)</p>
                <p className="text-xs text-muted-foreground">text-xs muted — Caption (12px)</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  text-[10px] mono — Label overline
                </p>
              </div>
            </Block>

            <Block label="Font weights">
              <div className="w-full space-y-1.5">
                {[
                  ['font-light',     '300', 'Light'],
                  ['font-normal',    '400', 'Regular'],
                  ['font-medium',    '500', 'Medium'],
                  ['font-semibold',  '600', 'Semibold'],
                  ['font-bold',      '700', 'Bold'],
                  ['font-extrabold', '800', 'Extrabold'],
                ].map(([cls, w, label]) => (
                  <div key={cls} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-muted-foreground w-28">{cls}</span>
                    <span className={`text-sm ${cls}`}>{label} — {w}</span>
                  </div>
                ))}
              </div>
            </Block>

            <Block label="Monospace">
              <div className="w-full space-y-1.5">
                <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">const kreevo = &quot;design&quot;</code>
                <pre className="text-xs font-mono bg-muted rounded-lg p-3 text-foreground">
                  {`// Space Mono\nimport { cn } from '@/lib/utils'`}
                </pre>
              </div>
            </Block>
          </Section>

          {/* ═══════════════ COLORS ═══════════════ */}
          <Section id="colors" title="Colors" description="Tokens sémantiques oklch — adaptatifs light/dark">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'background',   bg: 'bg-background',   border: true },
                { label: 'foreground',   bg: 'bg-foreground' },
                { label: 'primary',      bg: 'bg-primary' },
                { label: 'primary-fg',   bg: 'bg-primary-foreground', border: true },
                { label: 'card',         bg: 'bg-card',         border: true },
                { label: 'muted',        bg: 'bg-muted',        border: true },
                { label: 'muted-fg',     bg: 'bg-muted-foreground' },
                { label: 'border',       bg: 'bg-border' },
                { label: 'secondary',    bg: 'bg-secondary',    border: true },
                { label: 'accent',       bg: 'bg-accent',       border: true },
                { label: 'destructive',  bg: 'bg-destructive' },
                { label: 'ring',         bg: 'bg-ring' },
              ].map(({ label, bg, border }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <div className={`h-12 rounded-xl ${bg} ${border ? 'border border-border' : ''}`} />
                  <p className="text-xs font-mono text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-2">
              <a href="/dashboard/design-system/colors">
                <Button variant="outline" size="sm">
                  <Palette />
                  Voir toutes les couleurs →
                </Button>
              </a>
            </div>
          </Section>

          {/* ═══════════════ BUTTONS ═══════════════ */}
          <Section id="buttons" title="Buttons" description="rounded-full pill style — hover:opacity-85">

            <Block label="Variants" mono={`<Button variant="outline">Label</Button>`}>
              <Button>Default</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </Block>

            <Block label="With icons" mono={`<Button><Icon /> Label</Button>`}>
              <Button><Pencil />Modifier</Button>
              <Button variant="outline"><ExternalLink />Profil public</Button>
              <Button variant="secondary"><Save />Sauvegarder</Button>
              <Button variant="destructive"><Trash2 />Supprimer</Button>
              <Button variant="ghost"><ArrowRight />Continuer</Button>
            </Block>

            <Block label="Sizes" mono={`<Button size="xs|sm|default|lg">…</Button>`}>
              <Button size="xs">xs</Button>
              <Button size="sm">sm</Button>
              <Button>default</Button>
              <Button size="lg">lg</Button>
            </Block>

            <Block label="Icon buttons" mono={`<Button size="icon-xs|icon-sm|icon|icon-lg"><Icon /></Button>`}>
              <Button size="icon-xs"><Plus /></Button>
              <Button size="icon-sm"><Pencil /></Button>
              <Button size="icon"><Settings /></Button>
              <Button size="icon-lg"><Play /></Button>
              <Button size="icon-xs" variant="outline"><Plus /></Button>
              <Button size="icon-sm" variant="outline"><Pencil /></Button>
              <Button size="icon" variant="outline"><Settings /></Button>
              <Button size="icon" variant="ghost"><Bell /></Button>
              <Button size="icon" variant="destructive"><Trash2 /></Button>
            </Block>

            <Block label="States">
              <Button disabled>Disabled</Button>
              <Button disabled variant="outline">Disabled outline</Button>
              <Button disabled>
                <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading…
              </Button>
            </Block>

            <Block label="Full width">
              <div className="w-full max-w-sm space-y-2">
                <Button className="w-full"><Check />Confirmer</Button>
                <Button className="w-full" variant="outline">Annuler</Button>
                <Button className="w-full" variant="destructive"><Trash2 />Supprimer le compte</Button>
              </div>
            </Block>

          </Section>

          {/* ═══════════════ BADGES ═══════════════ */}
          <Section id="badges" title="Badges" description="Labels compacts — 5 variants">

            <Block label="Variants" mono={`<Badge variant="default|secondary|outline|destructive|ghost">…</Badge>`}>
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="ghost">Ghost</Badge>
            </Block>

            <Block label="With icons">
              <Badge><Star className="size-3" />Top Designer</Badge>
              <Badge variant="secondary"><Zap className="size-3" />XP Boost</Badge>
              <Badge variant="outline"><Check className="size-3" />Vérifié</Badge>
              <Badge variant="destructive"><AlertCircle className="size-3" />Suspendu</Badge>
            </Block>

            <Block label="Plan badges (usage réel)">
              <Badge className="bg-foreground text-background text-[10px] font-mono uppercase tracking-wide px-2.5 py-0.5 rounded-full">Pro</Badge>
              <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wide px-2.5 py-0.5 rounded-full">Free</Badge>
            </Block>

            <Block label="League badges (usage réel)">
              {[
                { label: 'Rookie',  cls: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400' },
                { label: 'Rising',  cls: 'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400' },
                { label: 'Pro',     cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
                { label: 'Elite',   cls: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400' },
                { label: 'Legend',  cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
              ].map(({ label, cls }) => (
                <span key={label} className={`text-xs font-medium px-3 py-1 rounded-full ${cls}`}>{label}</span>
              ))}
            </Block>

          </Section>

          {/* ═══════════════ CARDS ═══════════════ */}
          <Section id="cards" title="Cards" description="Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter">

            <Block label="Basic card">
              <Card className="w-full max-w-sm">
                <CardHeader>
                  <CardTitle>Titre de la card</CardTitle>
                  <CardDescription>Description secondaire pour le contexte.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground">Contenu principal de la card. Peut contenir n&apos;importe quel élément.</p>
                </CardContent>
                <CardFooter>
                  <Button size="sm">Action</Button>
                  <Button size="sm" variant="ghost">Annuler</Button>
                </CardFooter>
              </Card>
            </Block>

            <Block label="With CardAction">
              <Card className="w-full max-w-sm">
                <CardHeader>
                  <CardTitle>Card avec action</CardTitle>
                  <CardDescription>L&apos;action se positionne automatiquement à droite du header.</CardDescription>
                  <CardAction>
                    <Button size="icon-sm" variant="ghost"><Settings /></Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Contenu de la card.</p>
                </CardContent>
              </Card>
            </Block>

            <Block label="Size sm">
              <Card size="sm" className="w-full max-w-xs">
                <CardHeader>
                  <CardTitle>Compact card</CardTitle>
                  <CardDescription>Padding réduit (p-3).</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Contenu compact.</p>
                </CardContent>
              </Card>
            </Block>

            <Block label="card-sharp utility">
              <div className="card-sharp rounded-xl p-4 w-full max-w-sm">
                <p className="text-sm font-semibold">card-sharp</p>
                <p className="text-xs text-muted-foreground mt-1">border + bg-card, pas de ring/shadow. Utilisé pour les formulaires auth.</p>
              </div>
            </Block>

            <CodeSnip code={`<Card>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
    <CardDescription>Sous-titre</CardDescription>
    <CardAction><Button size="icon-sm" variant="ghost"><Settings /></Button></CardAction>
  </CardHeader>
  <CardContent>Contenu</CardContent>
  <CardFooter><Button>Action</Button></CardFooter>
</Card>`} />

          </Section>

          {/* ═══════════════ AVATAR ═══════════════ */}
          <Section id="avatar" title="Avatar" description="3 tailles, fallback initiales, badge statut, groupe">

            <Block label="Sizes" mono={`<Avatar size="sm|default|lg">`}>
              <Avatar size="sm">
                <AvatarFallback>MK</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>MK</AvatarFallback>
              </Avatar>
              <Avatar size="lg">
                <AvatarFallback>MK</AvatarFallback>
              </Avatar>
            </Block>

            <Block label="With image + fallback">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage src="/broken-url" />
                <AvatarFallback>MK</AvatarFallback>
              </Avatar>
            </Block>

            <Block label="With AvatarBadge">
              <Avatar size="lg">
                <AvatarFallback>MK</AvatarFallback>
                <AvatarBadge />
              </Avatar>
              <Avatar size="lg">
                <AvatarFallback>AB</AvatarFallback>
                <AvatarBadge><Check /></AvatarBadge>
              </Avatar>
            </Block>

            <Block label="AvatarGroup">
              <AvatarGroup>
                <Avatar><AvatarFallback>MK</AvatarFallback></Avatar>
                <Avatar><AvatarFallback>AB</AvatarFallback></Avatar>
                <Avatar><AvatarFallback>CL</AvatarFallback></Avatar>
                <Avatar><AvatarFallback>PX</AvatarFallback></Avatar>
                <AvatarGroupCount>+8</AvatarGroupCount>
              </AvatarGroup>
            </Block>

            <Block label="League ring (HeroProfile pattern)">
              {[
                ['from-stone-400 to-stone-500',  'Rookie'],
                ['from-yellow-400 to-yellow-500', 'Pro'],
                ['from-blue-400 to-blue-500',     'Elite'],
                ['from-pink-500 to-red-500',      'Legend'],
              ].map(([gradient, label]) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <div className={`size-12 rounded-full p-[2px] bg-gradient-to-br ${gradient}`}>
                    <div className="size-full rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {label[0]}
                    </div>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground">{label}</p>
                </div>
              ))}
            </Block>

          </Section>

          {/* ═══════════════ INPUTS ═══════════════ */}
          <Section id="inputs" title="Inputs" description="h-8 rounded-lg — état focus, disabled, invalid">

            <Block label="Default">
              <Input placeholder="Ton username…" className="max-w-xs" />
            </Block>

            <Block label="Types">
              <div className="w-full max-w-xs space-y-2">
                <Input type="text" placeholder="text" />
                <Input type="email" placeholder="email@example.com" />
                <Input type="password" placeholder="Mot de passe" />
                <Input type="number" placeholder="42" />
                <Input type="url" placeholder="https://…" />
              </div>
            </Block>

            <Block label="States">
              <div className="w-full max-w-xs space-y-2">
                <Input placeholder="Normal" />
                <Input placeholder="Disabled" disabled />
                <Input placeholder="Invalid" aria-invalid />
                <Input defaultValue="Avec valeur préremplie" />
              </div>
            </Block>

            <Block label="Country select (ProfileForm pattern)">
              <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                <option value="">Pays</option>
                <option value="TN">🇹🇳 Tunisie</option>
                <option value="FR">🇫🇷 France</option>
                <option value="MA">🇲🇦 Maroc</option>
              </select>
            </Block>

            <CodeSnip code={`<Input type="email" placeholder="email@example.com" />
<Input disabled placeholder="Lecture seule" />
<Input aria-invalid placeholder="Erreur" />`} />

          </Section>

          {/* ═══════════════ PROGRESS ═══════════════ */}
          <Section id="progress" title="Progress" description="Barre de progression avec label et valeur">

            <Block label="Basic">
              <Progress value={65} className="w-full max-w-sm" />
            </Block>

            <Block label="With label + value" mono={`<Progress value={75}><ProgressLabel>XP</ProgressLabel><ProgressValue /></Progress>`}>
              <Progress value={75} className="w-full max-w-sm">
                <ProgressLabel>XP vers Pro</ProgressLabel>
                <ProgressValue />
              </Progress>
            </Block>

            <Block label="Values">
              <div className="w-full max-w-sm space-y-3">
                {[0, 25, 50, 75, 100].map(v => (
                  <div key={v} className="space-y-1">
                    <p className="text-xs font-mono text-muted-foreground">{v}%</p>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Block>

          </Section>

          {/* ═══════════════ TABS ═══════════════ */}
          <Section id="tabs" title="Tabs" description="2 variants : default (muted bg) et line (underline)">

            <Block label="Default variant">
              <Tabs defaultValue="tab1" className="w-full max-w-sm">
                <TabsList>
                  <TabsTrigger value="tab1">Actifs</TabsTrigger>
                  <TabsTrigger value="tab2">Passés</TabsTrigger>
                  <TabsTrigger value="tab3">Archivés</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1">
                  <Preview><p className="text-sm text-muted-foreground">Contenu onglet Actifs</p></Preview>
                </TabsContent>
                <TabsContent value="tab2">
                  <Preview><p className="text-sm text-muted-foreground">Contenu onglet Passés</p></Preview>
                </TabsContent>
                <TabsContent value="tab3">
                  <Preview><p className="text-sm text-muted-foreground">Contenu onglet Archivés</p></Preview>
                </TabsContent>
              </Tabs>
            </Block>

            <Block label="Line variant">
              <Tabs defaultValue="tab1" className="w-full max-w-sm">
                <TabsList variant="line">
                  <TabsTrigger value="tab1">Profil</TabsTrigger>
                  <TabsTrigger value="tab2">Portfolio</TabsTrigger>
                  <TabsTrigger value="tab3">Stats</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1">
                  <Preview><p className="text-sm text-muted-foreground">Contenu Profil</p></Preview>
                </TabsContent>
                <TabsContent value="tab2">
                  <Preview><p className="text-sm text-muted-foreground">Contenu Portfolio</p></Preview>
                </TabsContent>
                <TabsContent value="tab3">
                  <Preview><p className="text-sm text-muted-foreground">Contenu Stats</p></Preview>
                </TabsContent>
              </Tabs>
            </Block>

            <Block label="Pill tabs (Challenges page pattern)">
              <div className="flex gap-2">
                {['Actifs (3)', 'Passés'].map((label, i) => (
                  <button
                    key={label}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                      i === 0
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border text-muted-foreground hover:border-foreground/40'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Block>

          </Section>

          {/* ═══════════════ SEPARATOR ═══════════════ */}
          <Section id="separator" title="Separator" description="Divider horizontal et vertical">

            <Block label="Horizontal (default)">
              <div className="w-full max-w-sm space-y-3">
                <p className="text-sm text-muted-foreground">Contenu au-dessus</p>
                <Separator />
                <p className="text-sm text-muted-foreground">Contenu en-dessous</p>
              </div>
            </Block>

            <Block label="Vertical">
              <div className="flex items-center gap-4 h-8">
                <span className="text-sm text-muted-foreground">Gauche</span>
                <Separator orientation="vertical" />
                <span className="text-sm text-muted-foreground">Droite</span>
              </div>
            </Block>

            <Block label="With label (auth pattern)">
              <div className="flex items-center gap-3 w-full max-w-xs">
                <Separator className="flex-1" />
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">or</span>
                <Separator className="flex-1" />
              </div>
            </Block>

          </Section>

          {/* ═══════════════ TOOLTIP ═══════════════ */}
          <Section id="tooltip" title="Tooltip" description="Infobulle au hover — bg-foreground text-background">

            <Block label="Basic" mono={`<Tooltip><TooltipTrigger>…</TooltipTrigger><TooltipContent>Texte</TooltipContent></Tooltip>`}>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="outline" size="sm"><Info />Hover me</Button>
                </TooltipTrigger>
                <TooltipContent>Ceci est un tooltip</TooltipContent>
              </Tooltip>
            </Block>

            <Block label="Positions">
              <div className="flex items-center gap-3">
                {(['top', 'bottom', 'left', 'right'] as const).map(side => (
                  <Tooltip key={side}>
                    <TooltipTrigger>
                      <Button size="xs" variant="secondary">{side}</Button>
                    </TooltipTrigger>
                    <TooltipContent side={side}>Tooltip {side}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </Block>

            <Block label="Icon buttons (ThemeToggle pattern)">
              <div className="flex gap-2">
                {[
                  { icon: Sun,     label: 'Mode clair'  },
                  { icon: Moon,    label: 'Mode sombre' },
                  { icon: Monitor, label: 'Système'     },
                ].map(({ icon: Icon, label }) => (
                  <Tooltip key={label}>
                    <TooltipTrigger>
                      <Button size="icon-sm" variant="ghost"><Icon /></Button>
                    </TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </Block>

          </Section>

          {/* ═══════════════ THEME TOGGLE ═══════════════ */}
          <Section id="theme" title="ThemeToggle" description="Sélecteur light / dark / system — persiste dans localStorage">

            <Block label="Composant">
              <ThemeToggle />
            </Block>

            <Block label="Emplacement">
              <p className="text-sm text-muted-foreground">
                Intégré dans le dropdown avatar de <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">FloatingNav</code> et{' '}
                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">Header</code> — section «&nbsp;Apparence&nbsp;».
              </p>
            </Block>

            <CodeSnip code={`// globals.css
@custom-variant dark (&:is(.dark *));

.dark {
  --background: #0A0A0A;
  --primary:    #7C3AED;
  /* ... */
}

// layout.tsx — anti-flash script dans <head>
(function(){
  var t = localStorage.getItem('theme') || 'system';
  var d = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  if (d) document.documentElement.classList.add('dark');
})()`} />

          </Section>

          {/* ═══════════════ SPACING ═══════════════ */}
          <Section id="spacing" title="Spacing" description="Grille 4px — spacing-1=4px … spacing-48=192px">

            <Block label="Scale">
              <div className="w-full space-y-2">
                {[
                  ['1',  '4px'],  ['2',  '8px'],  ['3',  '12px'], ['4',  '16px'],
                  ['5',  '20px'], ['6',  '24px'], ['8',  '32px'], ['10', '40px'],
                  ['12', '48px'], ['16', '64px'], ['20', '80px'], ['24', '96px'],
                ].map(([t, px]) => (
                  <div key={t} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-muted-foreground w-8 shrink-0">{t}</span>
                    <div className="h-4 bg-primary/40 rounded-sm" style={{ width: px }} />
                    <span className="text-[10px] font-mono text-muted-foreground">{px}</span>
                  </div>
                ))}
              </div>
            </Block>

            <Block label="Radius scale">
              <div className="flex items-end gap-4">
                {[
                  ['rounded-sm',  'sm',  '0.3rem'],
                  ['rounded-md',  'md',  '0.4rem'],
                  ['rounded-lg',  'lg',  '0.5rem'],
                  ['rounded-xl',  'xl',  '0.7rem'],
                  ['rounded-2xl', '2xl', '0.9rem'],
                  ['rounded-full','full','∞'],
                ].map(([cls, label, val]) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div className={`size-12 bg-primary/20 border border-primary/30 ${cls}`} />
                    <p className="text-[10px] font-mono text-muted-foreground">{label}</p>
                    <p className="text-[10px] font-mono text-muted-foreground/60">{val}</p>
                  </div>
                ))}
              </div>
            </Block>

          </Section>

          {/* ═══════════════ LEAGUES ═══════════════ */}
          <Section id="leagues" title="League System" description="5 ligues — couleurs sémantiques, gradients, XP gates">

            <Block label="League badges">
              <div className="flex flex-wrap gap-3">
                {[
                  { name: 'Rookie',  bg: 'from-stone-400 to-stone-500',  xp: '0 XP',    color: 'text-stone-600' },
                  { name: 'Rising',  bg: 'from-slate-400 to-slate-500',  xp: '500 XP',  color: 'text-slate-600' },
                  { name: 'Pro',     bg: 'from-yellow-400 to-yellow-500', xp: '1500 XP', color: 'text-yellow-600' },
                  { name: 'Elite',   bg: 'from-blue-400 to-blue-500',    xp: '3500 XP', color: 'text-blue-600' },
                  { name: 'Legend',  bg: 'from-pink-500 to-red-500',     xp: '7000 XP', color: 'text-red-600' },
                ].map(({ name, bg, xp, color }) => (
                  <div key={name} className="flex flex-col items-center gap-2">
                    <div className={`size-14 rounded-full p-[2px] bg-gradient-to-br ${bg}`}>
                      <div className="size-full rounded-full bg-card flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {name[0]}
                      </div>
                    </div>
                    <p className={`text-xs font-bold ${color}`}>{name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{xp}</p>
                  </div>
                ))}
              </div>
            </Block>

            <Block label="League colors (semantic)">
              <div className="grid grid-cols-5 gap-3 w-full">
                {[
                  { name: 'rookie',  cls: 'league-bg-rookie',  text: 'league-rookie'  },
                  { name: 'rising',  cls: 'league-bg-rising',  text: 'league-rising'  },
                  { name: 'pro',     cls: 'league-bg-pro',     text: 'league-pro'     },
                  { name: 'elite',   cls: 'league-bg-elite',   text: 'league-elite'   },
                  { name: 'legend',  cls: 'league-bg-legend',  text: 'league-legend'  },
                ].map(({ name, cls, text }) => (
                  <div key={name} className="flex flex-col gap-1.5">
                    <div className={`h-12 rounded-xl border border-border ${cls} flex items-center justify-center`}>
                      <span className={`text-xs font-bold capitalize ${text}`}>{name[0].toUpperCase()}</span>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground">{name}</p>
                  </div>
                ))}
              </div>
            </Block>

            <Block label="XP gradient">
              <div className="w-full h-8 rounded-full xp-gradient" />
              <p className="text-[10px] font-mono text-muted-foreground">
                oklch(0.52 0.22 275) → oklch(0.62 0.18 310)
              </p>
            </Block>

            <CodeSnip code={`import { leagueLabel, leagueColor, levelFromXp } from '@/lib/utils/xp'

const league  = 'pro'           // rookie|rising|pro|elite|legend
const label   = leagueLabel(league)   // "Pro"
const color   = leagueColor(league)   // "#b45309"
const level   = levelFromXp(1250)     // 2`} />

          </Section>

        </main>
      </div>
    </TooltipProvider>
  )
}
