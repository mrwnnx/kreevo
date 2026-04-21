'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Trash2, Ban } from 'lucide-react'
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

export default function AdminModeration() {
  const [tab, setTab] = useState<'comments' | 'submissions'>('comments')
  const [comments, setComments] = useState<ReportedComment[]>([])
  const [submissions, setSubmissions] = useState<ReportedSubmission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [cr, sr] = await Promise.all([
      fetch('/api/admin/moderation?type=comments').then(r => r.json()),
      fetch('/api/admin/moderation?type=submissions').then(r => r.json()),
    ])
    setComments(cr.items ?? [])
    setSubmissions(sr.items ?? [])
    setLoading(false)
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
      <div className="flex gap-1 border-b border-border">
        {[
          { key: 'comments', label: `Commentaires (${comments.length})` },
          { key: 'submissions', label: `Soumissions (${submissions.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={cn('px-4 py-2 text-sm font-medium transition-colors',
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
