'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, ChevronLeft, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Constants ─────────────────────────────────────────────────────────────────

const SPECIALTIES = [
  { value: 'UX Designer',      icon: '🎨', label: 'UX Designer',      desc: 'Flows, wireframes, research, prototypes' },
  { value: 'UI Designer',      icon: '📱', label: 'UI Designer',       desc: 'Écrans haute fidélité, kits, design systems' },
  { value: 'Graphic Designer', icon: '✏️', label: 'Graphic Designer',  desc: 'Logos, affiches, brand identity, motion' },
] as const

const TYPES: Record<string, string[]> = {
  'UX Designer':      ['User Flow', 'UX Research', 'Wireframes', 'UX Case Study', 'Prototype', 'IA / Navigation'],
  'UI Designer':      ['UI Screen', 'UI Kit', 'Design System', 'Redesign', 'Dark Mode', 'Dashboard'],
  'Graphic Designer': ['Logo', 'Brand Identity', 'Affiche', 'Social Media Kit', 'Packaging', 'Motion'],
}

const INDUSTRIES = [
  'Fintech', 'E-commerce', 'SaaS', 'Retail', 'Immobilier',
  'Santé', 'Fitness', 'Nutrition', 'Bien-être', 'Éducation',
  'Musique', 'Gaming', 'Streaming', 'Sport', 'Mode',
  'Food & Beverage', 'Voyage', 'Luxe', 'Beauté',
  'IA', 'Cybersécurité', 'Crypto', 'Mobilité', 'ONG', 'Environnement',
]

const DELIVERABLES: Record<string, string> = {
  'User Flow':        'Flow complet annoté (min 5 étapes). Lien Figma.',
  'UX Research':      'Document : problématique + insights + solutions.',
  'Wireframes':       'Écrans basse fidélité annotés. Lien Figma.',
  'UX Case Study':    'Présentation : contexte + recherche + solution.',
  'Prototype':        'Prototype interactif Figma avec flow complet.',
  'UI Screen':        'Écrans haute fidélité (375x812px). Lien Figma.',
  'UI Kit':           'Bibliothèque de composants documentée. Lien Figma.',
  'Design System':    'Tokens + composants + documentation. Lien Figma.',
  'Redesign':         'Avant/Après + justifications. Lien Figma.',
  'Logo':             'Logo couleur + NB + vectoriel. Lien Figma ou SVG.',
  'Brand Identity':   'Logo + palette + typo + exemples. Lien Figma.',
  'Affiche':          'Affiche A3 PNG ou PDF haute résolution.',
  'Social Media Kit': '6 templates exportés PNG + lien Figma.',
  'Packaging':        'Mockup packaging produit. Lien Figma ou PNG.',
  'Motion':           'GIF animé ou lien vidéo (YouTube/Vimeo).',
}

const SPECIALTY_TRACK: Record<string, string> = {
  'UX Designer':      'ux_ui',
  'UI Designer':      'ux_ui',
  'Graphic Designer': 'graphic',
}

