'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ProgressBar } from '@/components/onboarding/ProgressBar'
import { Step1BasicInfo } from '@/components/onboarding/Step1BasicInfo'
import { Step2JobTitle } from '@/components/onboarding/Step2JobTitle'
import { StepSpecialty } from '@/components/onboarding/StepSpecialty'
import { Step3Tools } from '@/components/onboarding/Step3Tools'
import { Step4Objectives } from '@/components/onboarding/Step4Objectives'
import { Step5Social } from '@/components/onboarding/Step5Social'
import { Step6Photo } from '@/components/onboarding/Step6Photo'
import { Step7Location } from '@/components/onboarding/Step7Location'
import { CompletionModal } from '@/components/onboarding/CompletionModal'
import { TOTAL_STEPS } from '@/components/onboarding/types'
import type {
  ExperienceLevel,
  Objective,
  OnboardingData,
  Specialty,
  SpecialtyOption,
} from '@/components/onboarding/types'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type OnbT = Dictionary['onboarding']
type Direction = 'forward' | 'back'

const initialData: OnboardingData = {
  firstName: '',
  lastName: '',
  jobTitle: '',
  specialty: '',
  tools: [],
  experienceLevel: '',
  objectives: [],
  links: {},
  avatarUrl: '',
  country: '',
}

interface OnboardingClientProps {
  t: OnbT
  specialties: SpecialtyOption[]
}

