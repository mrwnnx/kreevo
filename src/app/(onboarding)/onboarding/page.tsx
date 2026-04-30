'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ProgressBar } from '@/components/onboarding/ProgressBar'
import { Step1BasicInfo } from '@/components/onboarding/Step1BasicInfo'
import { Step2Specialty } from '@/components/onboarding/Step2Specialty'
import { Step3Objectives } from '@/components/onboarding/Step3Objectives'
import { Step4Social } from '@/components/onboarding/Step4Social'
import { Step5Photo } from '@/components/onboarding/Step5Photo'
import { Step6Location } from '@/components/onboarding/Step6Location'
import { CompletionModal } from '@/components/onboarding/CompletionModal'
import { TOTAL_STEPS } from '@/components/onboarding/types'
import type {
  ExperienceLevel,
  Objective,
  OnboardingData,
  Specialty,
} from '@/components/onboarding/types'

type Direction = 'forward' | 'back'

const initialData: OnboardingData = {
  firstName: '',
  lastName: '',
  specialty: '',
  tools: [],
  experienceLevel: '',
  objectives: [],
  behanceUrl: '',
  linkedinUrl: '',
  avatarUrl: '',
  country: '',
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<Direction>('forward')
  const [data, setData] = useState<OnboardingData>(initialData)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch('/api/me/profile', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        const p = res?.profile
        if (p) {
          setData((prev) => ({
            ...prev,
            firstName: p.first_name ?? '',
            lastName: p.last_name ?? '',
            specialty: (p.specialty as Specialty) ?? '',
            tools: p.tools ?? [],
            experienceLevel: (p.experience_level as ExperienceLevel) ?? '',
            objectives: (p.objectives ?? []) as Objective[],
            behanceUrl: p.behance_url ?? '',
            linkedinUrl: p.linkedin_url ?? '',
            avatarUrl: p.avatar_url ?? '',
            country: p.country ?? '',
          }))
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const persist = async (patch: Record<string, unknown>) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error ?? 'Failed to save')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
      throw e
    } finally {
      setSaving(false)
    }
  }

  const goNext = () => {
    setDirection('forward')
    setStep((s) => Math.min(6, s + 1))
  }

  const goBack = () => {
    setDirection('back')
    setStep((s) => Math.max(1, s - 1))
  }

  const handleStep1 = async (v: { firstName: string; lastName: string }) => {
    setData((d) => ({ ...d, ...v }))
    try {
      await persist({ first_name: v.firstName, last_name: v.lastName })
      goNext()
    } catch {}
  }

  const handleStep2 = async (v: {
    specialty: Specialty
    tools: string[]
    experienceLevel: ExperienceLevel
  }) => {
    setData((d) => ({ ...d, ...v }))
    try {
      await persist({
        specialty: v.specialty,
        tools: v.tools,
        experience_level: v.experienceLevel || null,
      })
      goNext()
    } catch {}
  }

  const handleStep3 = async (v: { objectives: Objective[] }) => {
    setData((d) => ({ ...d, ...v }))
    try {
      await persist({ objectives: v.objectives })
      goNext()
    } catch {}
  }

  const handleStep4 = async (v: { behanceUrl: string; linkedinUrl: string }) => {
    setData((d) => ({ ...d, ...v }))
    try {
      await persist({ behance_url: v.behanceUrl || null, linkedin_url: v.linkedinUrl || null })
      goNext()
    } catch {}
  }

  const handleStep5 = async (v: { avatarUrl: string }) => {
    setData((d) => ({ ...d, ...v }))
    try {
      if (v.avatarUrl) await persist({ avatar_url: v.avatarUrl })
      goNext()
    } catch {}
  }

  const handleStep6 = async (v: { country: string }) => {
    setData((d) => ({ ...d, ...v }))
    try {
      await persist({
        country: v.country || null,
        onboarding_completed: true,
      })
      setDone(true)
    } catch {}
  }

  const skipStep4 = () => {
    setDirection('forward')
    goNext()
  }

  const skipStep5 = () => {
    setDirection('forward')
    goNext()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-5 max-w-screen-xl mx-auto w-full">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-foreground justify-self-start"
        >
          kreevo
        </Link>
        <div className="justify-self-center">
          <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />
        </div>
        <div className="justify-self-end flex items-center gap-2 text-sm">
          <span className="text-muted-foreground hidden sm:inline">Already have an account?</span>
          <Link
            href="/login"
            className="font-medium text-foreground hover:opacity-80 underline underline-offset-4"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[480px] relative">
        {error && (
          <div className="mb-4 rounded-[var(--radius-card)] border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {!loaded ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
        <div key={step} className={direction === 'forward' ? 'onb-slide-fwd' : 'onb-slide-back'}>
          {step === 1 && (
            <Step1BasicInfo
              firstName={data.firstName}
              lastName={data.lastName}
              onNext={handleStep1}
              saving={saving}
            />
          )}
          {step === 2 && (
            <Step2Specialty
              specialty={data.specialty}
              tools={data.tools}
              experienceLevel={data.experienceLevel}
              onNext={handleStep2}
              onBack={goBack}
              saving={saving}
            />
          )}
          {step === 3 && (
            <Step3Objectives
              objectives={data.objectives}
              onNext={handleStep3}
              onBack={goBack}
              saving={saving}
            />
          )}
          {step === 4 && (
            <Step4Social
              behanceUrl={data.behanceUrl}
              linkedinUrl={data.linkedinUrl}
              onNext={handleStep4}
              onBack={goBack}
              onSkip={skipStep4}
              saving={saving}
            />
          )}
          {step === 5 && (
            <Step5Photo
              avatarUrl={data.avatarUrl}
              onNext={handleStep5}
              onBack={goBack}
              onSkip={skipStep5}
              saving={saving}
            />
          )}
          {step === 6 && (
            <Step6Location
              country={data.country}
              onNext={handleStep6}
              onBack={goBack}
              saving={saving}
            />
          )}
        </div>
        )}
        </div>
      </main>

      {done && (
        <CompletionModal
          firstName={data.firstName || 'designer'}
          onStart={() => router.push('/dashboard')}
        />
      )}

      <style jsx global>{`
        .onb-slide-fwd {
          animation: onbSlideFwd 0.25s ease-in-out;
        }
        .onb-slide-back {
          animation: onbSlideBack 0.25s ease-in-out;
        }
        @keyframes onbSlideFwd {
          from {
            transform: translateX(40px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes onbSlideBack {
          from {
            transform: translateX(-40px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
