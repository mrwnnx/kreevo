'use client'

import { useState, useEffect } from 'react'
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

const labelClass = 'text-xs font-mono text-muted-foreground uppercase tracking-widest'
const inputClass = 'w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring'

const field = (label: string, name: keyof FormData, value: string, onChange: (v: string) => void, type: 'input' | 'textarea' = 'input') => (
  <div key={name} className="space-y-1.5">
    <label className={labelClass}>{label}</label>
    {type === 'textarea' ? (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        className={cn(inputClass, 'resize-none')}
      />
    ) : (
      <input value={value} onChange={e => onChange(e.target.value)} className={inputClass} />
    )}
  </div>
)

const sel = (label: string, value: string, options: [string, string][], onChange: (v: string) => void) => (
  <div className="space-y-1.5">
    <label className={labelClass}>{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className={inputClass}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </div>
)

export function ChallengeForm({ initial, id }: { initial?: Partial<FormData>; id?: string }) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({ ...EMPTY, ...initial })
  const [leagues, setLeagues] = useState<League[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [aiDomain, setAiDomain] = useState('Web')
  const [aiType, setAiType] = useState('UI')

  useEffect(() => {
    fetch('/api/admin/leagues')
      .then(r => r.json())
      .then(d => setLeagues(d.leagues ?? []))
  }, [])

  const set = (key: keyof FormData) => (val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }))

  async function generateWithAI() {
    setAiLoading(true)
    const res = await fetch('/api/ai/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: aiDomain, type: aiType, duration: `${form.deadline_days} jours` }),
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
              <label className={labelClass}>Domaine</label>
              <select value={aiDomain} onChange={e => setAiDomain(e.target.value)}
                className="text-sm bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring">
                {['Web', 'Mobile', 'Dashboard', 'Landing Page', 'Branding'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Type</label>
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
        {field('Titre', 'title', form.title, v => set('title')(v))}

        {/* Ligue */}
        <div className="space-y-1.5">
          <label className={labelClass}>Ligue</label>
          <select value={form.league_id} onChange={e => set('league_id')(e.target.value)} className={inputClass}>
            <option value="">— Aucune ligue —</option>
            {leagues.map(l => (
              <option key={l.id} value={l.id}>{l.icon} {l.name}</option>
            ))}
          </select>
        </div>

        {/* Track */}
        {sel('Track', form.track, [['ux_ui', 'UX/UI'], ['graphic', 'Graphic']], v => set('track')(v))}

        {/* XP */}
        <div className="space-y-1.5">
          <label className={labelClass}>XP reward</label>
          <input
            type="number"
            value={form.xp_reward}
            onChange={e => set('xp_reward')(e.target.value)}
            className={inputClass}
            min={0}
          />
        </div>

        {/* Deadline */}
        {/* Deadline */}
        <div className="space-y-1.5">
          <label className={labelClass}>Deadline (en jours)</label>
          <input
            type="number"
            value={form.deadline_days}
            onChange={e => set('deadline_days')(e.target.value)}
            className={inputClass}
            min={1}
            max={365}
            placeholder="Ex: 7"
          />
          <p className="text-xs text-muted-foreground">Nombre de jours à partir du moment où le participant rejoint</p>
        </div>

        {/* Brief */}
        <div className="md:col-span-2">
          {field('Brief principal', 'brief', form.brief, v => set('brief')(v), 'textarea')}
        </div>
        {field('Contexte', 'context', form.context, v => set('context')(v), 'textarea')}
        {field('Livrable', 'deliverable', form.deliverable, v => set('deliverable')(v), 'textarea')}
        {field('Contraintes', 'constraints', form.constraints, v => set('constraints')(v), 'textarea')}
        {field("Critères d'évaluation", 'criteria', form.criteria, v => set('criteria')(v), 'textarea')}

        {/* Période */}
        <div className="grid grid-cols-2 gap-3">
          {sel('Mois', form.month,
            Array.from({ length: 12 }, (_, i) => [String(i + 1), new Date(0, i).toLocaleString('fr', { month: 'long' })] as [string, string]),
            v => set('month')(v))}
          {field('Année', 'year', form.year, v => set('year')(v))}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>Reveal at</label>
            <input type="datetime-local" value={form.reveal_at} onChange={e => set('reveal_at')(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Closes at</label>
            <input type="datetime-local" value={form.closes_at} onChange={e => set('closes_at')(e.target.value)} className={inputClass} />
          </div>
        </div>

        {sel('Statut', form.status, [['draft', 'Draft'], ['active', 'Active'], ['closed', 'Closed']], v => set('status')(v))}

        {/* Publié toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => set('is_published')(!form.is_published)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${form.is_published ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow transition-transform ${form.is_published ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span className="text-sm font-medium">
            {form.is_published ? 'Publié' : 'Draft (non publié)'}
          </span>
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
