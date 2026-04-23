'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Link, Smile, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeagueFormData {
  name: string
  icon: string
  color: string
  order_index: string
  min_challenges: string
  access: 'all' | 'pro_only'
  is_active: boolean
}

const EMPTY: LeagueFormData = {
  name: '',
  icon: '🏆',
  color: '#8B8B8B',
  order_index: '1',
  min_challenges: '3',
  access: 'all',
  is_active: true,
}

const labelClass = 'text-xs font-mono text-muted-foreground uppercase tracking-widest'
const inputClass = 'w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring'

type IconMode = 'emoji' | 'url' | 'upload'

function isImageSrc(s: string) {
  return s.startsWith('http') || s.startsWith('data:')
}

function IconPreview({ icon, color }: { icon: string; color: string }) {
  return (
    <div
      className="size-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
      style={{ background: `linear-gradient(135deg, ${color}88, ${color})` }}
    >
      {isImageSrc(icon) ? (
        <img src={icon} alt="" className="size-9 object-contain" />
      ) : (
        <span className="text-3xl leading-none">{icon || '🏆'}</span>
      )}
    </div>
  )
}

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mode, setMode] = useState<IconMode>(() => {
    if (isImageSrc(value)) return value.startsWith('data:') ? 'upload' : 'url'
    return 'emoji'
  })
  const [urlInput, setUrlInput] = useState(value.startsWith('http') ? value : '')
  const [uploadName, setUploadName] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const tabs: { id: IconMode; label: string; icon: React.ReactNode }[] = [
    { id: 'emoji', label: 'Emoji', icon: <Smile className="size-3.5" /> },
    { id: 'url',   label: 'URL',   icon: <Link className="size-3.5" />  },
    { id: 'upload', label: 'Fichier', icon: <Upload className="size-3.5" /> },
  ]

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      alert('Seuls les fichiers .svg sont acceptés')
      return
    }
    setUploadName(file.name)
    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result as string
      onChange(result)
    }
    reader.readAsDataURL(file)
  }

  function clearUpload() {
    setUploadName(null)
    onChange('🏆')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      {/* Mode tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMode(t.id)}
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all',
              mode === t.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Emoji mode */}
      {mode === 'emoji' && (
        <input
          value={isImageSrc(value) ? '' : value}
          onChange={e => onChange(e.target.value)}
          className={inputClass}
          placeholder="🪨"
          maxLength={8}
        />
      )}

      {/* URL mode */}
      {mode === 'url' && (
        <div className="space-y-2">
          <input
            value={urlInput}
            onChange={e => {
              setUrlInput(e.target.value)
              if (e.target.value.startsWith('http')) onChange(e.target.value)
            }}
            className={inputClass}
            placeholder="https://example.com/icon.svg"
          />
          <p className="text-xs text-muted-foreground">URL publique vers un fichier SVG ou image.</p>
        </div>
      )}

      {/* Upload mode */}
      {mode === 'upload' && (
        <div className="space-y-2">
          {uploadName ? (
            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/40">
              <span className="text-xs text-muted-foreground flex-1 truncate">{uploadName}</span>
              <button type="button" onClick={clearUpload} className="text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-4 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
            >
              <Upload className="size-4" />
              Choisir un fichier .svg
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".svg,image/svg+xml"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      )}
    </div>
  )
}

export function LeagueForm({ initial, id }: { initial?: Partial<LeagueFormData>; id?: string }) {
  const router = useRouter()
  const [form, setForm] = useState<LeagueFormData>({ ...EMPTY, ...initial })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof LeagueFormData) => (val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }))

  async function handleSave() {
    setSaving(true)
    setError(null)
    const url = id ? `/api/admin/leagues/${id}` : '/api/admin/leagues'
    const method = id ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        order_index: parseInt(form.order_index),
        min_challenges: parseInt(form.min_challenges),
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Erreur'); setSaving(false); return }
    router.push('/admin/leagues')
    router.refresh()
  }

  return (
    <div className="space-y-5">

      {/* Icon preview + color */}
      <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/20">
        <IconPreview icon={form.icon} color={form.color} />
        <div className="flex-1 space-y-1">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Aperçu</p>
          <p className="text-sm font-semibold">{form.name || 'Nom de la ligue'}</p>
          <p className="text-xs" style={{ color: form.color }}>{form.name || '—'}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className={labelClass}>Nom</label>
          <input value={form.name} onChange={e => set('name')(e.target.value)} className={inputClass} placeholder="Stone" />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Couleur</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.color}
              onChange={e => set('color')(e.target.value)}
              className="size-9 rounded-md border border-border cursor-pointer bg-background p-0.5"
            />
            <input value={form.color} onChange={e => set('color')(e.target.value)} className={inputClass} placeholder="#8B8B8B" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Ordre d'affichage</label>
          <input
            type="number"
            value={form.order_index}
            onChange={e => set('order_index')(e.target.value)}
            min={1}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Min challenges requis</label>
          <input
            type="number"
            value={form.min_challenges}
            onChange={e => set('min_challenges')(e.target.value)}
            min={1}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Accès</label>
          <select
            value={form.access}
            onChange={e => set('access')(e.target.value as 'all' | 'pro_only')}
            className={inputClass}
          >
            <option value="all">Tous (Free + Pro)</option>
            <option value="pro_only">Pro uniquement</option>
          </select>
        </div>
      </div>

      {/* Icon picker — full width */}
      <div className="space-y-1.5">
        <label className={labelClass}>Icône</label>
        <IconPicker value={form.icon} onChange={val => set('icon')(val)} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => set('is_active')(!form.is_active)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${form.is_active ? 'bg-primary' : 'bg-muted'}`}
        >
          <span className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
        <span className="text-sm font-medium">{form.is_active ? 'Active' : 'Inactive'}</span>
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
          {id ? 'Enregistrer' : 'Créer la ligue'}
        </button>
        <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Annuler
        </button>
      </div>
    </div>
  )
}
