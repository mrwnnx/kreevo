'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const labelClass = 'text-xs font-mono text-muted-foreground uppercase tracking-widest'
const inputClass =
  'w-full h-10 rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 py-1 text-base md:text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors'

export interface SpecialtyInitial {
  slug?: string
  name?: string
  name_fr?: string
  name_en?: string
  name_ar?: string
  emoji?: string
  order_index?: number
  is_active?: boolean
}

// Même slugify que l'API (lowercase, sans accents, alphanum → `_`).
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function SpecialtyForm({ initial, id }: { initial?: SpecialtyInitial; id?: string }) {
  const router = useRouter()
  const isEdit = !!id

  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(isEdit) // en édition, slug figé
  const [nameFr, setNameFr] = useState(initial?.name_fr ?? '')
  const [nameEn, setNameEn] = useState(initial?.name_en ?? '')
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '')
  const [orderIndex, setOrderIndex] = useState(String(initial?.order_index ?? 0))
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Création : le slug suit le name tant que l'admin ne l'a pas édité à la main.
  function onNameChange(v: string) {
    setName(v)
    if (!isEdit && !slugTouched) setSlug(slugify(v))
  }

  async function handleSave() {
    setError(null)
    if (!name.trim()) { setError('Le nom est requis.'); return }
    setSaving(true)

    const payload = isEdit
      ? { name, name_fr: nameFr || null, name_en: nameEn || null, name_ar: nameAr || null, emoji: emoji || null, order_index: Number(orderIndex) || 0, is_active: isActive }
      : { slug: slug || undefined, name, name_fr: nameFr || null, name_en: nameEn || null, name_ar: nameAr || null, emoji: emoji || null, order_index: Number(orderIndex) || 0, is_active: isActive }

    const res = await fetch(isEdit ? `/api/admin/specialties/${id}` : '/api/admin/specialties', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Échec de l\'enregistrement.'); return }
    router.push('/admin/specialties')
    router.refresh()
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="text-sm text-destructive font-mono bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-2">{error}</p>
      )}

      <div className="space-y-1.5">
        <label className={labelClass}>Nom (interne)</label>
        <input className={inputClass} value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="UX/UI Design" />
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>Slug {isEdit && '(verrouillé)'}</label>
        <input
          className={cn(inputClass, isEdit && 'opacity-60 cursor-not-allowed')}
          value={slug}
          onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)) }}
          disabled={isEdit}
          placeholder="ux_ui"
        />
        {!isEdit && <p className="text-[11px] text-muted-foreground">Auto-suggéré depuis le nom. Immuable après création.</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className={labelClass}>Nom FR</label>
          <input className={inputClass} value={nameFr} onChange={(e) => setNameFr(e.target.value)} placeholder="UX/UI" />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Nom EN</label>
          <input className={inputClass} value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="UX/UI" />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Nom AR</label>
          <input className={inputClass} value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={labelClass}>Emoji</label>
          <input className={inputClass} value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="✏️" />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Ordre</label>
          <input className={inputClass} type="number" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4" />
        <span className="text-sm">Active (visible dans l&apos;onboarding)</span>
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
  )
}
