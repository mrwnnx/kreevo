'use client'

import { useState, useEffect, useCallback } from 'react'
import { RotateCcw, Save, Check, Loader2, Sun, Moon, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DEFAULT_TOKENS, FONT_OPTIONS, buildDesignCSS } from '@/lib/design-tokens'
import type { DesignTokens, ModeTokens, RadiiTokens } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'

// ─── Token group config ───────────────────────────────────────
const TOKEN_GROUPS: { label: string; keys: (keyof ModeTokens)[] }[] = [
  {
    label: 'Brand',
    keys: ['--primary', '--primary-foreground', '--accent', '--accent-foreground'],
  },
  {
    label: 'Surfaces',
    keys: ['--background', '--foreground', '--card', '--card-foreground', '--popover', '--popover-foreground'],
  },
  {
    label: 'Muted & Secondary',
    keys: ['--muted', '--muted-foreground', '--secondary', '--secondary-foreground'],
  },
  {
    label: 'UI Chrome',
    keys: ['--border', '--input', '--ring', '--destructive'],
  },
  {
    label: 'Leagues',
    keys: ['--league-stone', '--league-bronze', '--league-silver', '--league-gold', '--league-platinum', '--league-diamond', '--league-master', '--league-legend'],
  },
  {
    label: 'XP Gradient',
    keys: ['--xp-from', '--xp-to'],
  },
]

const KEY_LABEL: Record<string, string> = {
  '--background':           'Background',
  '--foreground':           'Foreground',
  '--card':                 'Card',
  '--card-foreground':      'Card foreground',
  '--popover':              'Popover',
  '--popover-foreground':   'Popover foreground',
  '--primary':              'Primary',
  '--primary-foreground':   'Primary foreground',
  '--secondary':            'Secondary',
  '--secondary-foreground': 'Secondary foreground',
  '--muted':                'Muted',
  '--muted-foreground':     'Muted foreground',
  '--accent':               'Accent',
  '--accent-foreground':    'Accent foreground',
  '--destructive':          'Destructive',
  '--border':               'Border',
  '--input':                'Input',
  '--ring':                 'Ring / Focus',
  '--league-stone':         'Stone',
  '--league-bronze':        'Bronze',
  '--league-silver':        'Silver',
  '--league-gold':          'Gold',
  '--league-platinum':      'Platinum',
  '--league-diamond':       'Diamond',
  '--league-master':        'Master',
  '--league-legend':        'Legend',
  '--xp-from':              'XP gradient from',
  '--xp-to':                'XP gradient to',
}

// ─── Inject preview CSS into document ─────────────────────────
function injectPreviewCSS(tokens: DesignTokens) {
  const id = 'design-preview-style'
  let el = document.getElementById(id) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = buildDesignCSS(tokens)
}

// ─── Color row ────────────────────────────────────────────────
function ColorRow({
  varKey, value, defaultValue, onChange, onReset,
}: {
  varKey: string
  value: string
  defaultValue: string
  onChange: (v: string) => void
  onReset: () => void
}) {
  const isModified = value !== defaultValue
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
      {/* Color swatch + picker */}
      <label className="relative cursor-pointer shrink-0">
        <div
          className="size-8 rounded-lg border border-border/60 shadow-sm cursor-pointer transition-transform hover:scale-105"
          style={{ backgroundColor: value }}
        />
        <input
          type="color"
          value={value.startsWith('#') ? value : '#888888'}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
      </label>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-none">{KEY_LABEL[varKey] ?? varKey}</p>
        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{varKey}</p>
      </div>

      {/* Hex input */}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-24 h-7 rounded-lg border border-input bg-transparent px-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
      />

      {/* Reset */}
      {isModified && (
        <button
          onClick={onReset}
          title="Réinitialiser"
          className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
        >
          <RotateCcw className="size-3.5" />
        </button>
      )}
      {!isModified && <div className="size-7 shrink-0" />}
    </div>
  )
}

