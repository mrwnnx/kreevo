'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, RefreshCw, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
import { CountdownTimer } from '@/components/features/challenge/CountdownTimer'
import { ImageUpload } from '@/components/ui/ImageUpload'

interface BriefData {
  title: string
  context: string
  objective: string
  deliverable: string
  constraints: string
  evaluation: string
}

interface BriefRecord {
  id: string
  status: string
  prompt: { domain: string; type: string; difficulty: string; duration: string }
  brief_text: string
  started_at: string | null
  deadline_at: string | null
  cover_url: string | null
  figma_url: string | null
  description: string | null
}

const SECTIONS = [
  { key: 'context' as const,     label: 'Contexte',    icon: '🔍' },
  { key: 'objective' as const,   label: 'Objectif',    icon: '🎯' },
  { key: 'deliverable' as const, label: 'Livrable',    icon: '📦' },
  { key: 'constraints' as const, label: 'Contraintes', icon: '⚠️' },
  { key: 'evaluation' as const,  label: 'Évaluation',  icon: '⭐' },
]

export function BriefWorkspaceClient({ brief: record }: { brief: BriefRecord }) {
  const router = useRouter()
  const [status, setStatus] = useState(record.status)
  const [deadlineAt, setDeadlineAt] = useState(record.deadline_at)
  const [starting, setStarting] = useState(false)

  const [coverUrl, setCoverUrl] = useState<string | null>(record.cover_url ?? null)
  const [figmaUrl, setFigmaUrl] = useState(record.figma_url ?? '')
  const [description, setDescription] = useState(record.description ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [xpEarned, setXpEarned] = useState<number | null>(null)
  const [submittedCover, setSubmittedCover] = useState<string | null>(record.cover_url ?? null)
  const [submittedFigma, setSubmittedFigma] = useState<string | null>(record.figma_url ?? null)

  let parsed: BriefData | null = null
  try { parsed = JSON.parse(record.brief_text) } catch { /* ignore */ }

  async function handleStart() {
    setStarting(true)
    const res = await fetch(`/api/briefs/${record.id}/start`, { method: 'PATCH' })
    const data = await res.json()
    if (res.ok) {
      setStatus('started')
      setDeadlineAt(data.brief.deadline_at)
    }
    setStarting(false)
  }

  async function handleSubmit() {
    if (!coverUrl) { setSubmitError('Merci de téléverser une image de couverture'); return }
    setSubmitting(true)
    setSubmitError(null)
    const res = await fetch(`/api/briefs/${record.id}/submit`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cover_url: coverUrl, figma_url: figmaUrl || null, description }),
    })
    const data = await res.json()
    if (res.ok) {
      setXpEarned(data.xp)
      setSubmittedCover(coverUrl)
      setSubmittedFigma(figmaUrl || null)
      setStatus('submitted')
    } else {
      setSubmitError(data.error ?? 'Erreur inconnue')
    }
    setSubmitting(false)
  }

  if (!parsed) {
    return <div className="p-6 text-sm text-muted-foreground font-mono">Brief invalide.</div>
  }

  return (
    <div className="p-6 max-w-[960px] mx-auto space-y-8">

      {/* Brief card */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
          <p className="text-xs font-mono text-primary uppercase tracking-widest mb-1">
            {record.prompt.domain} · {record.prompt.type} · {record.prompt.difficulty}
          </p>
          <h1 className="text-2xl font-bold">{parsed.title}</h1>
        </div>
        <div className="divide-y divide-border">
          {SECTIONS.map(s => (
            <div key={s.key} className="px-6 py-4 grid md:grid-cols-[140px_1fr] gap-2">
              <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                <span>{s.icon}</span>
                <span className="uppercase tracking-widest">{s.label}</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{parsed[s.key]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── État active ── */}
      {status === 'active' && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Play className="size-4 text-primary" fill="currentColor" />
            </div>
            <div>
              <p className="font-semibold text-sm">Prêt à commencer ?</p>
              <p className="text-xs text-muted-foreground">Durée estimée : {record.prompt.duration}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Une fois que tu cliques, le timer démarre. Tu auras <strong>{record.prompt.duration}</strong> pour soumettre ton travail.
          </p>
          <button
            onClick={handleStart}
            disabled={starting}
            className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-full hover:opacity-85 transition-opacity disabled:opacity-60"
          >
            {starting ? <RefreshCw className="size-4 animate-spin" /> : <Play className="size-4" fill="currentColor" />}
            {starting ? 'Démarrage…' : 'Commencer ce brief'}
          </button>
        </div>
      )}

      {/* ── État started ── */}
      {status === 'started' && deadlineAt && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
            <p className="text-xs font-mono text-amber-700 uppercase tracking-widest">Temps restant</p>
            <CountdownTimer deadline={deadlineAt} onExpired={() => setStatus('expired')} />
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-5">
            <div>
              <h2 className="font-semibold text-sm">Soumettre mon travail</h2>
              <p className="text-xs text-muted-foreground mt-0.5">+50 XP à la complétion</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Image de couverture *
              </label>
              <ImageUpload bucket="submissions" value={coverUrl} onChange={setCoverUrl} className="h-48" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder="Explique tes choix de design, ton process, les outils utilisés…"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Lien Figma / Behance / Prototype
              </label>
              <input
                type="url"
                value={figmaUrl}
                onChange={e => setFigmaUrl(e.target.value)}
                placeholder="https://figma.com/file/..."
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {submitError && <p className="text-sm text-destructive font-mono">{submitError}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting || !coverUrl}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-full hover:opacity-85 transition-opacity disabled:opacity-60"
            >
              {submitting && <RefreshCw className="size-4 animate-spin" />}
              {submitting ? 'Soumission en cours…' : 'Soumettre mon travail'}
            </button>
          </div>
        </div>
      )}

      {/* ── État submitted ── */}
      {status === 'submitted' && (
        <div className="rounded-2xl border border-green-200 bg-green-50/50 p-4 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-8 text-green-500 shrink-0" />
            <div>
              <p className="font-semibold">Brief complété !</p>
              <p className="text-sm text-green-700">+{xpEarned ?? 50} XP gagnés</p>
            </div>
          </div>
          {submittedCover && (
            <img src={submittedCover} alt="Cover soumission" className="rounded-xl w-full max-h-64 object-cover border border-green-200" />
          )}
          {submittedFigma && (
            <a
              href={submittedFigma}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ExternalLink className="size-3.5" />
              Voir le prototype
            </a>
          )}
          <button
            onClick={() => router.push('/dashboard/brief')}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground border border-border rounded-full px-4 py-2 hover:border-primary/40 hover:text-foreground transition-colors"
          >
            Générer un nouveau brief
          </button>
        </div>
      )}

      {/* ── État expired ── */}
      {status === 'expired' && (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-8 text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-red-700">Délai expiré</p>
              <p className="text-sm text-red-600">Tu n'as pas soumis dans les temps. -50 XP</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/brief')}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground border border-border rounded-full px-4 py-2 hover:border-primary/40 hover:text-foreground transition-colors"
          >
            Générer un nouveau brief
          </button>
        </div>
      )}
    </div>
  )
}