export function OnboardingClient({ t, specialties }: OnboardingClientProps) {
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
          const mergedLinks: Record<string, string> = {}
          if (p.links && typeof p.links === 'object') {
            for (const [k, v] of Object.entries(p.links)) {
              if (typeof v === 'string' && v) mergedLinks[k] = v
            }
          }
          if (p.behance_url && !mergedLinks.behance) mergedLinks.behance = p.behance_url
          if (p.linkedin_url && !mergedLinks.linkedin) mergedLinks.linkedin = p.linkedin_url

          setData((prev) => ({
            ...prev,
            firstName: p.first_name ?? '',
            lastName: p.last_name ?? '',
            jobTitle: p.job_title ?? '',
            specialty: (p.specialty as Specialty) ?? '',
            tools: p.tools ?? [],
            experienceLevel: (p.experience_level as ExperienceLevel) ?? '',
            objectives: (p.objectives ?? []) as Objective[],
            links: mergedLinks,
            avatarUrl: p.avatar_url ?? '',
            country: p.country ?? '',
          }))

          // PHASE 5 — user déjà onboardé mais SANS specialty_id (legacy NULL) :
          // on le pose directement au step Spécialité (8) sans refaire les 8 steps
          // ni écraser ses données déjà remplies (le merge ci-dessus les conserve).
          if (p.onboarding_completed && !p.specialty_id) {
            setStep(TOTAL_STEPS)
          }
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
        throw new Error(j?.error ?? t.common.saveError)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.common.saveError)
      throw e
    } finally {
      setSaving(false)
    }
  }

  const goNext = () => {
    setDirection('forward')
    setStep((s) => Math.min(TOTAL_STEPS, s + 1))
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

  const handleStep2 = async (v: { jobTitle: string; experienceLevel: ExperienceLevel }) => {
    setData((d) => ({ ...d, ...v }))
    try {
      await persist({
        job_title: v.jobTitle || null,
        experience_level: v.experienceLevel || null,
      })
      goNext()
    } catch {}
  }

  // PHASE 5 — on persiste la FK specialty_id (+ le slug texte, gardé jusqu'à PHASE 7).
  const handleSpecialty = async (v: { specialtyId: string; specialty: string }) => {
    setData((d) => ({ ...d, specialty: v.specialty as Specialty }))
    try {
      await persist({ specialty_id: v.specialtyId, specialty: v.specialty, onboarding_completed: true })
      setDone(true)
    } catch {}
  }

  const handleTools = async (v: { tools: string[] }) => {
    setData((d) => ({ ...d, ...v }))
    try {
      await persist({ tools: v.tools })
      goNext()
    } catch {}
  }

  const handleObjectives = async (v: { objectives: Objective[] }) => {
    setData((d) => ({ ...d, ...v }))
    try {
      await persist({ objectives: v.objectives })
      goNext()
    } catch {}
  }

  const handleSocial = async (v: { links: Record<string, string> }) => {
    setData((d) => ({ ...d, ...v }))
    try {
      await persist({
        links: v.links,
        behance_url: v.links.behance ?? null,
        linkedin_url: v.links.linkedin ?? null,
      })
      goNext()
    } catch {}
  }

  const handlePhoto = async (v: { avatarUrl: string }) => {
    setData((d) => ({ ...d, ...v }))
    try {
      if (v.avatarUrl) await persist({ avatar_url: v.avatarUrl })
      goNext()
    } catch {}
  }

  const handleLocation = async (v: { country: string }) => {
    setData((d) => ({ ...d, ...v }))
    try {
      await persist({ country: v.country || null })
      goNext()
    } catch {}
  }

  const skipForward = () => {
    setDirection('forward')
    goNext()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-6 py-5 max-w-screen-xl mx-auto w-full">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-foreground"
        >
          kreevo
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground hidden sm:inline">{t.header.alreadyAccount}</span>
          <Link
            href="/login"
            className="font-medium text-foreground hover:opacity-80 underline underline-offset-4"
          >
            {t.header.signIn}
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 pt-[84px] pb-12">
        <div className="w-full max-w-[480px] relative">
        <div className="mb-6 flex justify-center">
          <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />
        </div>
        {error && (
          <div className="mb-4 rounded-[var(--radius-card)] border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {!loaded ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            {t.common.loading}
          </div>
        ) : (
        <div key={step} className={direction === 'forward' ? 'onb-slide-fwd' : 'onb-slide-back'}>
          {step === 1 && (
            <Step1BasicInfo
              firstName={data.firstName}
              lastName={data.lastName}
              onNext={handleStep1}
              saving={saving}
              t={t.step1}
              tc={t.common}
            />
          )}
          {step === 2 && (
            <Step2JobTitle
              jobTitle={data.jobTitle}
              experienceLevel={data.experienceLevel}
              onNext={handleStep2}
              onBack={goBack}
              saving={saving}
              t={t.step2}
              tc={t.common}
            />
          )}
          {step === 3 && (
            <Step3Tools
              specialty={data.specialty}
              tools={data.tools}
              onNext={handleTools}
              onBack={goBack}
              saving={saving}
              t={t.step3}
              tc={t.common}
            />
          )}
          {step === 4 && (
            <Step4Objectives
              objectives={data.objectives}
              onNext={handleObjectives}
              onBack={goBack}
              saving={saving}
              t={t.step4}
              tc={t.common}
            />
          )}
          {step === 5 && (
            <Step5Social
              specialty={data.specialty}
              links={data.links}
              onNext={handleSocial}
              onBack={goBack}
              onSkip={skipForward}
              saving={saving}
              t={t.step5}
              tc={t.common}
            />
          )}
          {step === 6 && (
            <Step6Photo
              avatarUrl={data.avatarUrl}
              onNext={handlePhoto}
              onBack={goBack}
              onSkip={skipForward}
              saving={saving}
              t={t.step6}
              tc={t.common}
            />
          )}
          {step === 7 && (
            <Step7Location
              country={data.country}
              onNext={handleLocation}
              onBack={goBack}
              saving={saving}
              t={t.step7}
              tc={t.common}
            />
          )}
          {step === 8 && (
            <StepSpecialty
              specialty={data.specialty}
              specialties={specialties}
              onNext={handleSpecialty}
              onBack={goBack}
              saving={saving}
              t={t.specialty}
              tc={t.common}
            />
          )}
        </div>
        )}
        </div>
      </main>

      {done && (
        <CompletionModal
          firstName={data.firstName || t.completion.defaultName}
          onStart={() => router.push('/dashboard')}
          t={t.completion}
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
