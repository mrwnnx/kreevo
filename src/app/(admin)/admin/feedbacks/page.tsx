'use client'

import { useState, useEffect } from 'react'
import { Send, Save, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { leagueLabel } from '@/lib/utils/xp'
import { cn } from '@/lib/utils'

interface Feedback {
  id: string
  ai_draft: string | null
  strengths: string | null
  improvements: string | null
  priority_action: string | null
  league_impact: string | null
  score: number | null
  status: string
  created_at: string
  submission?: {
    cover_url: string
    challenges?: { title: string }
  }
  profiles?: { username: string; avatar_url: string | null; league: string; full_name: string }
}

function FeedbackCard({ fb, onSave, onPublish }: {
  fb: Feedback
  onSave: (id: string, data: Partial<Feedback>) => void
  onPublish: (id: string, data: Partial<Feedback>) => void
}) {
  const [form, setForm] = useState({
    strengths: fb.strengths ?? '',
    improvements: fb.improvements ?? '',
    priority_action: fb.priority_action ?? '',
    league_impact: fb.league_impact ?? '',
    score: fb.score ?? 5,
  })
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const set = (key: keyof typeof form) => (val: string | number) =>
    setForm(f => ({ ...f, [key]: val }))

  const ta = (label: string, key: keyof typeof form, placeholder: string) => (
    <div className="space-y-1.5">
      <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{label}</label>
      <textarea
        value={form[key] as string}
        onChange={e => set(key)(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
      />
    </div>
  )

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-5 border-b border-border">
        {fb.submission?.cover_url && (
          <img src={fb.submission.cover_url} alt="" className="size-16 rounded-lg object-cover shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-muted-foreground mb-0.5">{fb.submission?.challenges?.title}</p>
          <div className="flex items-center gap-2">
            <Avatar className="size-6 rounded-md">
              <AvatarImage src={fb.profiles?.avatar_url ?? undefined} />
              <AvatarFallback className="rounded-md text-[10px]">{fb.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{fb.profiles?.full_name ?? fb.profiles?.username}</span>
            <span className="text-xs text-muted-foreground">{leagueLabel(fb.profiles?.league ?? 'Stone')}</span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {new Date(fb.created_at).toLocaleDateString('fr')}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* AI Draft */}
        {fb.ai_draft && (
          <div className="rounded-lg bg-white dark:bg-zinc-900/20 border border-border p-4">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">Draft IA</p>
            <p className="text-sm text-foreground leading-relaxed">{fb.ai_draft}</p>
          </div>
        )}

        {/* Form */}
        <div className="grid md:grid-cols-2 gap-4">
          {ta('Points forts', 'strengths', 'Ce qui fonctionne bien…')}
          {ta('Axes d\'amélioration', 'improvements', 'Ce qui pourrait être mieux…')}
          {ta('Action prioritaire', 'priority_action', 'Le point le plus important à corriger…')}
          {ta('Impact ligue', 'league_impact', 'Comment ce travail impacte la progression…')}
        </div>

        {/* Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Score</label>
            <span className="text-2xl font-bold text-primary font-mono">{form.score}/10</span>
          </div>
          <input
            type="range" min={1} max={10} value={form.score}
            onChange={e => set('score')(parseInt(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>1</span><span>5</span><span>10</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-border">
          <button
            onClick={async () => { setSaving(true); await onSave(fb.id, form); setSaving(false) }}
            disabled={saving}
            className="flex items-center gap-2 text-sm border border-border px-4 py-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Sauvegarder draft
          </button>
          <button
            onClick={async () => { setPublishing(true); await onPublish(fb.id, form); setPublishing(false) }}
            disabled={publishing}
            className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {publishing ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            Publier le feedback
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminFeedbacks() {
  const [tab, setTab] = useState<'pending' | 'published'>('pending')
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [tab])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/admin/feedbacks?status=${tab}`)
    const data = await res.json()
    setFeedbacks(data.feedbacks ?? [])
    setLoading(false)
  }

  async function save(id: string, data: Partial<Feedback>) {
    await fetch(`/api/admin/feedbacks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  async function publish(id: string, data: Partial<Feedback>) {
    await fetch(`/api/admin/feedbacks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, status: 'published' }),
    })
    load()
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Feedbacks Pro</h1>
        <p className="text-sm text-muted-foreground">Revue et publication des feedbacks</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {[
          { key: 'pending', label: 'En attente' },
          { key: 'published', label: 'Publiés' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={cn('px-4 py-2 text-sm font-medium transition-colors',
              tab === t.key ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : feedbacks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Aucun feedback {tab === 'pending' ? 'en attente' : 'publié'}
        </div>
      ) : (
        <div className="space-y-6">
          {feedbacks.map(fb => (
            <FeedbackCard key={fb.id} fb={fb} onSave={save} onPublish={publish} />
          ))}
        </div>
      )}
    </div>
  )
}
