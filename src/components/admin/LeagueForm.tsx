'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'

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
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className={labelClass}>Nom</label>
          <input value={form.name} onChange={e => set('name')(e.target.value)} className={inputClass} placeholder="Stone" />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Icône (emoji)</label>
          <input value={form.icon} onChange={e => set('icon')(e.target.value)} className={inputClass} placeholder="🪨" />
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