const SPECIALTY_STYLE: Record<string, { border: string; bg: string; text: string }> = {
  'UX Designer':      { border: 'border-violet-300 dark:border-violet-700', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300' },
  'UI Designer':      { border: 'border-blue-300 dark:border-blue-700',     bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-700 dark:text-blue-300'     },
  'Graphic Designer': { border: 'border-orange-300 dark:border-orange-700', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300' },
}

const STEP_LABELS = ['Spécialité', 'Type', 'Industrie', 'Détails']

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  specialty: string
  challenge_type: string
  industry: string
  title: string
  brief: string
  context: string
  deliverable: string
  constraints: string
  criteria: string
  track: string
  month: string
  year: string
  reveal_at: string
  closes_at: string
  status: string
  league_id: string
  xp_reward: string
  deadline_days: string
  is_published: boolean
}

const EMPTY: FormData = {
  specialty: '',
  challenge_type: '',
  industry: '',
  title: '', brief: '', context: '', deliverable: '',
  constraints: '', criteria: '',
  track: 'ux_ui',
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
  reveal_at: '', closes_at: '',
  status: 'draft',
  league_id: '',
  xp_reward: '250',
  deadline_days: '7',
  is_published: false,
}

interface League { id: string; name: string; icon: string; order_index: number }

const inputClass = 'w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring'
const labelClass = 'text-xs font-mono text-muted-foreground uppercase tracking-widest'

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ step, onBack }: { step: number; onBack?: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={cn(
              'size-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all',
              i === step  ? 'bg-primary text-primary-foreground' :
              i < step   ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground/50'
            )}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={cn(
              'text-xs hidden sm:block',
              i === step ? 'font-semibold text-foreground' : 'text-muted-foreground'
            )}>
              {label}
            </span>
            {i < 3 && <div className="w-5 h-px bg-border mx-0.5" />}
          </div>
        ))}
      </div>
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="size-3.5" /> Précédent
        </button>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ChallengeForm({ initial, id }: { initial?: Partial<FormData>; id?: string }) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({ ...EMPTY, ...initial })
  const [leagues, setLeagues] = useState<League[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(() => {
    if (id) return 3
    if (initial?.specialty && initial?.challenge_type && initial?.industry) return 3
    return 0
  })

  useEffect(() => {
    fetch('/api/admin/leagues')
      .then(r => r.json())
      .then(d => setLeagues(d.leagues ?? []))
  }, [])

  const set = (key: keyof FormData) => (val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }))

  function selectSpecialty(spec: string) {
    setForm(f => ({ ...f, specialty: spec, track: SPECIALTY_TRACK[spec] ?? 'ux_ui', challenge_type: '' }))
    setTimeout(() => setStep(1), 150)
  }

  function selectType(type: string) {
    setForm(f => ({ ...f, challenge_type: type, deliverable: f.deliverable || DELIVERABLES[type] || '' }))
    setTimeout(() => setStep(2), 150)
  }

  function selectIndustry(industry: string) {
    setForm(f => ({ ...f, industry }))
    setTimeout(() => setStep(3), 150)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const dd = parseInt(form.deadline_days)
    if (!form.deadline_days || isNaN(dd)) { setError('Deadline requise'); setSaving(false); return }
    if (dd < 1) { setError('Minimum 1 jour'); setSaving(false); return }
    if (dd > 365) { setError('Maximum 365 jours'); setSaving(false); return }
    const url = id ? `/api/admin/challenges/${id}` : '/api/admin/challenges'
    const method = id ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        month: parseInt(form.month),
        year: parseInt(form.year),
        xp_reward: parseInt(form.xp_reward),
        deadline_days: parseInt(form.deadline_days),
        league_id: form.league_id || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Erreur'); setSaving(false); return }
    router.push('/admin/challenges')
    router.refresh()
  }

  // ── Step 0 — Specialty ─────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="space-y-6">
        <StepIndicator step={0} />
        <p className="text-sm text-muted-foreground">Quelle spécialité cible ce challenge ?</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {SPECIALTIES.map(s => {
            const style = SPECIALTY_STYLE[s.value]
            const selected = form.specialty === s.value
            return (
              <button
                key={s.value}
                onClick={() => selectSpecialty(s.value)}
                className={cn(
                  'flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm',
                  selected ? cn('border-2', style.border, style.bg) : 'border-border bg-card hover:border-border/80'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-3xl">{s.icon}</span>
                  {selected && <Check className={cn('size-4', style.text)} />}
                </div>
                <div>
                  <p className={cn('font-semibold text-sm', selected ? style.text : '')}>{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Step 1 — Type ──────────────────────────────────────────────────────────
  if (step === 1) {
    const types = TYPES[form.specialty] ?? []
    return (
      <div className="space-y-6">
        <StepIndicator step={1} onBack={() => setStep(0)} />
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Type de défi pour <span className="font-semibold text-foreground">{form.specialty}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {types.map(t => (
              <button
                key={t}
                onClick={() => selectType(t)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium border transition-all',
                  form.challenge_type === t
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:border-primary/50 hover:bg-muted/40'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Step 2 — Industry ──────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="space-y-6">
        <StepIndicator step={2} onBack={() => setStep(1)} />
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Dans quelle industrie se situe le challenge ?</p>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map(ind => (
              <button
                key={ind}
                onClick={() => selectIndustry(ind)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border transition-all',
                  form.industry === ind
                    ? 'bg-primary text-primary-foreground border-primary font-medium'
                    : 'bg-card border-border hover:border-primary/50 hover:bg-muted/40'
                )}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Step 3 — Details ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {!id && <StepIndicator step={3} onBack={() => setStep(2)} />}

      {/* Context chips */}
      {(form.specialty || form.challenge_type || form.industry) && (
        <div className="flex items-center gap-2 flex-wrap">
          {form.specialty && (() => {
            const style = SPECIALTY_STYLE[form.specialty]
            return (
              <button
                onClick={() => { if (!id) setStep(0) }}
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border',
                  style?.border ?? 'border-border',
                  style?.bg ?? 'bg-muted',
                  style?.text ?? 'text-foreground',
                  !id && 'hover:opacity-80 cursor-pointer'
                )}
              >
                {SPECIALTIES.find(s => s.value === form.specialty)?.icon} {form.specialty}
              </button>
            )
          })()}
          {form.challenge_type && (
            <button
              onClick={() => { if (!id) setStep(1) }}
              className={cn('inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-muted/60', !id && 'hover:opacity-80 cursor-pointer')}
            >
              {form.challenge_type}
            </button>
          )}
          {form.industry && (
            <button
              onClick={() => { if (!id) setStep(2) }}
              className={cn('inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-muted/60', !id && 'hover:opacity-80 cursor-pointer')}
            >
              {form.industry}
            </button>
          )}
        </div>
      )}

      {/* Fields */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="md:col-span-2 space-y-1.5">
          <label className={labelClass}>Titre</label>
          <input value={form.title} onChange={e => set('title')(e.target.value)} className={inputClass} placeholder="Titre du challenge" />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Ligue</label>
          <select value={form.league_id} onChange={e => set('league_id')(e.target.value)} className={inputClass}>
            <option value="">— Aucune ligue —</option>
            {leagues.map(l => <option key={l.id} value={l.id}>{l.icon} {l.name}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>XP reward</label>
          <input type="number" value={form.xp_reward} onChange={e => set('xp_reward')(e.target.value)} className={inputClass} min={0} />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Deadline (en jours)</label>
          <input type="number" value={form.deadline_days} onChange={e => set('deadline_days')(e.target.value)} className={inputClass} min={1} max={365} placeholder="Ex: 7" />
          <p className="text-xs text-muted-foreground">Durée personnelle à partir de la participation</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => set('is_published')(!form.is_published)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${form.is_published ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow transition-transform ${form.is_published ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span className="text-sm font-medium">{form.is_published ? 'Publié' : 'Draft (non publié)'}</span>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label className={labelClass}>Brief principal</label>
          <textarea value={form.brief} onChange={e => set('brief')(e.target.value)} rows={3} className={cn(inputClass, 'resize-none')} />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Contexte</label>
          <textarea value={form.context} onChange={e => set('context')(e.target.value)} rows={3} className={cn(inputClass, 'resize-none')} />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Livrable</label>
          <textarea value={form.deliverable} onChange={e => set('deliverable')(e.target.value)} rows={3} className={cn(inputClass, 'resize-none')} />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Contraintes</label>
          <textarea value={form.constraints} onChange={e => set('constraints')(e.target.value)} rows={3} className={cn(inputClass, 'resize-none')} />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Critères d'évaluation</label>
          <textarea value={form.criteria} onChange={e => set('criteria')(e.target.value)} rows={3} className={cn(inputClass, 'resize-none')} />
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive font-mono bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full hover:opacity-85 disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {id ? 'Enregistrer' : 'Créer le challenge'}
        </button>
        <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Annuler
        </button>
      </div>
    </div>
  )
}
