'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, ChevronLeft, Check, Languages, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { translateChallenge, generateChallenge, type ChallengeFields, type ChallengeLang } from '@/app/(admin)/admin/challenges/actions'

// ── Constants ─────────────────────────────────────────────────────────────────

const SPECIALTIES = [
  { value: 'UX Designer',      icon: '🎨', label: 'UX Designer',      desc: 'Flows, wireframes, research, prototypes' },
  { value: 'UI Designer',      icon: '📱', label: 'UI Designer',       desc: 'Écrans haute fidélité, kits, design systems' },
  { value: 'Graphic Designer', icon: '✏️', label: 'Graphic Designer',  desc: 'Logos, affiches, brand identity, motion' },
] as const

// Types & Industries are now sourced from the CRUD tables (challenge_types /
// industries) via fetch. The old hardcoded TYPES / INDUSTRIES arrays were
// removed in Lot 3. SPECIALTIES stays hardcoded (specialty is frozen), and
// DELIVERABLES (default deliverable text per type) is still an active UX helper.

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

const SPECIALTY_STYLE: Record<string, { border: string; bg: string; text: string }> = {
  'UX Designer':      { border: 'border-violet-300 dark:border-violet-700', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300' },
  'UI Designer':      { border: 'border-blue-300 dark:border-blue-700',     bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-700 dark:text-blue-300'     },
  'Graphic Designer': { border: 'border-orange-300 dark:border-orange-700', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300' },
}

const STEP_LABELS = ['Spécialité', 'Type', 'Industrie', 'Détails']

// ── i18n types ──────────────────────────────────────────────────────────────

type TStatus = 'draft' | 'ai_generated' | 'validated'
const LANGS: ChallengeLang[] = ['fr', 'en', 'ar']
const LANG_LABEL: Record<ChallengeLang, string> = { fr: 'Français', en: 'English', ar: 'العربية' }
const EMPTY_FIELDS: ChallengeFields = { title: '', brief: '', context: '', deliverable: '', constraints: '', criteria: '' }

// ── Types ─────────────────────────────────────────────────────────────────────

interface MetaData {
  specialty: string
  challenge_type: string
  challenge_type_id: string
  industry: string
  industry_id: string
  emoji: string
  league_id: string
  xp_reward: string
  deadline_days: string
  is_published: boolean
}

export interface ChallengeFormInitial extends Partial<MetaData> {
  source_lang?: ChallengeLang
  texts?: Partial<Record<ChallengeLang, Partial<ChallengeFields>>>
  status?: Partial<Record<ChallengeLang, TStatus>>
}

const EMPTY_META: MetaData = {
  specialty: '', challenge_type: '', challenge_type_id: '', industry: '', industry_id: '', emoji: '',
  league_id: '', xp_reward: '250', deadline_days: '7', is_published: false,
}

const EMOJI_SUGGESTIONS = ['🎯', '📱', '🎨', '✏️', '💡', '🖌️', '📐', '🧩', '🚀', '🔥', '✨', '🏆', '🎬', '📦', '🛍️', '💳', '🎵', '🏠']

interface League { id: string; name: string; icon: string; order_index: number }
interface TaxoRow { id: string; name_fr: string | null; name_en: string | null; name_ar: string | null; specialty?: string | null; display_order: number }
interface Option { id: string; name: string }

/** Pick the admin-facing label for a taxonomy row (fr-first). */
const taxoLabel = (r: TaxoRow) => r.name_fr || r.name_en || r.name_ar || ''

const inputClass = 'w-full h-10 rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 py-1 text-base md:text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors'
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

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status, isSource }: { status: TStatus; isSource: boolean }) {
  if (isSource) return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">Source</span>
  const map: Record<TStatus, { cls: string; label: string }> = {
    draft:        { cls: 'bg-muted text-muted-foreground', label: 'Brouillon' },
    ai_generated: { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', label: 'IA — à relire' },
    validated:    { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', label: 'Validé' },
  }
  const s = map[status]
  return <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', s.cls)}>{s.label}</span>
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ChallengeForm({ initial, id }: { initial?: ChallengeFormInitial; id?: string }) {
  const router = useRouter()

  const [meta, setMeta] = useState<MetaData>({ ...EMPTY_META, ...stripI18n(initial) })
  const [sourceLang, setSourceLang] = useState<ChallengeLang>(initial?.source_lang ?? 'fr')
  const [texts, setTexts] = useState<Record<ChallengeLang, ChallengeFields>>(() => buildTexts(initial))
  const [status, setStatus] = useState<Record<ChallengeLang, TStatus>>(() => buildStatus(initial))
  const [activeLang, setActiveLang] = useState<ChallengeLang>(initial?.source_lang ?? 'fr')

  const [leagues, setLeagues] = useState<League[]>([])
  const [fetchedTypes, setFetchedTypes] = useState<TaxoRow[]>([])
  const [fetchedIndustries, setFetchedIndustries] = useState<TaxoRow[]>([])
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genBrief, setGenBrief] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(() => {
    if (id) return 3
    if (initial?.specialty && initial?.challenge_type && initial?.industry) return 3
    // PHASE 6D — création contextuelle : spé pré-remplie (cas graphic) → saute au step
    // Type. « Précédent » reste possible pour revenir au step 0 et changer la spé.
    if (initial?.specialty) return 1
    return 0
  })

  useEffect(() => {
    fetch('/api/admin/leagues').then(r => r.json()).then(d => setLeagues(d.leagues ?? []))
    // Taxonomy is now sourced from the CRUD tables; TS constants are the
    // pre-migration / empty-table fallback (kept until Lot 3).
    fetch('/api/admin/challenge-types').then(r => r.json()).then(d => setFetchedTypes(d.types ?? [])).catch(() => {})
    fetch('/api/admin/industries').then(r => r.json()).then(d => setFetchedIndustries(d.industries ?? [])).catch(() => {})
  }, [])

  // Option lists are sourced from the CRUD tables (challenge_types / industries).
  const typeOptions: Option[] = fetchedTypes
    .filter(t => t.specialty === meta.specialty)
    .map(t => ({ id: t.id, name: taxoLabel(t) }))
  const industryOptions: Option[] = fetchedIndustries.map(i => ({ id: i.id, name: taxoLabel(i) }))

  const setM = (key: keyof MetaData) => (val: string | boolean) =>
    setMeta(m => ({ ...m, [key]: val }))

  const setField = (lang: ChallengeLang, key: keyof ChallengeFields) => (val: string) =>
    setTexts(t => ({ ...t, [lang]: { ...t[lang], [key]: val } }))

  function selectSpecialty(spec: string) {
    setMeta(m => ({ ...m, specialty: spec, challenge_type: '', challenge_type_id: '' }))
    setTimeout(() => setStep(1), 150)
  }

  function selectType(opt: Option) {
    setMeta(m => ({ ...m, challenge_type: opt.name, challenge_type_id: opt.id }))
    // Prefill the deliverable of the source language if still empty.
    setTexts(t => {
      if (t[sourceLang].deliverable) return t
      return { ...t, [sourceLang]: { ...t[sourceLang], deliverable: DELIVERABLES[opt.name] || '' } }
    })
    setTimeout(() => setStep(2), 150)
  }

  function selectIndustry(opt: Option) {
    setMeta(m => ({ ...m, industry: opt.name, industry_id: opt.id }))
    setTimeout(() => setStep(3), 150)
  }

  async function handleTranslate() {
    setError(null)
    const src = texts[sourceLang]
    if (!src.title.trim() || !src.brief.trim()) {
      setError('Renseigne au moins le titre et le brief dans la langue source avant de traduire.')
      return
    }
    setTranslating(true)
    const res = await translateChallenge({ sourceLang, fields: src })
    setTranslating(false)
    if (!res.ok) { setError(res.error); return }
    setTexts(prev => {
      const next = { ...prev }
      for (const [lang, fields] of Object.entries(res.translations)) {
        next[lang as ChallengeLang] = fields as ChallengeFields
      }
      return next
    })
    setStatus(prev => {
      const next = { ...prev }
      for (const lang of Object.keys(res.translations)) next[lang as ChallengeLang] = 'ai_generated'
      return next
    })
    // Jump to the first translated tab so the admin can review immediately.
    const firstTarget = (Object.keys(res.translations)[0] as ChallengeLang) ?? activeLang
    setActiveLang(firstTarget)
  }

  async function handleGenerate() {
    setError(null)
    if (!genBrief.trim()) { setError('Décris le challenge à générer.'); return }
    setGenerating(true)
    const league = leagues.find(l => l.id === meta.league_id)
    const res = await generateChallenge({
      sourceLang,
      genBrief,
      specialty: meta.specialty || undefined,
      challengeType: meta.challenge_type || undefined,
      industry: meta.industry || undefined,
      league: league?.name,
      leagueTier: league?.order_index,
    })
    setGenerating(false)
    if (!res.ok) { setError(res.error); return }
    // Fill the source-language fields as an editable draft (canonical → validated).
    setTexts(prev => ({ ...prev, [sourceLang]: res.fields }))
    setStatus(prev => ({ ...prev, [sourceLang]: 'validated' }))
    setActiveLang(sourceLang)
  }

  function markValidated(lang: ChallengeLang) {
    setStatus(s => ({ ...s, [lang]: 'validated' }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const dd = parseInt(meta.deadline_days)
    if (!texts[sourceLang].title.trim() || !texts[sourceLang].brief.trim()) {
      setError('Titre et brief requis dans la langue source.'); setSaving(false); return
    }
    if (!meta.deadline_days || isNaN(dd)) { setError('Deadline requise'); setSaving(false); return }
    if (dd < 1) { setError('Minimum 1 jour'); setSaving(false); return }
    if (dd > 365) { setError('Maximum 365 jours'); setSaving(false); return }

    // Source language is the hand-written canonical version → always validated.
    const finalStatus: Record<ChallengeLang, TStatus> = { ...status, [sourceLang]: 'validated' }

    // Type / industry are sent as FK ids only — the legacy text columns
    // (challenge_type / industry) are no longer written. The names stay
    // client-side for the chips and the DELIVERABLES prefill.
    const { challenge_type: _ct, industry: _ind, ...metaToSend } = meta
    void _ct; void _ind

    const url = id ? `/api/admin/challenges/${id}` : '/api/admin/challenges'
    const method = id ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...metaToSend,
        xp_reward: parseInt(meta.xp_reward),
        deadline_days: parseInt(meta.deadline_days),
        league_id: meta.league_id || null,
        source_lang: sourceLang,
        translation_status: finalStatus,
        texts,
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
            const selected = meta.specialty === s.value
            return (
              <button
                key={s.value}
                onClick={() => selectSpecialty(s.value)}
                className={cn(
                  'flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-start transition-all hover:-translate-y-0.5 hover:shadow-sm',
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
    return (
      <div className="space-y-6">
        <StepIndicator step={1} onBack={() => setStep(0)} />
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Type de défi pour <span className="font-semibold text-foreground">{meta.specialty}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map(opt => (
              <button
                key={opt.id || opt.name}
                onClick={() => selectType(opt)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium border transition-all',
                  meta.challenge_type === opt.name
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:border-primary/50 hover:bg-muted/40'
                )}
              >
                {opt.name}
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
            {industryOptions.map(opt => (
              <button
                key={opt.id || opt.name}
                onClick={() => selectIndustry(opt)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border transition-all',
                  meta.industry === opt.name
                    ? 'bg-primary text-primary-foreground border-primary font-medium'
                    : 'bg-card border-border hover:border-primary/50 hover:bg-muted/40'
                )}
              >
                {opt.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Step 3 — Details ───────────────────────────────────────────────────────
  const af = texts[activeLang]
  const rtl = activeLang === 'ar'
  const isSourceTab = activeLang === sourceLang

  return (
    <div className="space-y-6">
      {!id && <StepIndicator step={3} onBack={() => setStep(2)} />}

      {/* Context chips */}
      {(meta.specialty || meta.challenge_type || meta.industry) && (
        <div className="flex items-center gap-2 flex-wrap">
          {meta.specialty && (() => {
            const style = SPECIALTY_STYLE[meta.specialty]
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
                {SPECIALTIES.find(s => s.value === meta.specialty)?.icon} {meta.specialty}
              </button>
            )
          })()}
          {meta.challenge_type && (
            <button
              onClick={() => { if (!id) setStep(1) }}
              className={cn('inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-muted/60', !id && 'hover:opacity-80 cursor-pointer')}
            >
              {meta.challenge_type}
            </button>
          )}
          {meta.industry && (
            <button
              onClick={() => { if (!id) setStep(2) }}
              className={cn('inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-muted/60', !id && 'hover:opacity-80 cursor-pointer')}
            >
              {meta.industry}
            </button>
          )}
        </div>
      )}

      {/* Meta fields */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="md:col-span-2 space-y-1.5">
          <label className={labelClass}>Emoji de la carte</label>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={meta.emoji}
              onChange={e => setM('emoji')(e.target.value)}
              className={cn(inputClass, 'w-16 text-center text-xl')}
              placeholder="🎯"
              maxLength={8}
            />
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_SUGGESTIONS.map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setM('emoji')(em)}
                  className={cn(
                    'size-9 rounded-lg text-lg flex items-center justify-center transition-colors',
                    meta.emoji === em ? 'bg-primary/15 ring-1 ring-primary' : 'hover:bg-muted',
                  )}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Laisse vide pour utiliser l&apos;emoji par défaut de la spécialité.</p>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Ligue</label>
          <select value={meta.league_id} onChange={e => setM('league_id')(e.target.value)} className={inputClass}>
            <option value="">— Aucune ligue —</option>
            {leagues.map(l => <option key={l.id} value={l.id}>{l.icon} {l.name}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>XP reward</label>
          <input type="number" value={meta.xp_reward} onChange={e => setM('xp_reward')(e.target.value)} className={inputClass} min={0} />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Deadline (en jours)</label>
          <input type="number" value={meta.deadline_days} onChange={e => setM('deadline_days')(e.target.value)} className={inputClass} min={1} max={365} placeholder="Ex: 7" />
          <p className="text-xs text-muted-foreground">Durée personnelle à partir de la participation</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setM('is_published')(!meta.is_published)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${meta.is_published ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow transition-transform ${meta.is_published ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span className="text-sm font-medium">{meta.is_published ? 'Publié' : 'Draft (non publié)'}</span>
        </div>
      </div>

      {/* ── Multilingual content ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card/40 p-4 sm:p-5 space-y-4">
        {/* Source language picker + translate */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={labelClass}>Langue source</span>
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted text-xs font-medium">
              {LANGS.map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => { setSourceLang(l); setActiveLang(l) }}
                  className={cn(
                    'px-2.5 py-1 rounded-full uppercase tracking-wider transition-colors',
                    sourceLang === l ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleTranslate}
            disabled={translating}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 disabled:opacity-60"
          >
            {translating ? <Loader2 className="size-4 animate-spin" /> : <Languages className="size-4" />}
            {translating ? 'Traduction…' : 'Traduire vers les autres langues'}
          </button>
        </div>

        {/* AI generation — fills the source language only; translation stays the Traduire step. */}
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-sm font-semibold">Générer par IA</span>
            <span className="text-[11px] text-muted-foreground">→ langue source ({LANG_LABEL[sourceLang]}), brouillon à relire</span>
          </div>
          <textarea
            value={genBrief}
            onChange={e => setGenBrief(e.target.value)}
            rows={2}
            className={cn(inputClass, 'h-auto py-2 resize-none')}
            placeholder="Décris le challenge voulu (ex : « refonte de l'appli mobile d'une banque pour les jeunes, focus onboarding »). Les sélecteurs ci-dessus servent de contexte."
            dir={sourceLang === 'ar' ? 'rtl' : 'ltr'}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">
              Remplit les 6 champs en {LANG_LABEL[sourceLang]}. Tu pourras corriger, puis « Traduire ».
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-85 disabled:opacity-60"
            >
              {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {generating ? 'Génération…' : 'Générer par IA'}
            </button>
          </div>
        </div>

        {/* Language tabs */}
        <div className="flex items-center gap-1.5 border-b border-border">
          {LANGS.map(l => (
            <button
              key={l}
              type="button"
              onClick={() => setActiveLang(l)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeLang === l ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {LANG_LABEL[l]}
              <StatusBadge status={l === sourceLang ? 'validated' : status[l]} isSource={l === sourceLang} />
            </button>
          ))}
        </div>

        {/* Validate action for non-source languages */}
        {!isSourceTab && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">
              {status[activeLang] === 'validated'
                ? 'Cette version est validée et sera servie en production.'
                : 'Relis/corrige la traduction, puis marque-la comme validée pour qu\'elle soit servie en production.'}
            </p>
            <button
              type="button"
              onClick={() => markValidated(activeLang)}
              disabled={status[activeLang] === 'validated'}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:opacity-85 disabled:opacity-50"
            >
              <Check className="size-3.5" /> {status[activeLang] === 'validated' ? 'Validé' : 'Marquer validé'}
            </button>
          </div>
        )}

        {/* Fields for the active language */}
        <div className="grid md:grid-cols-2 gap-5" dir={rtl ? 'rtl' : 'ltr'}>
          <div className="md:col-span-2 space-y-1.5">
            <label className={labelClass}>Titre</label>
            <input value={af.title} onChange={e => setField(activeLang, 'title')(e.target.value)} className={inputClass} placeholder="Titre du challenge" dir={rtl ? 'rtl' : 'ltr'} />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className={labelClass}>Brief principal</label>
            <textarea value={af.brief} onChange={e => setField(activeLang, 'brief')(e.target.value)} rows={3} className={cn(inputClass, 'h-auto py-2 resize-none')} dir={rtl ? 'rtl' : 'ltr'} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Contexte</label>
            <textarea value={af.context} onChange={e => setField(activeLang, 'context')(e.target.value)} rows={3} className={cn(inputClass, 'h-auto py-2 resize-none')} dir={rtl ? 'rtl' : 'ltr'} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Livrable</label>
            <textarea value={af.deliverable} onChange={e => setField(activeLang, 'deliverable')(e.target.value)} rows={3} className={cn(inputClass, 'h-auto py-2 resize-none')} dir={rtl ? 'rtl' : 'ltr'} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Contraintes</label>
            <textarea value={af.constraints} onChange={e => setField(activeLang, 'constraints')(e.target.value)} rows={3} className={cn(inputClass, 'h-auto py-2 resize-none')} dir={rtl ? 'rtl' : 'ltr'} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Critères d&apos;évaluation</label>
            <textarea value={af.criteria} onChange={e => setField(activeLang, 'criteria')(e.target.value)} rows={3} className={cn(inputClass, 'h-auto py-2 resize-none')} dir={rtl ? 'rtl' : 'ltr'} />
          </div>
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

// ── Initial helpers ──────────────────────────────────────────────────────────

function stripI18n(initial?: ChallengeFormInitial): Partial<MetaData> {
  if (!initial) return {}
  const { source_lang: _s, texts: _t, status: _st, ...meta } = initial
  void _s; void _t; void _st
  return meta
}

function buildTexts(initial?: ChallengeFormInitial): Record<ChallengeLang, ChallengeFields> {
  const base: Record<ChallengeLang, ChallengeFields> = {
    fr: { ...EMPTY_FIELDS }, en: { ...EMPTY_FIELDS }, ar: { ...EMPTY_FIELDS },
  }
  if (initial?.texts) {
    for (const l of LANGS) {
      if (initial.texts[l]) base[l] = { ...EMPTY_FIELDS, ...initial.texts[l] }
    }
  }
  return base
}

function buildStatus(initial?: ChallengeFormInitial): Record<ChallengeLang, TStatus> {
  const src = initial?.source_lang ?? 'fr'
  const base: Record<ChallengeLang, TStatus> = { fr: 'draft', en: 'draft', ar: 'draft' }
  base[src] = 'validated'
  if (initial?.status) {
    for (const l of LANGS) {
      if (initial.status[l]) base[l] = initial.status[l] as TStatus
    }
  }
  return base
}
