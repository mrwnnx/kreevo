'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormData {
  title: string
  brief: string
  context: string
  deliverable: string
  constraints: string
  criteria: string
  track: string
  level: string
  month: string
  year: string
  reveal_at: string
  closes_at: string
  status: string
}

const EMPTY: FormData = {
  title: '', brief: '', context: '', deliverable: '',
  constraints: '', criteria: '',
  track: 'ux_ui', level: 'rising',
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
  reveal_at: '', closes_at: '',
  status: 'draft',
}

const field = (label: string, name: keyof FormData, value: string, onChange: (v: string) => void, type: 'input' | 'textarea' = 'input') => (
  <div key={name} className="space-y-1.5">
    <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{label}</label>
    {type === 'textarea' ? (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
      />
    ) : (
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
      />
    )}
  </div>
)

const sel = (label: string, value: string, options: [string, string][], onChange: (v: string) => void) => (
  <div className="space-y-1.5">
    <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </div>
)

export function ChallengeForm({ initial, id }: { initial?: Partial<FormData>; id?: string }) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({ ...EMPTY, ...initial })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [aiDomain, setAiDomain] = useState('Web')
  const [aiType, setAiType] = useState('UI')

  const set = (key: keyof FormData) => (val: string) => setForm(f => ({ ...f, [key]: val }))

  async function generateWithAI() {
    setAiLoading(true)
    const res = await fetch('/api/ai/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: aiDomain, type: aiType, difficulty: form.level, duration: '3 jours' }),
    })
    const data = await res.json()
    if (res.ok && data.brief) {
      const b = data.brief
      setForm(f => ({
        ...f,
        title: b.title ?? f.title,
        brief: b.objective ?? f.brief,
        context: b.context ?? f.context,
        deliverable: b.deliverable ?? f.deliverable,
        constraints: b.constraints ?? f.constraints,
        criteria: b.evaluation ?? f.criteria,
      }))
      setShowAI(false)
    }
    setAiLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const url = id ? `/api/admin/challenges/${id}` : '/api/admin/challenges'
    const method = id ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        month: parseInt(form.month),
        year: parseInt(form.year),
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Erreur'); setSaving(false); return }
    router.push('/admin/challenges')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* AI Generator */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <button
          onClick={() => setShowAI(s => !s)}
          className="flex items-center gap-2 text-sm font-semibold text-primary"
        >
          <Sparkles className="size-4" />
          Générer avec IA
        </button>
        {showAI && (
          <div className="mt-3 flex items-end gap-3 flex-wrap">
            <div className="space-y-1">
              <label className="text-xs font-mono text-muted-foreground">Domaine</label>
              <select value={aiDomain} onChange={e => setAiDomain(e.target.value)}
                className="text-sm bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring">
                {['Web', 'Mobile', 'Dashboard', 'Landing Page', 'Branding'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono text-muted-foreground">Type</label>
              <select value={aiType} onChange={e => setAiType(e.target.value)}
                className="text-sm bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring">
                {['UX', 'UI', 'Graphic', 'Motion'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <button
              onClick={generateWithAI}
              disabled={aiLoading}
              className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-full hover:opacity-85 disabled:opacity-60"
            >
              {aiLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              Générer
            </button>
          </div>
        )}
      </div>

      {/* Form fields */}
      <div className="grid md:grid-cols-2 gap-5">
        {field('Titre', 'title', form.title, set('title'))}
        <div className="grid grid-cols-2 gap-3">
          {sel('Track', form.track, [['ux_ui', 'UX/UI'], ['graphic', 'Graphic']], set('track'))}
          {sel('Niveau', form.level, [['rookie', 'Rookie'], ['rising', 'Rising'], ['pro', 'Pro'], ['elite', 'Elite']], set('level'))}
        </div>
        <div className={cn('md:col-span-2')}>
          {field('Brief principal', 'brief', form.brief, set('brief'), 'textarea')}
        </div>
        {field('Contexte', 'context', form.context, set('context'), 'textarea')}
        {field('Livrable', 'deliverable', form.deliverable, set('deliverable'), 'textarea')}
        {field('Contraintes', 'constraints', form.constraints, set('constraints'), 'textarea')}
        {field('Critères d\'évaluation', 'criteria', form.criteria, set('criteria'), 'textarea')}
        <div className="grid grid-cols-2 gap-3">
          {sel('Mois', form.month,
            Array.from({ length: 12 }, (_, i) => [String(i + 1), new Date(0, i).toLocaleString('fr', { month: 'long' })] as [string, string]),
            set('month'))}
          {field('Année', 'year', form.year, set('year'))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Reveal at</label>
            <input type="datetime-local" value={form.reveal_at} onChange={e => set('reveal_at')(e.target.value)}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Closes at</label>
            <input type="datetime-local" value={form.closes_at} onChange={e => set('closes_at')(e.target.value)}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>
        {sel('Statut', form.status, [['draft', 'Draft'], ['active', 'Active'], ['closed', 'Closed']], set('status'))}
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
