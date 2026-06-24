'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { joinWaitlist } from '@/app/(public)/hire/actions'

/**
 * HireWaitlistCta — bouton « Je veux recruter » qui ouvre un popup waitlist :
 * rappelle que la feature arrive bientôt + champ email → server action joinWaitlist.
 * Modal custom (portal + overlay + Escape + click-outside), pas de Dialog shadcn.
 */

type T = {
  recruiterCta: string
  waitlistTitle: string
  waitlistBody: string
  waitlistEmailPlaceholder: string
  waitlistJoin: string
  waitlistJoining: string
  waitlistSuccess: string
  waitlistInvalid: string
}

export function HireWaitlistCta({ t }: { t: T }) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  function openModal() {
    setEmail('')
    setStatus('idle')
    setErrorMsg('')
    setOpen(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')
    const res = await joinWaitlist(email)
    if (res.ok) {
      setStatus('success')
    } else {
      setStatus('error')
      setErrorMsg(res.error === 'invalid' ? t.waitlistInvalid : res.error || t.waitlistInvalid)
    }
  }

  return (
    <>
      <Button size="lg" className="h-[50px] text-base" onClick={openModal}>
        {t.recruiterCta}
      </Button>

      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div
              aria-hidden
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/40 supports-backdrop-filter:backdrop-blur-sm"
            />
            <div className="relative z-10 w-full max-w-md rounded-[24px] border border-border bg-card p-6 text-center shadow-xl sm:p-8">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="absolute end-4 top-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>

              <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground">{t.waitlistTitle}</h3>

              {status === 'success' ? (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <CheckCircle2 className="size-8 text-emerald-500" />
                  <p className="text-sm leading-relaxed text-foreground">{t.waitlistSuccess}</p>
                </div>
              ) : (
                <>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{t.waitlistBody}</p>
                  <form onSubmit={submit} className="mt-5 flex flex-col gap-2">
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.waitlistEmailPlaceholder}
                      className="h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                    {status === 'error' && <p className="text-xs text-destructive">{errorMsg}</p>}
                    <Button type="submit" size="lg" className="h-[50px] w-full text-base" disabled={status === 'sending'}>
                      {status === 'sending' ? t.waitlistJoining : t.waitlistJoin}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
