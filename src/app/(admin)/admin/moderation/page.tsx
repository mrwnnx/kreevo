'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface ReportedComment {
  id: string
  content: string
  created_at: string
  profiles?: { username: string; avatar_url: string | null }
  submission?: { challenges?: { title: string } }
}

interface ReportedSubmission {
  id: string
  cover_url: string
  description: string | null
  created_at: string
  profiles?: { username: string; avatar_url: string | null }
  challenges?: { title: string }
}

interface HumanReviewSubmission {
  id: string
  title: string | null
  description: string | null
  cover_url: string | null
  created_at: string
  ai_rejection_count: number
  ai_analysis: {
    images?: Array<{ index: number; is_cover: boolean; valid: boolean; reason: string | null }>
  } | null
  profiles?: { username: string; avatar_url: string | null }
  challenges?: { title: string; brief: string | null }
}

export default function AdminModeration() {
  const [tab, setTab] = useState<'comments' | 'submissions' | 'human_review'>('comments')
  const [comments, setComments] = useState<ReportedComment[]>([])
  const [submissions, setSubmissions] = useState<ReportedSubmission[]>([])
  const [humanReview, setHumanReview] = useState<HumanReviewSubmission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [cr, sr, hr] = await Promise.all([
      fetch('/api/admin/moderation?type=comments').then(r => r.json()),
      fetch('/api/admin/moderation?type=submissions').then(r => r.json()),
      fetch('/api/admin/moderation?type=human_review').then(r => r.json()),
    ])
    setComments(cr.items ?? [])
    setSubmissions(sr.items ?? [])
    setHumanReview(hr.items ?? [])
    setLoading(false)
  }

  async function validate(id: string, action: 'approve' | 'reject', feedback = '') {
    const res = await fetch(`/api/admin/submissions/${id}/validate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, feedback }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Erreur')
      return
    }
    load()
  }

  async function act(id: string, type: string, action: 'ignore' | 'delete') {
    await fetch(`/api/admin/moderation/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, action }),
    })
    load()
  }

  async function suspend(userId: string) {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_suspended: true }),
    })
    load()
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Modération</h1>
        <p className="text-sm text-muted-foreground">
          {comments.length + submissions.length} éléments signalés
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {[
          { key: 'comments', label: `Commentaires (${comments.length})` },
          { key: 'submissions', label: `Soumissions (${submissions.length})` },
          { key: 'human_review', label: `Review humaine (${humanReview.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={cn('shrink-0 px-4 py-2 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : tab === 'comments' ? (
        <div className="space-y-3">
          {comments.length === 0 ? (
            <EmptyState text="Aucun commentaire signalé" />
          ) : comments.map(c => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Avatar className="size-7 rounded-md shrink-0">
                  <AvatarImage src={c.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback className="rounded-md text-[10px]">{c.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">@{c.profiles?.username}</span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString('fr')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-snug">{c.content}</p>
                </div>
              </div>
              <Actions
                onIgnore={() => act(c.id, 'comments', 'ignore')}
                onDelete={() => act(c.id, 'comments', 'delete')}
                onSuspend={c.profiles?.username ? undefined : undefined}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.length === 0 ? (
            <EmptyState text="Aucune soumission signalée" />
          ) : submissions.map(s => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-start gap-4">
                {s.cover_url && (
                  <img src={s.cover_url} alt="" className="size-20 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="size-5 rounded-md">
                      <AvatarImage src={s.profiles?.avatar_url ?? undefined} />
                      <AvatarFallback className="rounded-md text-[8px]">{s.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold">@{s.profiles?.username}</span>
                    <span className="text-[11px] font-mono text-muted-foreground">{new Date(s.created_at).toLocaleDateString('fr')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{s.challenges?.title}</p>
                  {s.description && <p className="text-sm mt-1">{s.description}</p>}
                </div>
              </div>
              <Actions
                onIgnore={() => act(s.id, 'submissions', 'ignore')}
                onDelete={() => act(s.id, 'submissions', 'delete')}
              />
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'human_review' && (
        <div className="space-y-3">
          {humanReview.length === 0 ? (
            <EmptyState text="Aucune soumission en attente de review humaine" />
          ) : humanReview.map(s => (
            <HumanReviewCard key={s.id} sub={s} onValidate={validate} />
          ))}
        </div>
      )}
    </div>
  )
}

function HumanReviewCard({
  sub,
  onValidate,
}: {
  sub: HumanReviewSubmission
  onValidate: (id: string, action: 'approve' | 'reject', feedback?: string) => Promise<void>
}) {
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const aiImages = sub.ai_analysis?.images ?? []

  async function handle(action: 'approve' | 'reject') {
    if (action === 'reject' && !feedback.trim()) {
      alert('Feedback obligatoire pour un rejet')
      return
    }
    setBusy(action)
    try { await onValidate(sub.id, action, feedback) } finally { setBusy(null) }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start gap-4">
        {sub.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sub.cover_url} alt="" className="size-24 rounded-lg object-cover shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Avatar className="size-5 rounded-md">
              <AvatarImage src={sub.profiles?.avatar_url ?? undefined} />
              <AvatarFallback className="rounded-md text-[8px]">{sub.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold">@{sub.profiles?.username}</span>
            <span className="text-[11px] font-mono text-muted-foreground">{new Date(sub.created_at).toLocaleDateString('fr')}</span>
            <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
              {sub.ai_rejection_count} rejets IA
            </span>
          </div>
          <p className="text-sm font-semibold">{sub.title ?? '(sans titre)'}</p>
          <p className="text-xs text-muted-foreground">{sub.challenges?.title}</p>
          {sub.description && (
            <p className="text-xs mt-2 leading-snug whitespace-pre-line">{sub.description}</p>
          )}
        </div>
      </div>

      {aiImages.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground font-mono uppercase tracking-widest">
            Verdict IA détail ({aiImages.filter(i => !i.valid).length}/{aiImages.length} rejetées)
          </summary>
          <ul className="mt-2 space-y-1">
            {aiImages.map(img => (
              <li key={img.index} className="flex items-start gap-2">
                <span className={cn('font-mono text-[10px] px-1.5 py-0.5 rounded-full shrink-0', img.valid ? 'bg-emerald-500/15 text-emerald-700' : 'bg-red-500/15 text-red-700')}>
                  {img.is_cover ? 'cover' : `#${img.index + 1}`} {img.valid ? '✓' : '✗'}
                </span>
                {img.reason && <span className="text-muted-foreground">{img.reason}</span>}
              </li>
            ))}
          </ul>
        </details>
      )}

      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Feedback (obligatoire si rejet)…"
        rows={2}
        className="w-full rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 p-2 text-base md:text-sm placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={() => handle('approve')}
          disabled={busy !== null}
          className="flex items-center gap-1.5 text-xs font-mono text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <CheckCircle className="size-3.5" /> {busy === 'approve' ? '…' : 'Valider'}
        </button>
        <button
          onClick={() => handle('reject')}
          disabled={busy !== null}
          className="flex items-center gap-1.5 text-xs font-mono text-destructive bg-destructive/5 hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <Trash2 className="size-3.5" /> {busy === 'reject' ? '…' : 'Rejeter'}
        </button>
      </div>
    </div>
  )
}

function Actions({ onIgnore, onDelete }: { onIgnore: () => void; onDelete: () => void; onSuspend?: () => void }) {
  return (
    <div className="flex items-center gap-2 pt-2 border-t border-border">
      <button onClick={onIgnore}
        className="flex items-center gap-1.5 text-xs font-mono text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
        <CheckCircle className="size-3.5" /> Ignorer
      </button>
      <button onClick={onDelete}
        className="flex items-center gap-1.5 text-xs font-mono text-destructive bg-destructive/5 hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors">
        <Trash2 className="size-3.5" /> Supprimer
      </button>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}
