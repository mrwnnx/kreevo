'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { OnboardingSlide } from '@/components/onboarding/OnboardingSlide'
import { cn } from '@/lib/utils'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type Chrome = Record<'fr' | 'en' | 'ar', Dictionary['onboardingTour']>

const labelClass = 'text-xs font-mono text-muted-foreground uppercase tracking-widest'
const inputClass =
  'w-full h-10 rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 py-1 text-base md:text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors'
const areaClass =
  'w-full min-h-[72px] rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors'

export interface OnboardingStepInitial {
  image_url?: string | null
  name_fr?: string
  name_en?: string
  name_ar?: string
  title_fr?: string
  title_en?: string
  title_ar?: string
  description_fr?: string
  description_en?: string
  description_ar?: string
  is_active?: boolean
}

export function OnboardingStepForm({ initial, id, chrome }: { initial?: OnboardingStepInitial; id?: string; chrome: Chrome }) {
  const router = useRouter()
  const isEdit = !!id
  const [previewLang, setPreviewLang] = useState<'fr' | 'en' | 'ar'>('fr')

  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null)
  const [nameFr, setNameFr] = useState(initial?.name_fr ?? '')
  const [nameEn, setNameEn] = useState(initial?.name_en ?? '')
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? '')
  const [titleFr, setTitleFr] = useState(initial?.title_fr ?? '')
  const [titleEn, setTitleEn] = useState(initial?.title_en ?? '')
  const [titleAr, setTitleAr] = useState(initial?.title_ar ?? '')
  const [descFr, setDescFr] = useState(initial?.description_fr ?? '')
  const [descEn, setDescEn] = useState(initial?.description_en ?? '')
  const [descAr, setDescAr] = useState(initial?.description_ar ?? '')
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setError(null)
    const fields: Record<string, string> = {
      name_fr: nameFr, name_en: nameEn, name_ar: nameAr,
      title_fr: titleFr, title_en: titleEn, title_ar: titleAr,
      description_fr: descFr, description_en: descEn, description_ar: descAr,
    }
    const missing = Object.entries(fields).find(([, v]) => !v.trim())
    if (missing) { setError(`Champ requis : ${missing[0]}`); return }

    setSaving(true)
    const payload = { ...fields, image_url: imageUrl || null, is_active: isActive }
    const res = await fetch(isEdit ? `/api/admin/onboarding-steps/${id}` : '/api/admin/onboarding-steps', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Échec de l\'enregistrement.'); return }
    router.push('/admin/onboarding')
    router.refresh()
  }

  // Valeurs affichées dans l'aperçu selon la langue sélectionnée (state live, pas la DB).
  const pv =
    previewLang === 'en' ? { name: nameEn, title: titleEn, description: descEn }
    : previewLang === 'ar' ? { name: nameAr, title: titleAr, description: descAr }
    : { name: nameFr, title: titleFr, description: descFr }

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      {/* ── Colonne formulaire ── */}
      <div className="space-y-5">
      {error && (
        <p className="text-sm text-destructive font-mono bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-2">{error}</p>
      )}

      {/* Image header (optionnelle → null = gradient placeholder) */}
      <div className="space-y-1.5">
        <label className={labelClass}>Image header (optionnelle)</label>
        <ImageUpload bucket="onboarding" value={imageUrl} onChange={setImageUrl} />
        <p className="text-[11px] text-muted-foreground">Vide → header en dégradé (placeholder).</p>
      </div>

      {/* Nom (« X sur N — {name} ») */}
      <div className="space-y-1.5">
        <label className={labelClass}>Nom court (FR / EN / AR)</label>
        <div className="grid grid-cols-3 gap-3">
          <input className={inputClass} value={nameFr} onChange={(e) => setNameFr(e.target.value)} placeholder="FR" />
          <input className={inputClass} value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="EN" />
          <input className={inputClass} value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="AR" dir="rtl" />
        </div>
      </div>

      {/* Titre */}
      <div className="space-y-1.5">
        <label className={labelClass}>Titre (FR / EN / AR)</label>
        <div className="grid grid-cols-3 gap-3">
          <input className={inputClass} value={titleFr} onChange={(e) => setTitleFr(e.target.value)} placeholder="FR" />
          <input className={inputClass} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="EN" />
          <input className={inputClass} value={titleAr} onChange={(e) => setTitleAr(e.target.value)} placeholder="AR" dir="rtl" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className={labelClass}>Description (FR / EN / AR)</label>
        <div className="grid grid-cols-3 gap-3">
          <textarea className={areaClass} value={descFr} onChange={(e) => setDescFr(e.target.value)} placeholder="FR" />
          <textarea className={areaClass} value={descEn} onChange={(e) => setDescEn(e.target.value)} placeholder="EN" />
          <textarea className={areaClass} value={descAr} onChange={(e) => setDescAr(e.target.value)} placeholder="AR" dir="rtl" />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4" />
        <span className="text-sm">Active (visible dans le tour)</span>
      </label>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full hover:opacity-85 transition-opacity disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {isEdit ? 'Enregistrer' : 'Créer'}
        </button>
      </div>
      </div>

      {/* ── Colonne aperçu (sticky desktop · sous le form en mobile) ── */}
      <div className="lg:sticky lg:top-6 space-y-3">
        <div className="flex items-center gap-1 p-1 rounded-full border border-border bg-card w-fit">
          {(['fr', 'en', 'ar'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setPreviewLang(l)}
              className={cn(
                'text-xs font-semibold uppercase px-3 py-1 rounded-full transition-colors',
                previewLang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Cartouche = mêmes classes que DialogContent du vrai modal */}
        <div className="rounded-2xl border border-border bg-popover overflow-hidden shadow-lg max-w-md">
          <OnboardingSlide
            name={pv.name || '—'}
            title={pv.title || "Titre de l'étape…"}
            description={pv.description || "Description de l'étape…"}
            imageUrl={imageUrl}
            current={1}
            total={2}
            t={chrome[previewLang]}
            isFirst
            isLast={false}
            dir={previewLang === 'ar' ? 'rtl' : 'ltr'}
            interactive={false}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">Aperçu en direct — l&apos;indicateur « X / N » est un exemple.</p>
      </div>
    </div>
  )
}
