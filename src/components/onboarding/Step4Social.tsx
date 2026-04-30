'use client'

import { useState } from 'react'
import { StepHeader } from './StepHeader'

interface Step4Props {
  behanceUrl: string
  linkedinUrl: string
  onNext: (data: { behanceUrl: string; linkedinUrl: string }) => void
  onBack: () => void
  onSkip: () => void
  saving?: boolean
}

const isValidUrl = (v: string) => v.length === 0 || v.trim().toLowerCase().startsWith('https://')

export function Step4Social({ behanceUrl, linkedinUrl, onNext, onBack, onSkip, saving }: Step4Props) {
  const [behance, setBehance] = useState(behanceUrl)
  const [linkedin, setLinkedin] = useState(linkedinUrl)
  const [behanceError, setBehanceError] = useState<string | null>(null)
  const [linkedinError, setLinkedinError] = useState<string | null>(null)

  const submit = () => {
    let ok = true
    if (!isValidUrl(behance)) {
      setBehanceError('Please enter a valid URL (https://...)')
      ok = false
    }
    if (!isValidUrl(linkedin)) {
      setLinkedinError('Please enter a valid URL (https://...)')
      ok = false
    }
    if (!ok) return
    onNext({ behanceUrl: behance.trim(), linkedinUrl: linkedin.trim() })
  }

  const inputCls = (err: string | null) =>
    `w-full h-12 pl-11 pr-4 text-sm rounded-xl border bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition ${
      err
        ? 'border-red-400 focus:ring-red-200'
        : 'border-zinc-200 focus:ring-violet-200 focus:border-violet-500'
    }`

  return (
    <div>
      <StepHeader
        title="Connect your portfolio 🔗"
        subtitle="Let others discover your work and build your reputation."
      />

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Behance</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 size-6 rounded bg-[#1769FF] text-white text-[10px] font-bold flex items-center justify-center">
              Bē
            </span>
            <input
              type="url"
              value={behance}
              onChange={(e) => {
                setBehance(e.target.value)
                if (behanceError) setBehanceError(null)
              }}
              onBlur={() => {
                if (!isValidUrl(behance)) setBehanceError('Please enter a valid URL (https://...)')
              }}
              placeholder="https://behance.net/username"
              className={inputCls(behanceError)}
            />
          </div>
          {behanceError ? (
            <p className="text-xs text-red-500 mt-1.5">{behanceError}</p>
          ) : (
            <p className="text-xs text-zinc-400 mt-1.5">Your Behance profile URL</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">LinkedIn</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 size-6 rounded bg-[#0A66C2] text-white flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.37V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.21 24 24 23.23 24 22.28V1.72C24 .77 23.21 0 22.22 0z" />
              </svg>
            </span>
            <input
              type="url"
              value={linkedin}
              onChange={(e) => {
                setLinkedin(e.target.value)
                if (linkedinError) setLinkedinError(null)
              }}
              onBlur={() => {
                if (!isValidUrl(linkedin))
                  setLinkedinError('Please enter a valid URL (https://...)')
              }}
              placeholder="https://linkedin.com/in/username"
              className={inputCls(linkedinError)}
            />
          </div>
          {linkedinError ? (
            <p className="text-xs text-red-500 mt-1.5">{linkedinError}</p>
          ) : (
            <p className="text-xs text-zinc-400 mt-1.5">Your LinkedIn profile URL</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          type="button"
          onClick={onBack}
          className="h-12 px-5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="flex-1 h-12 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Continue →'}
        </button>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="mx-auto block mt-4 text-sm text-zinc-500 hover:text-zinc-700 underline underline-offset-4"
      >
        Skip for now →
      </button>
    </div>
  )
}
