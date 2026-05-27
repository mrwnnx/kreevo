'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { submitChallenge } from './actions'
import type { Submission } from '@/types/database.types'
import { CheckCircle, X, Loader2, ArrowLeft, ArrowRight, Sparkles, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tx } from '@/lib/i18n/tx'
import { HUMAN_REVIEW_THRESHOLD } from '@/lib/utils/submission-constants'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type SubmitT = Dictionary['submitForm']

interface Props {
  challengeId: string
  challengeTitle: string
  participationId: string
  attemptsLeft: number
  existing: Submission | null
  t: SubmitT
}

export function MultiStepSubmitForm({
  challengeId,
  challengeTitle,
  participationId,
  attemptsLeft,
  existing,
  t,
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const existingFiles = (existing as any)?.files ?? {}

  // Step 1 — project details
  const [coverUrl, setCoverUrl] = useState<string | null>((existing as any)?.cover_url ?? null)
  const [title, setTitle] = useState<string>((existing as any)?.title ?? '')
  const [description, setDescription] = useState<string>((existing as any)?.description ?? '')
  const [projectLink, setProjectLink] = useState<string>(existingFiles?.link ?? '')
  const [showOnProfile, setShowOnProfile] = useState<boolean>(
    (existing as any)?.is_visible !== false
  )
  const [showMotivation, setShowMotivation] = useState(true)

  // Step 2 — photos (each with an optional caption).
  // Backward-compat: legacy files.images was string[] → normalize to { url, caption }.
  const [photos, setPhotos] = useState<{ url: string; caption: string }[]>(
    (Array.isArray(existingFiles?.images) ? existingFiles.images : [])
      .map((img: any) =>
        typeof img === 'string'
          ? { url: img, caption: '' }
          : { url: img?.url ?? '', caption: img?.caption ?? '' },
      )
      .filter((p: { url: string }) => p.url),
  )

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ draft: boolean; status?: 'approved' | 'rejected' | 'pending' | 'human_review'; bonusXp?: number } | null>(null)

  // AI multi-image analysis — runs SYNC at click "Publier" (BUG-20)
  type AnalysisVerdictImg = { index: number; is_cover: boolean; valid: boolean; reason: string | null }
  type AnalysisResult = {
    skipped: boolean
    global_valid: boolean
    rejected_count: number
    images: AnalysisVerdictImg[]
    description_bonus_eligible: boolean
    description_bonus_reason: string | null
  }
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [analyzeProgress, setAnalyzeProgress] = useState(0)

  // Source of truth lives in DB (submissions.ai_rejection_count). We snapshot
  // it once at mount; the publish action triggers a server-side increment +
  // router refresh, so the prop is refreshed on next render.
  const aiRejectionCount: number = ((existing as any)?.ai_rejection_count as number | null) ?? 0
  const canRequestHumanReview = aiRejectionCount >= HUMAN_REVIEW_THRESHOLD

  const MAX_PHOTOS = 7
  function addPhoto(url: string | null) {
    if (!url) return
    setPhotos(prev => (prev.length >= MAX_PHOTOS ? prev : [...prev, { url, caption: '' }]))
  }
  function removePhoto(idx: number) {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
  }
  function updateCaption(idx: number, caption: string) {
    setPhotos(prev => prev.map((p, i) => (i === idx ? { ...p, caption } : p)))
  }

  function canGoToStep2() {
    return !!coverUrl
  }

  /** Run sync analyze with a fake progress bar (asymptote at 90%, jump to 100% on response). */
  async function runAnalyze(): Promise<AnalysisResult | null> {
    if (!coverUrl) return null
    setAnalyzing(true)
    setAnalyzeProgress(0)

    // Asymptotic progress: each tick adds 5% of remaining-to-90 → reaches ~85% after 12s, never quite hits 90 (so the AI response feels deserved)
    const progressInterval = setInterval(() => {
      setAnalyzeProgress((p) => p + (90 - p) * 0.08)
    }, 250)

    try {
      const images = [
        { url: coverUrl, is_cover: true },
        ...photos.map((p) => ({ url: p.url, is_cover: false })),
      ]
      const res = await fetch('/api/submissions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: challengeId,
          title,
          description,
          images,
        }),
      })
      const data = await res.json()
      const result: AnalysisResult = {
        skipped: !!data.skipped,
        global_valid: !!data.global_valid,
        rejected_count: data.rejected_count ?? 0,
        images: data.images ?? [],
        description_bonus_eligible: !!data.description_bonus_eligible,
        description_bonus_reason: data.description_bonus_reason ?? null,
      }
      setAnalysisResult(result)
      setAnalyzeProgress(100)
      return result
    } catch {
      return null
    } finally {
      clearInterval(progressInterval)
      // Brief delay so the user perceives the bar reaching 100%
      setTimeout(() => { setAnalyzing(false); setAnalyzeProgress(0) }, 350)
    }
  }

  /** Click "Publier" — AI no longer gates: always publish, verdict drives XP only. */
  async function handlePublishClick() {
    if (!coverUrl) { setError('Image de couverture requise'); setStep(1); return }
    if (!title.trim()) { setError('Un titre est requis pour publier'); setStep(1); return }
    setError(null)

    // After N AI rejections on this same submission, the user can request a
    // human review instead of being analyzed yet again.
    if (canRequestHumanReview) {
      return submitForm({
        asDraft: false,
        aiVerdict: 'human_review',
        bonusEligible: false,
      })
    }

    const result = await runAnalyze()
    if (!result) {
      setError('Analyse IA indisponible — réessaye dans un instant.')
      return
    }
    if (result.global_valid) {
      // Matches the brief → approved + XP (+ optional description bonus)
      return submitForm({
        asDraft: false,
        aiVerdict: 'approved',
        bonusEligible: result.description_bonus_eligible,
        analysis: result,
      })
    }
    // Doesn't match the brief → still published, but no XP. User can resubmit / fix.
    const reason = result.images
      .filter((i) => !i.valid && i.reason)
      .map((i) => i.reason)
      .join(' · ')
    return submitForm({
      asDraft: false,
      aiVerdict: 'rejected',
      bonusEligible: false,
      analysis: result,
      rejectionReason: reason || null,
    })
  }

  async function handleSubmit(asDraft: boolean) {
    if (!coverUrl) {
      setError('Image de couverture requise')
      setStep(1)
      return
    }
    if (!asDraft && !title.trim()) {
      setError('Un titre est requis pour publier')
      setStep(1)
      return
    }
    setError(null)
    return submitForm({ asDraft, aiVerdict: null, bonusEligible: false })
  }

  function submitForm(opts: {
    asDraft: boolean
    aiVerdict: 'approved' | 'rejected' | 'skipped' | 'human_review' | null
    bonusEligible: boolean
    analysis?: AnalysisResult
    rejectionReason?: string | null
  }) {
    const { asDraft, aiVerdict, bonusEligible, analysis, rejectionReason } = opts
    const fd = new FormData()
    fd.set('challengeId', challengeId)
    fd.set('coverUrl', coverUrl!)
    fd.set('title', title)
    fd.set('description', description)
    fd.set('projectLink', projectLink)
    fd.set('participationId', participationId)
    fd.set('isDraft', asDraft ? 'true' : 'false')
    fd.set('isVisible', showOnProfile ? 'true' : 'false')
    fd.set('photos', JSON.stringify(photos))

    if (!asDraft && aiVerdict) {
      fd.set('aiVerdict', aiVerdict)
      fd.set('aiAnalysisBypassed', 'false')
      fd.set('descriptionBonusEligible', bonusEligible ? 'true' : 'false')
      if (analysis) fd.set('aiAnalysis', JSON.stringify(analysis))
      if (rejectionReason) fd.set('rejectionReason', rejectionReason)
    }

    startTransition(async () => {
      const result = await submitChallenge(fd)
      if (result?.error) {
        setError(result.error)
        return
      }

      const finalStatus = (result as any)?.status as 'approved' | 'pending' | 'human_review' | undefined
      setSuccess({ draft: !!result?.draft, status: finalStatus, bonusXp: (result as any)?.bonusXp })

      if (asDraft) return
      const delay = finalStatus === 'approved' ? 2000 : 600
      setTimeout(() => {
        router.push(`/dashboard/challenges/${challengeId}?just_submitted=${finalStatus ?? 'pending'}`)
      }, delay)
    })
  }

  if (success) {
    const isApproved = success.status === 'approved'
    const isRejected = success.status === 'rejected'
    const headline = success.draft
      ? t.success.draftSaved
      : isApproved ? t.success.approved
      : isRejected ? t.success.rejected
      : t.success.pending

    const sub = success.draft
      ? t.success.draftBody
      : isApproved ? t.success.approvedBody
      : isRejected ? t.success.rejectedBody
      : t.success.pendingBody

    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className={cn(
            'size-16 rounded-full mx-auto flex items-center justify-center',
            isRejected ? 'bg-red-100 dark:bg-red-900/40'
            : isApproved ? 'bg-green-100 dark:bg-green-900/40 animate-bounce'
            : 'bg-zinc-100 dark:bg-zinc-900/40',
          )}>
            {isRejected ? <X className="size-8 text-red-600 dark:text-red-400" />
            : <CheckCircle className="size-8 text-green-600 dark:text-green-400" />}
          </div>
          <h1 className="text-2xl font-bold">{headline}</h1>
          <p className="text-sm text-muted-foreground">{sub}</p>
          {success.draft && (
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={() => router.push(`/dashboard/challenges/${challengeId}`)}>
                {t.success.backToChallenge}
              </Button>
              <Button onClick={() => router.push('/dashboard')}>{t.success.myDashboard}</Button>
            </div>
          )}
          {!success.draft && (
            <p className="text-xs text-muted-foreground pt-2">{t.success.redirecting}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/challenges/${challengeId}`)}
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <X className="size-4" /> {t.cancel}
          </button>
          <p className="text-sm font-medium truncate text-center flex-1">{challengeTitle}</p>
          <div className="text-xs text-muted-foreground font-mono">
            {tx(t.step, { n: step })}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8 pb-32">
        {step === 1 ? (
          <Step1
            coverUrl={coverUrl}
            setCoverUrl={setCoverUrl}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            projectLink={projectLink}
            setProjectLink={setProjectLink}
            showOnProfile={showOnProfile}
            setShowOnProfile={setShowOnProfile}
            showMotivation={showMotivation}
            dismissMotivation={() => setShowMotivation(false)}
            tStep1={t.step1}
          />
        ) : (
          <Step2
            photos={photos}
            addPhoto={addPhoto}
            removePhoto={removePhoto}
            updateCaption={updateCaption}
            maxPhotos={MAX_PHOTOS}
            t={t.step2}
          />
        )}

        {error && (
          <p className="mt-6 text-sm text-destructive text-center">{error}</p>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between gap-3">
          {step === 1 ? (
            <>
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/challenges/${challengeId}`)}
                disabled={isPending}
              >
                {t.cancel}
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!canGoToStep2() || isPending}
                className="gap-2"
              >
                {t.next} <ArrowRight className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={isPending}
                className="gap-2"
              >
                <ArrowLeft className="size-4" /> {t.back}
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSubmit(true)}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  {t.saveDraft}
                </Button>
                <Button
                  onClick={handlePublishClick}
                  disabled={isPending || analyzing}
                  className="gap-2"
                >
                  {(isPending || analyzing)
                    ? <Loader2 className="size-4 animate-spin" />
                    : canRequestHumanReview
                      ? <Users className="size-4" />
                      : null}
                  {analyzing
                    ? t.aiVerdict.analyzeRunning
                    : canRequestHumanReview
                      ? t.aiVerdict.requestHumanReview
                      : t.publish}
                </Button>
              </div>
            </>
          )}
        </div>
        {step === 2 && !canRequestHumanReview && aiRejectionCount > 0 && (
          <p className="text-[11px] text-center text-muted-foreground pb-2">
            {tx(t.aiVerdict.modal.attemptsBeforeHumanReview, {
              n: Math.max(0, HUMAN_REVIEW_THRESHOLD - aiRejectionCount),
            })}
          </p>
        )}
        {step === 2 && attemptsLeft < 2 && (
          <p className="text-[11px] text-center text-muted-foreground pb-2">
            {tx(attemptsLeft > 1 ? t.attemptsLeftPlural : t.attemptsLeft, { n: attemptsLeft })}
          </p>
        )}
      </div>

      {/* Sync analyze overlay with progress bar (5–15s during AI analysis) */}
      {analyzing && (
        <div className="fixed inset-0 z-[55] bg-black/40 supports-[backdrop-filter]:backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-2xl bg-background border border-border shadow-xl p-6 max-w-sm w-full space-y-4">
            <div className="text-center space-y-1">
              <Sparkles className="size-7 mx-auto text-violet-600 dark:text-violet-400 animate-pulse" />
              <p className="text-sm font-semibold">{t.aiVerdict.analyzing}</p>
              <p className="text-xs text-muted-foreground">{t.aiVerdict.analyzingBody}</p>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-violet-600 dark:bg-violet-400 rounded-full transition-[width] duration-300 ease-out"
                style={{ width: `${analyzeProgress}%` }}
              />
            </div>
            <p className="text-[11px] font-mono text-muted-foreground text-center">
              {Math.round(analyzeProgress)}%
            </p>
          </div>
        </div>
      )}

    </div>
  )
}