// ─── Live preview panel ────────────────────────────────────────
function PreviewPanel({ tokens }: { tokens: DesignTokens }) {
  const previewStyle = {
    '--background':  tokens.light['--background'],
    '--foreground':  tokens.light['--foreground'],
    '--card':        tokens.light['--card'],
    '--primary':     tokens.light['--primary'],
    '--primary-foreground': tokens.light['--primary-foreground'],
    '--muted':       tokens.light['--muted'],
    '--muted-foreground': tokens.light['--muted-foreground'],
    '--border':      tokens.light['--border'],
    '--destructive': tokens.light['--destructive'],
    '--radius-button':  tokens.radii.button,
    '--radius-card':    tokens.radii.card,
    '--radius-input':   tokens.radii.input,
    '--radius-badge':   tokens.radii.badge,
    '--radius-popover': tokens.radii.popover,
    '--font-sans':      `"${tokens.font}", system-ui, sans-serif`,
  } as React.CSSProperties

  return (
    <div
      className="rounded-xl border border-border overflow-hidden"
      style={previewStyle}
    >
      {/* Header bar */}
      <div
        className="px-4 py-2.5 border-b flex items-center gap-3"
        style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
      >
        <div
          className="text-sm font-bold tracking-tight"
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-sans)' }}
        >
          kreevo
        </div>
        <div className="flex-1" />
        <div
          className="px-3 py-1 text-xs font-medium"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Participer
        </div>
      </div>

      {/* Card */}
      <div className="p-4" style={{ background: 'var(--background)' }}>
        <div
          className="p-4 space-y-3"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
              Fintech Mobile App
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Redesign d&apos;une app de paiement
            </p>
          </div>
          <div className="flex gap-2">
            <span
              className="text-[11px] font-medium px-2.5 py-0.5"
              style={{
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderRadius: '9999px',
              }}
            >
              Pro
            </span>
            <span
              className="text-[11px] font-medium px-2.5 py-0.5"
              style={{
                background: 'var(--muted)',
                color: 'var(--muted-foreground)',
                borderRadius: '9999px',
                border: '1px solid var(--border)',
              }}
            >
              7j restants
            </span>
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between items-center">
            <p className="text-[11px]" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}>
              XP Progress
            </p>
            <p className="text-[11px] font-mono" style={{ color: 'var(--primary)' }}>72%</p>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: '72%',
                background: `linear-gradient(90deg, ${tokens.light['--xp-from']}, ${tokens.light['--xp-to']})`,
              }}
            />
          </div>
        </div>

        {/* Buttons row */}
        <div className="flex gap-2 mt-3">
          <button
            className="flex-1 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              borderRadius: '9999px',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Soumettre
          </button>
          <button
            className="flex-1 py-1.5 text-xs font-medium"
            style={{
              background: 'transparent',
              color: 'var(--foreground)',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Annuler
          </button>
        </div>

        {/* League badges */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {([
            ['Stone',    '--league-stone'],
            ['Bronze',   '--league-bronze'],
            ['Silver',   '--league-silver'],
            ['Gold',     '--league-gold'],
            ['Platinum', '--league-platinum'],
            ['Diamond',  '--league-diamond'],
            ['Master',   '--league-master'],
            ['Legend',   '--league-legend'],
          ] as [string, keyof ModeTokens][]).map(([label, key]) => (
            <span
              key={label}
              className="text-[10px] font-medium px-2 py-0.5"
              style={{
                color: tokens.light[key],
                background: tokens.light[key] + '22',
                borderRadius: '9999px',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Destructive */}
        <div
          className="mt-3 px-3 py-2 text-xs rounded-lg"
          style={{
            background: tokens.light['--destructive'] + '18',
            color: tokens.light['--destructive'],
            fontFamily: 'var(--font-sans)',
          }}
        >
          Compte suspendu — contacter le support
        </div>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────
export default function AdminDesignPage() {
  const [tokens, setTokens] = useState<DesignTokens>(DEFAULT_TOKENS)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  // Load saved tokens
  useEffect(() => {
    fetch('/api/admin/design')
      .then(r => r.json())
      .then(d => { setTokens(d.tokens); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Live preview
  useEffect(() => {
    injectPreviewCSS(tokens)
  }, [tokens])

  const updateMode = useCallback((key: keyof ModeTokens, value: string, m: 'light' | 'dark') => {
    setTokens(prev => ({ ...prev, [m]: { ...prev[m], [key]: value } }))
    setSaved(false)
  }, [])

  const resetToken = useCallback((key: keyof ModeTokens, m: 'light' | 'dark') => {
    setTokens(prev => ({ ...prev, [m]: { ...prev[m], [key]: DEFAULT_TOKENS[m][key] } }))
    setSaved(false)
  }, [])

  const resetAll = useCallback(() => {
    setTokens(DEFAULT_TOKENS)
    setSaved(false)
  }, [])

  async function save() {
    setSaving(true)
    const res = await fetch('/api/admin/design', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-full">

      {/* ── Left: Editor ── */}
      <div className="flex-1 min-w-0 overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-lg font-bold">Design System</h1>
            <p className="text-xs text-muted-foreground">Modifie les tokens visuels de la plateforme</p>
          </div>
          <Button variant="ghost" size="sm" onClick={resetAll}>
            <RotateCcw />
            Reset tout
          </Button>
          <Button size="sm" onClick={save} disabled={saving || saved}>
            {saving ? <Loader2 className="animate-spin" /> : saved ? <Check /> : <Save />}
            {saving ? 'Sauvegarde…' : saved ? 'Sauvegardé !' : 'Publier'}
          </Button>
        </div>

        <div className="p-6 space-y-8 max-w-2xl">

          {/* ── Typography ── */}
          <div className="space-y-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">
              Typographie
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FONT_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => { setTokens(p => ({ ...p, font: value })); setSaved(false) }}
                  className={cn(
                    'px-4 py-3 rounded-xl border text-sm font-medium text-start transition-all',
                    tokens.font === value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-foreground/30 text-foreground'
                  )}
                  style={{ fontFamily: `"${value}", system-ui, sans-serif` }}
                >
                  <p className="font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-normal">Aa Bb Cc 123</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Border radius ── */}
          <div className="space-y-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">
              Border Radius
            </h2>
            <div className="rounded-xl border border-border bg-card divide-y divide-border/40">
              {(
                [
                  { key: 'button',  label: 'Bouton',   max: 9999, preview: (r: string) => (
                    <div className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-medium" style={{ borderRadius: r }}>Soumettre</div>
                  )},
                  { key: 'card',    label: 'Card',     max: 2,    preview: (r: string) => (
                    <div className="px-4 py-2 bg-card border border-border text-xs" style={{ borderRadius: r }}>Card</div>
                  )},
                  { key: 'input',   label: 'Input',    max: 2,    preview: (r: string) => (
                    <div className="px-3 py-1.5 border border-input bg-background text-xs text-muted-foreground" style={{ borderRadius: r }}>Placeholder…</div>
                  )},
                  { key: 'badge',   label: 'Badge',    max: 9999, preview: (r: string) => (
                    <div className="px-2.5 py-0.5 bg-primary text-primary-foreground text-[11px] font-medium" style={{ borderRadius: r }}>Pro</div>
                  )},
                  { key: 'popover', label: 'Popover',  max: 2,    preview: (r: string) => (
                    <div className="px-3 py-2 bg-popover border border-border shadow-sm text-xs" style={{ borderRadius: r }}>Menu</div>
                  )},
                ] as { key: keyof RadiiTokens; label: string; max: number; preview: (r: string) => React.ReactNode }[]
              ).map(({ key, label, max, preview }) => {
                const raw = tokens.radii[key]
                const isPill = raw === '9999px'
                const numVal = isPill ? max : parseFloat(raw) || 0
                return (
                  <div key={key} className="flex items-center gap-4 px-4 py-3">
                    <p className="text-sm font-medium w-20 shrink-0">{label}</p>
                    <input
                      type="range"
                      min="0"
                      max={max === 9999 ? 2 : max}
                      step="0.05"
                      value={isPill ? 2 : numVal}
                      onChange={e => {
                        const v = parseFloat(e.target.value)
                        const val = max === 9999 && v >= 1.9 ? '9999px' : `${v}rem`
                        setTokens(p => ({ ...p, radii: { ...p.radii, [key]: val } }))
                        setSaved(false)
                      }}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-xs font-mono w-16 text-end text-muted-foreground">{raw}</span>
                    <div className="shrink-0">{preview(raw)}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Colors (Light / Dark) ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">
                Couleurs
              </h2>
              <div className="flex gap-1 bg-muted rounded-full p-1">
                <button
                  onClick={() => setMode('light')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all',
                    mode === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Sun className="size-3" /> Light
                </button>
                <button
                  onClick={() => setMode('dark')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all',
                    mode === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Moon className="size-3" /> Dark
                </button>
              </div>
            </div>

            {TOKEN_GROUPS.map(({ label, keys }) => (
              <div key={label} className="rounded-xl border border-border bg-card">
                <div className="px-4 py-2.5 border-b border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                </div>
                <div className="px-4 divide-y divide-border/30">
                  {keys.map(key => (
                    <ColorRow
                      key={key}
                      varKey={key}
                      value={tokens[mode][key]}
                      defaultValue={DEFAULT_TOKENS[mode][key]}
                      onChange={v => updateMode(key, v, mode)}
                      onReset={() => resetToken(key, mode)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Right: Preview ── */}
      <div className="hidden xl:flex flex-col w-80 shrink-0 border-s border-border bg-white dark:bg-zinc-900/20 overflow-y-auto">
        <div className="sticky top-0 bg-white/80 dark:bg-zinc-900/20 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-2">
          <Eye className="size-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Aperçu live</p>
        </div>
        <div className="p-4">
          <PreviewPanel tokens={tokens} />
          <p className="text-[10px] font-mono text-muted-foreground mt-3 text-center">
            Les changements s&apos;appliquent en live sur la plateforme après &quot;Publier&quot;
          </p>
        </div>
      </div>

    </div>
  )
}
