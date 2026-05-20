'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HelpLang } from '@/lib/help/lang'

interface Props {
  lang: HelpLang
}

const SUBJECTS = [
  { value: 'bug', fr: 'Bug technique', en: 'Technical bug' },
  { value: 'billing', fr: 'Question facturation', en: 'Billing question' },
  { value: 'suggestion', fr: 'Suggestion', en: 'Suggestion' },
  { value: 'other', fr: 'Autre', en: 'Other' },
] as const

const T = {
  fr: {
    name: 'Nom',
    email: 'Email',
    subject: 'Sujet',
    selectSubject: '— Choisis un sujet —',
    message: 'Message',
    messagePlaceholder: 'Décris ton problème ou ta question…',
    submit: 'Envoyer le message',
    submitting: 'Envoi…',
    success: 'Ton message est envoyé ! On te répond sous 24h.',
    error: 'Erreur lors de l\'envoi. Réessaie ou écris à kreevodesign@gmail.com.',
    minMsg: 'Au moins 10 caractères.',
  },
  en: {
    name: 'Name',
    email: 'Email',
    subject: 'Subject',
    selectSubject: '— Pick a subject —',
    message: 'Message',
    messagePlaceholder: 'Describe your issue or question…',
    submit: 'Send message',
    submitting: 'Sending…',
    success: 'Your message was sent! We\'ll reply within 24 hours.',
    error: 'Send failed. Try again or write to kreevodesign@gmail.com.',
    minMsg: 'At least 10 characters.',
  },
} as const

export function ContactForm({ lang }: Props) {
  const t = T[lang]
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const labelCls = 'block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5'
  const inputCls = 'w-full h-10 rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 py-1 text-base md:text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/help/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          website, // honeypot — must stay empty
          lang,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error ?? t.error)
        return
      }
      setStatus('success')
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch {
      setStatus('error')
      setErrorMsg(t.error)
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/20 p-6 text-center space-y-3">
        <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300">{t.success}</p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="text-xs text-emerald-700 dark:text-emerald-400 underline"
        >
          {lang === 'en' ? 'Send another message' : 'Envoyer un autre message'}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Honeypot — hidden from users, bots fill it */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="absolute left-[-9999px] w-0 h-0 opacity-0"
        aria-hidden="true"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className={labelCls}>
            {t.name} *
          </label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className={labelCls}>
            {t.email} *
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className={labelCls}>
          {t.subject} *
        </label>
        <select
          id="contact-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className={inputCls}
        >
          <option value="">{t.selectSubject}</option>
          {SUBJECTS.map((s) => (
            <option key={s.value} value={s.value}>
              {lang === 'en' ? s.en : s.fr}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className={labelCls}>
          {t.message} *
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.messagePlaceholder}
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          className={cn(inputCls, 'h-auto py-2 resize-y min-h-[140px]')}
        />
        <p className="text-xs text-muted-foreground mt-1">{t.minMsg}</p>
      </div>

      {status === 'error' && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-800/40 dark:bg-rose-950/20 p-3 text-sm text-rose-800 dark:text-rose-300">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{errorMsg || t.error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-6 py-3 rounded-full hover:opacity-85 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
      >
        {status === 'submitting' && <Loader2 className="size-4 animate-spin" />}
        {status === 'submitting' ? t.submitting : t.submit}
      </button>
    </form>
  )
}
