'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Languages, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { translateLabel, type TaxoLang } from '@/app/(admin)/admin/challenges/taxonomy-actions'

type TStatus = 'draft' | 'ai_generated' | 'validated'
const LANGS: TaxoLang[] = ['fr', 'en', 'ar']
const LANG_LABEL: Record<TaxoLang, string> = { fr: 'Français', en: 'English', ar: 'العربية' }

// Specialties stay hardcoded (onboarding / XP logic owns them).
const SPECIALTIES = ['UX Designer', 'UI Designer', 'Graphic Designer'] as const

const labelClass = 'text-xs font-mono text-muted-foreground uppercase tracking-widest'
const inputClass = 'w-full h-10 rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 py-1 text-base md:text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors'

export interface TaxonomyInitial {
  source_lang?: TaxoLang
  name?: Partial<Record<TaxoLang, string>>
  status?: Partial<Record<TaxoLang, TStatus>>
  specialty?: string
  display_order?: string
}

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

export function TaxonomyForm({
  kind,
  initial,
  id,
}: {
  kind: 'type' | 'industry'
  initial?: TaxonomyInitial
  id?: string
}) {
  const router = useRouter()
  const endpoint = kind === 'type' ? 'challenge-types' : 'industries'
  const backHref = kind === 'type' ? '/admin/challenges/types' : '/admin/challenges/industries'

  const [sourceLang, setSourceLang] = useState<TaxoLang>(initial?.source_lang ?? 'fr')
  const [activeLang, setActiveLang] = useState<TaxoLang>(initial?.source_lang ?? 'fr')
  const [name, setName] = useState<Record<TaxoLang, string>>({
    fr: initial?.name?.fr ?? '', en: initial?.name?.en ?? '', ar: initial?.name?.ar ?? '',
  })
  const [status, setStatus] = useState<Record<TaxoLang, TStatus>>({
    fr: (initial?.status?.fr as TStatus) ?? 'draft',
    en: (initial?.status?.en as TStatus) ?? 'draft',
    ar: (initial?.status?.ar as TStatus) ?? 'draft',
  })
  const [specialty, setSpecialty] = useState(initial?.specialty ?? (kind === 'type' ? 'UX Designer' : ''))
  const [displayOrder, setDisplayOrder] = useState(initial?.display_order ?? '0')

  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleTranslate() {
    setError(null)
    if (!name[sourceLang].trim()) {
      setError('Saisis le nom dans la langue source avant de traduire.')
      return
    }
    setTranslating(true)
    const res = await translateLabel({ sourceLang, name: name[sourceLang], kind })
    setTranslating(false)
    if (!res.ok) { setError(res.error); return }
    setName(prev => {
      const next = { ...prev }
      for (const [l, v] of Object.entries(res.translations)) next[l as TaxoLang] = v as string
      return next
    })
    setStatus(prev => {
      const next = { ...prev }
      for (const l of Object.keys(res.translations)) next[l as TaxoLang] = 'ai_generated'
      return next
    })
    const firstTarget = (Object.keys(res.translations)[0] as TaxoLang) ?? activeLang
    setActiveLang(firstTarget)
  }

  function markValidated(lang: TaxoLang) {
    setStatus(s => ({ ...s, [lang]: 'validated' }))
  }

  async function handleSave() {
    setError(null)
    if (!name[sourceLang].trim()) { setError('Le nom de la langue source est requis.'); return }
    setSaving(true)

    // Source language is canonical → always validated.
    const finalStatus: Record<TaxoLang, TStatus> = { ...status, [sourceLang]: 'validated' }

    const url = id ? `/api/admin/${endpoint}/${id}` : `/api/admin/${endpoint}`
    const method = id ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name_fr: name.fr || null,
        name_en: name.en || null,
        name_ar: name.ar || null,
        ...(kind === 'type' ? { specialty } : {}),
        display_order: parseInt(displayOrder) || 0,
        translation_status: finalStatus,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Erreur'); setSaving(false); return }
    router.push(backHref)
    router.refresh()
  }

  const rtl = activeLang === 'ar'
  const isSourceTab = activeLang === sourceLang

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        {kind === 'type' && (
          <div className="space-y-1.5">
            <label className={labelClass}>Spécialité</label>
            <select value={specialty} onChange={e => setSpecialty(e.target.value)} className={inputClass}>
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <p className="text-[11px] text-muted-foreground">La spécialité reste figée (logique onboarding/XP).</p>
          </div>
        )}
        <div className="space-y-1.5">
          <label className={labelClass}>Ordre d&apos;affichage</label>
          <input type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} min={0} className={inputClass} />
        </div>
      </div>

      {/* Multilingual label */}
      <div className="rounded-2xl border border-border bg-card/40 p-4 sm:p-5 space-y-4">
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
            {translating ? 'Traduction…' : 'Traduire'}
          </button>
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

        {!isSourceTab && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">
              {status[activeLang] === 'validated'
                ? 'Ce label est validé et sera servi en production.'
                : 'Relis/corrige, puis marque comme validé pour servir ce label en production.'}
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

        <div className="space-y-1.5" dir={rtl ? 'rtl' : 'ltr'}>
          <label className={labelClass}>Nom ({LANG_LABEL[activeLang]})</label>
          <input
            value={name[activeLang]}
            onChange={e => setName(n => ({ ...n, [activeLang]: e.target.value }))}
            className={inputClass}
            placeholder={kind === 'type' ? 'Ex : Brand Identity' : 'Ex : Fintech'}
            dir={rtl ? 'rtl' : 'ltr'}
          />
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
          {id ? 'Enregistrer' : 'Créer'}
        </button>
        <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Annuler
        </button>
      </div>
    </div>
  )
}