export function AnalysisResultModal({
  mode,
  result,
  rejectionCount,
  humanReviewThreshold,
  onEditImages,
  onSubmitAnyway,
  onConfirmSubmit,
  t,
  publishLabel,
}: {
  mode: 'success' | 'warning' | 'blocking'
  result: {
    images: { index: number; url?: string; is_cover: boolean; valid: boolean; reason: string | null }[]
    description_bonus_eligible: boolean
    description_bonus_reason: string | null
  }
  rejectionCount: number
  humanReviewThreshold: number
  onEditImages: () => void
  onSubmitAnyway: () => void
  onConfirmSubmit: () => void
  t: SubmitT['aiVerdict']['modal']
  publishLabel: string
}) {
  const title = mode === 'success' ? t.successTitle : mode === 'warning' ? t.warningTitle : t.blockingTitle
  const remainingBeforeHumanReview = Math.max(0, humanReviewThreshold - rejectionCount - 1)
  const headerColor = mode === 'success'
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
    : mode === 'warning'
      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
      : 'bg-red-500/15 text-red-700 dark:text-red-400'
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 supports-[backdrop-filter]:backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <span className={cn('size-9 rounded-full inline-flex items-center justify-center shrink-0', headerColor)}>
            {mode === 'success' ? <CheckCircle className="size-5" /> : <X className="size-5" />}
          </span>
          <h2 className="text-base font-semibold leading-tight pt-1">{title}</h2>
        </div>

        <ul className="space-y-2">
          {result.images.map((r, i) => (
            <li
              key={i}
              className={cn(
                'flex items-start gap-2 rounded-xl border p-2',
                r.valid ? 'border-border bg-card' : 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20',
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="flex items-center gap-2 text-xs">
                  {r.is_cover && (
                    <span className="font-mono uppercase tracking-widest text-muted-foreground">
                      {t.coverLabel}
                    </span>
                  )}
                  {!r.is_cover && (
                    <span className="font-mono uppercase tracking-widest text-muted-foreground">
                      #{r.index + 1}
                    </span>
                  )}
                  <span className={cn(
                    'font-mono text-[10px] px-1.5 py-0.5 rounded-full',
                    r.valid
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                      : 'bg-red-500/15 text-red-700 dark:text-red-400',
                  )}>
                    {r.valid ? t.validBadge : t.rejectedBadge}
                  </span>
                </p>
                {!r.valid && r.reason && (
                  <p className="text-xs text-red-700 dark:text-red-400/90 mt-1 leading-snug">{r.reason}</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {mode === 'success' && result.description_bonus_eligible && (
          <div className="flex items-start gap-2 rounded-xl border border-violet-200 dark:border-violet-900/50 bg-violet-50/60 dark:bg-violet-950/20 p-3">
            <Sparkles className="size-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">{t.bonusTitle}</p>
              {result.description_bonus_reason && (
                <p className="text-[11px] text-violet-700/85 dark:text-violet-400/80 leading-snug mt-0.5">
                  {result.description_bonus_reason}
                </p>
              )}
            </div>
          </div>
        )}

        {mode === 'blocking' && remainingBeforeHumanReview > 0 && (
          <p className="text-[11px] text-muted-foreground text-center">
            {tx(t.attemptsBeforeHumanReview, { n: remainingBeforeHumanReview })}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          {mode === 'success' ? (
            <Button onClick={onConfirmSubmit} className="gap-1.5">
              <CheckCircle className="size-4" /> {publishLabel}
            </Button>
          ) : (
            <>
              <Button variant={mode === 'blocking' ? 'default' : 'outline'} onClick={onEditImages}>
                {t.editImages}
              </Button>
              {mode === 'warning' && (
                <Button onClick={onSubmitAnyway}>
                  {t.submitAnyway}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Step 1 — Project ─────────────────────────────────────────────────────────
function Step1({
  coverUrl,
  setCoverUrl,
  title,
  setTitle,
  description,
  setDescription,
  projectLink,
  setProjectLink,
  showOnProfile,
  setShowOnProfile,
  showMotivation,
  dismissMotivation,
  tStep1,
}: {
  coverUrl: string | null
  setCoverUrl: (url: string | null) => void
  title: string
  setTitle: (v: string) => void
  description: string
  setDescription: (v: string) => void
  projectLink: string
  setProjectLink: (v: string) => void
  showOnProfile: boolean
  setShowOnProfile: (v: boolean) => void
  showMotivation: boolean
  dismissMotivation: () => void
  tStep1: SubmitT['step1']
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{tStep1.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{tStep1.subtitle}</p>
      </div>

      {/* Cover */}
      <div className="space-y-2">
        <Label className="text-sm">{tStep1.coverLabel}</Label>
        <ImageUpload bucket="submissions" value={coverUrl} onChange={setCoverUrl} className="aspect-[16/10]" />
        <p className="text-xs text-muted-foreground">{tStep1.coverHint}</p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm">{tStep1.titleLabel}</Label>
        <Input
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={tStep1.titlePlaceholder}
          maxLength={120}
        />
      </div>

      {/* General description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm">{tStep1.descriptionLabel}</Label>
        <textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={5}
          placeholder={tStep1.descriptionPlaceholder}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <div className="flex items-start gap-2 rounded-lg border border-violet-200 dark:border-violet-900/50 bg-violet-50/60 dark:bg-violet-950/20 px-3 py-2">
          <Sparkles className="size-3.5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-snug text-violet-700/90 dark:text-violet-300/90">
            {tStep1.descriptionBonusHint}
          </p>
        </div>
      </div>

      {/* Project link */}
      <div className="space-y-2">
        <Label htmlFor="projectLink" className="text-sm">{tStep1.linkLabel}</Label>
        <Input
          id="projectLink"
          type="url"
          value={projectLink}
          onChange={e => setProjectLink(e.target.value)}
          placeholder={tStep1.linkPlaceholder}
        />
      </div>

      {/* Profile toggle */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
        <div>
          <p className="text-sm font-medium">{tStep1.profileToggleLabel}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{tStep1.profileToggleBody}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={showOnProfile}
          onClick={() => setShowOnProfile(!showOnProfile)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0',
            showOnProfile ? 'bg-primary' : 'bg-muted'
          )}
        >
          <span
            className={cn(
              'inline-block size-5 rounded-full bg-white shadow transform transition-transform',
              showOnProfile ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {/* Floating motivation */}
      {showMotivation && (
        <div className="fixed bottom-24 right-6 z-20 max-w-xs rounded-2xl bg-violet-600 text-white p-4 shadow-lg flex items-start gap-3 animate-in slide-in-from-bottom-4 fade-in">
          <Sparkles className="size-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">{tStep1.motivationTitle}</p>
            <p className="text-white/85 text-xs mt-1 leading-relaxed">{tStep1.motivationBody}</p>
          </div>
          <button
            type="button"
            onClick={dismissMotivation}
            className="size-6 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0"
            aria-label={tStep1.motivationDismiss}
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Step 2 — Photos ────────────────────────────────────────────────────────────
function Step2({
  photos,
  addPhoto,
  removePhoto,
  updateCaption,
  maxPhotos,
  t,
}: {
  photos: { url: string; caption: string }[]
  addPhoto: (url: string | null) => void
  removePhoto: (idx: number) => void
  updateCaption: (idx: number, caption: string) => void
  maxPhotos: number
  t: SubmitT['step2']
}) {
  const [tempUploadKey, setTempUploadKey] = useState(0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
      </div>

      <div className="space-y-5">
        {photos.map((photo, i) => (
          <div key={i} className="rounded-2xl border border-border p-3 space-y-3">
            <div className="relative rounded-xl overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="w-full max-h-[420px] object-contain bg-muted" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-2 right-2 size-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                aria-label={t.removeAlt}
              >
                <X className="size-4" />
              </button>
            </div>
            <Input
              value={photo.caption}
              onChange={(e) => updateCaption(i, e.target.value)}
              placeholder={t.captionPlaceholder}
              maxLength={200}
            />
          </div>
        ))}

        {photos.length < maxPhotos && (
          <div className="space-y-2">
            <Label className="text-sm">
              {t.addPhotoLabel}{' '}
              <span className="text-muted-foreground font-normal">({tx(t.countLabel, { n: photos.length })})</span>
            </Label>
            <ImageUpload
              key={tempUploadKey}
              bucket="submissions"
              value={null}
              onChange={(url) => { addPhoto(url); setTempUploadKey(k => k + 1) }}
              className="aspect-[16/10]"
            />
          </div>
        )}
      </div>
    </div>
  )
}
