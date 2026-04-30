'use client'

import { useEffect, useRef, useState } from 'react'
import { StepHeader } from './StepHeader'

interface Step1Props {
  firstName: string
  lastName: string
  onNext: (data: { firstName: string; lastName: string }) => void
  saving?: boolean
}

export function Step1BasicInfo({ firstName, lastName, onNext, saving }: Step1Props) {
  const [first, setFirst] = useState(firstName)
  const [last, setLast] = useState(lastName)
  const [firstError, setFirstError] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const firstRef = useRef<HTMLInputElement>(null)
  const lastRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstRef.current?.focus()
  }, [])

  const canSubmit = first.trim().length > 0 && last.trim().length > 0 && !saving

  const validate = () => {
    let ok = true
    if (!first.trim()) {
      setFirstError('Please enter your first name')
      ok = false
    }
    if (!last.trim()) {
      setLastError('Please enter your last name')
      ok = false
    }
    return ok
  }

  const submit = () => {
    if (!validate()) return
    onNext({ firstName: first.trim(), lastName: last.trim() })
  }

  return (
    <div>
      <StepHeader
        title="Let's get started 👋"
        subtitle="Tell us your name to personalize your experience."
      />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">First Name</label>
          <input
            ref={firstRef}
            type="text"
            value={first}
            onChange={(e) => {
              setFirst(e.target.value)
              if (firstError) setFirstError(null)
            }}
            onBlur={() => {
              if (!first.trim()) setFirstError('Please enter your first name')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                lastRef.current?.focus()
              }
            }}
            placeholder="e.g. Sara"
            className={`w-full h-12 px-4 text-sm rounded-xl border bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition ${
              firstError
                ? 'border-red-400 focus:ring-red-200'
                : 'border-zinc-200 focus:ring-violet-200 focus:border-violet-500'
            }`}
          />
          {firstError && <p className="text-xs text-red-500 mt-1.5">{firstError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Last Name</label>
          <input
            ref={lastRef}
            type="text"
            value={last}
            onChange={(e) => {
              setLast(e.target.value)
              if (lastError) setLastError(null)
            }}
            onBlur={() => {
              if (!last.trim()) setLastError('Please enter your last name')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="e.g. Essalah"
            className={`w-full h-12 px-4 text-sm rounded-xl border bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition ${
              lastError
                ? 'border-red-400 focus:ring-red-200'
                : 'border-zinc-200 focus:ring-violet-200 focus:border-violet-500'
            }`}
          />
          {lastError && <p className="text-xs text-red-500 mt-1.5">{lastError}</p>}
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="w-full h-12 mt-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {saving ? 'Saving…' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}
