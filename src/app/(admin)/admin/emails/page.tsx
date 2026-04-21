'use client'

import { useState } from 'react'
import { Send, Loader2, Search } from 'lucide-react'

const RECIPIENT_OPTIONS = [
  { value: 'all', label: 'Tous les users' },
  { value: 'free', label: 'Free uniquement' },
  { value: 'pro', label: 'Pro uniquement' },
  { value: 'specific', label: 'Un user spécifique' },
]

export default function AdminEmails() {
  const [recipients, setRecipients] = useState('all')
  const [specificUser, setSpecificUser] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  async function handleSend() {
    if (!confirmed) { setConfirmed(true); return }
    setSending(true)
    setSuccess(null)
    setError(null)

    const res = await fetch('/api/admin/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipients, specificUser, subject, content }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erreur lors de l\'envoi')
    } else {
      setSuccess(`Email envoyé à ${data.sent ?? 0} destinataire(s)`)
      setSubject('')
      setContent('')
      setConfirmed(false)
    }
    setSending(false)
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Emails</h1>
        <p className="text-sm text-muted-foreground">Envoyer des emails manuels via Resend</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        {/* Recipients */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Destinataires</label>
          <div className="flex flex-wrap gap-2">
            {RECIPIENT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setRecipients(opt.value); setConfirmed(false) }}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                  recipients === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {recipients === 'specific' && (
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                value={specificUser}
                onChange={e => setSpecificUser(e.target.value)}
                placeholder="Email ou username du user…"
                className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}
        </div>

        {/* Subject */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Sujet</label>
          <input
            value={subject}
            onChange={e => { setSubject(e.target.value); setConfirmed(false) }}
            placeholder="Objet de l'email"
            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Contenu</label>
          <textarea
            value={content}
            onChange={e => { setContent(e.target.value); setConfirmed(false) }}
            placeholder="Corps de l'email…"
            rows={8}
            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive font-mono bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-600 font-mono bg-green-50 border border-green-200 rounded-lg px-4 py-2">{success}</p>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-border">
          {confirmed ? (
            <>
              <p className="text-sm text-muted-foreground flex-1">
                Confirmer l'envoi à <strong>{RECIPIENT_OPTIONS.find(o => o.value === recipients)?.label}</strong> ?
              </p>
              <button onClick={() => setConfirmed(false)} className="text-sm text-muted-foreground px-4 py-2 hover:text-foreground">
                Annuler
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !subject.trim() || !content.trim()}
                className="flex items-center gap-2 bg-destructive text-destructive-foreground text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 disabled:opacity-60"
              >
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Confirmer l'envoi
              </button>
            </>
          ) : (
            <button
              onClick={handleSend}
              disabled={!subject.trim() || !content.trim()}
              className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 disabled:opacity-60"
            >
              <Send className="size-4" />
              Envoyer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
