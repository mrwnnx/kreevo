'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, RefreshCw, Play, Clock, Lock, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react'
import { CountdownTimer } from '@/components/features/challenge/CountdownTimer'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────

interface BriefData {
  title: string
  context: string
  objective: string
  deliverable: string
  constraints: string
  evaluation: string
}

interface SavedBrief {
  id: string
  prompt: { domain: string; type: string; difficulty: string; duration: string }
  brief_text: string
  status: string
  deadline_at: string | null
  created_at: string
}

// ── Config ─────────────────────────────────────────────────────

const DOMAINS = ['Web', 'Mobile', 'Dashboard', 'Landing Page', 'Branding']
const TYPES   = ['UX', 'UI', 'Graphic', 'Motion']
const DIFFICULTIES = ['Rookie', 'Rising', 'Pro']
const DURATIONS = ['1 heure', '3 heures', '1 jour', '3 jours']

const DIFFICULTY_COLOR: Record<string, string> = {
  Rookie: 'text-stone-500 bg-stone-100',
  Rising: 'text-slate-600 bg-slate-100',
  Pro:    'text-yellow-700 bg-yellow-100',
}

// ── Select component ────────────────────────────────────────────

function SelectField({
  label, options, value, onChange,
}: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{label}</label>
      <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150',
              value === opt
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Brief card ──────────────────────────────────────────────────

function BriefCard({ brief, briefId, onReset }: { brief: BriefData; briefId: string; onReset: () => void }) {
  const router = useRouter()
  const [starting, setStarting] = useState(false)

  async function handleStart() {
    setStarting(true)
    const res = await fetch(`/api/briefs/${briefId}/start`, { method: 'PATCH' })
    if (res.ok) {
      router.push(`/dashboard/brief/${briefId}`)
    } else {
      // Brief déjà commencé → navigate anyway
      router.push(`/dashboard/brief/${briefId}`)
    }
    setStarting(false)
  }

  const sections = [
    { label: 'Contexte',   icon: '🔍', value: brief.context },
    { label: 'Objectif',   icon: '🎯', value: brief.objective },
    { label: 'Livrable',   icon: '📦', value: brief.deliverable },
    { label: 'Contraintes',icon: '⚠️', value: brief.constraints },
    { label: 'Évaluation', icon: '⭐', value: brief.evaluation },
  ]

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-primary uppercase tracking-widest mb-1">Brief généré</p>
            <h2 className="text-xl font-bold leading-tight">{brief.title}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:border-primary/40 hover:text-foreground transition-colors"
            >
              <RefreshCw className="size-3" />
              Autre
            </button>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="divide-y divide-border">
        {sections.map(s => (
          <div key={s.label} className="px-6 py-4 grid md:grid-cols-[140px_1fr] gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <span>{s.icon}</span>
              <span className="uppercase tracking-widest">{s.label}</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{s.value}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-6 py-4 bg-muted/30 flex items-center gap-3">
        <button
          onClick={handleStart}
          disabled={starting}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {starting ? <RefreshCw className="size-3.5 animate-spin" /> : <Play className="size-3.5" fill="currentColor" />}
          {starting ? 'Démarrage…' : 'Commencer ce brief'}
        </button>
        <p className="text-xs font-mono text-muted-foreground">+50 XP à la complétion</p>
      </div>
    </div>
  )
}

// ── Saved brief row ─────────────────────────────────────────────

function SavedBriefRow({ brief }: { brief: SavedBrief }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  let parsed: BriefData | null = null
  try { parsed = JSON.parse(brief.brief_text) } catch { /* ignore */ }

  const prompt = brief.prompt
  const date = new Date(brief.created_at).toLocaleDateString('fr', { day: 'numeric', month: 'short' })

  const statusIcon = brief.status === 'submitted'
    ? <CheckCircle2 className="size-3.5 text-green-500 shrink-0" />
    : brief.status === 'expired'
    ? <AlertCircle className="size-3.5 text-red-500 shrink-0" />
    : null

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden',
      brief.status === 'started' ? 'border-amber-200' : 'border-border'
    )}>
      <button
        onClick={() => brief.status === 'started' || brief.status === 'active'
          ? router.push(`/dashboard/brief/${brief.id}`)
          : setOpen(o => !o)
        }
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={cn(
            'text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0',
            DIFFICULTY_COLOR[prompt.difficulty] ?? 'text-muted-foreground bg-muted'
          )}>
            {prompt.difficulty}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{parsed?.title ?? 'Brief'}</p>
            <p className="text-[11px] font-mono text-muted-foreground">
              {prompt.domain} · {prompt.type} · {prompt.duration}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {brief.status === 'started' && brief.deadline_at
            ? <CountdownTimer deadline={brief.deadline_at} compact />
            : (
              <>
                {statusIcon}
                <span className="text-[11px] font-mono text-muted-foreground">{date}</span>
              </>
            )
          }
          {brief.status !== 'started' && brief.status !== 'active' && (
            open ? <ChevronUp className="size-3.5 text-muted-foreground" /> : <ChevronDown className="size-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {open && parsed && (
        <div className="border-t border-border divide-y divide-border bg-muted/20">
          {[
            { label: 'Contexte', value: parsed.context },
            { label: 'Objectif', value: parsed.objective },
            { label: 'Livrable', value: parsed.deliverable },
            { label: 'Contraintes', value: parsed.constraints },
            { label: 'Évaluation', value: parsed.evaluation },
          ].map(s => (
            <div key={s.label} className="px-4 py-3 grid md:grid-cols-[120px_1fr] gap-1">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest pt-0.5">{s.label}</p>
              <p className="text-xs text-foreground leading-relaxed">{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────

export function BriefClient() {
  const [domain, setDomain]         = useState('Web')
  const [type, setType]             = useState('UI')
  const [difficulty, setDifficulty] = useState('Rising')
  const [duration, setDuration]     = useState('3 heures')

  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [brief, setBrief]           = useState<BriefData | null>(null)
  const [briefId, setBriefId]       = useState<string | null>(null)

  const [savedBriefs, setSavedBriefs] = useState<SavedBrief[]>([])
  const [monthCount, setMonthCount]   = useState(0)
  const [isPro, setIsPro]             = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    fetch('/api/ai/brief/history')
      .then(r => r.json())
      .then(d => {
        setSavedBriefs(d.briefs ?? [])
        setMonthCount(d.monthCount ?? 0)
        setIsPro(d.isPro ?? false)
        setLoadingHistory(false)
      })
      .catch(() => setLoadingHistory(false))
  }, [brief])

  async function generate() {
    setLoading(true)
    setError(null)
    setBrief(null)

    const res = await fetch('/api/ai/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, type, difficulty, duration }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erreur inconnue')
    } else {
      setBrief(data.brief)
      setBriefId(data.id)
    }
    setLoading(false)
  }

  const canGenerate = isPro || monthCount < 3

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-10">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h1 className="text-2xl font-bold">Random Brief</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Génère un brief design sur-mesure avec l'IA et entraîne-toi à tout moment.
        </p>
      </div>

      {/* Generator */}
      <section className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">

          <SelectField label="Domaine"   options={DOMAINS}      value={domain}     onChange={setDomain} />
          <SelectField label="Type"      options={TYPES}        value={type}       onChange={setType} />
          <SelectField label="Difficulté"options={DIFFICULTIES} value={difficulty} onChange={setDifficulty} />
          <SelectField label="Durée"     options={DURATIONS}    value={duration}   onChange={setDuration} />

          <div className="flex items-center justify-between pt-2 border-t border-border">
            {!isPro && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                <Clock className="size-3" />
                {monthCount}/3 briefs ce mois
                {monthCount >= 3 && (
                  <span className="ml-1 flex items-center gap-1 text-destructive">
                    <Lock className="size-3" /> Limite atteinte
                  </span>
                )}
              </span>
            )}
            {isPro && (
              <span className="text-xs font-mono text-muted-foreground">Illimité · Pro</span>
            )}

            <button
              onClick={generate}
              disabled={loading || !canGenerate}
              className={cn(
                'flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all',
                canGenerate
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
              )}
            >
              {loading ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  Génération…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Générer mon brief
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive font-mono">
            {error}
          </div>
        )}

        {/* Generated brief */}
        {brief && briefId && (
          <BriefCard brief={brief} briefId={briefId} onReset={() => { setBrief(null); setBriefId(null) }} />
        )}
      </section>

      {/* History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Mes briefs</h2>
          {!isPro && (
            <span className="text-xs font-mono text-muted-foreground border border-border px-3 py-1 rounded-full">
              {monthCount}/3 ce mois
            </span>
          )}
        </div>

        {loadingHistory ? (
          <div className="text-sm text-muted-foreground font-mono">Chargement…</div>
        ) : savedBriefs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground font-mono">
            Aucun brief généré. Lance ta première session ci-dessus.
          </div>
        ) : (
          <div className="space-y-2">
            {savedBriefs.map(b => (
              <SavedBriefRow key={b.id} brief={b} />
            ))}
          </div>
        )}

        {!isPro && monthCount >= 3 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Limite mensuelle atteinte</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Passe en Pro pour générer des briefs illimités et débloquer tous les avantages.
              </p>
            </div>
            <button className="shrink-0 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
              Passer Pro
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
