'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { submitChallenge } from './actions'
import type { Submission } from '@/types/database.types'
import { CheckCircle, X, Plus, Loader2, ArrowLeft, ArrowRight, Sparkles, Search, ShieldCheck, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Collaborator {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
}

interface Props {
  challengeId: string
  challengeTitle: string
  participationId: string
  attemptsLeft: number
  existing: Submission | null
}

export function MultiStepSubmitForm({
  challengeId,
  challengeTitle,
  participationId,
  attemptsLeft,
  existing,
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const existingFiles = (existing as any)?.files ?? {}

  // Step 1
  const [coverUrl, setCoverUrl] = useState<string | null>((existing as any)?.cover_url ?? null)
  const [additionalImages, setAdditionalImages] = useState<string[]>(
    Array.isArray(existingFiles?.images) ? existingFiles.images : []
  )
  const [showMotivation, setShowMotivation] = useState(true)

  // Step 2
  const [title, setTitle] = useState<string>((existing as any)?.title ?? '')
  const [description, setDescription] = useState<string>((existing as any)?.description ?? '')
  const [projectLink, setProjectLink] = useState<string>(existingFiles?.link ?? '')
  const [collaborators, setCollaborators] = useState<Collaborator[]>(existingFiles?.collaboratorsResolved ?? [])
  const [showOnProfile, setShowOnProfile] = useState<boolean>(
    (existing as any)?.is_visible !== false
  )

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ draft: boolean; status?: 'approved' | 'rejected' | 'pending' } | null>(null)

  // AI validation state — analyzed in real time after cover upload
  type AIState =
    | { phase: 'idle' }
    | { phase: 'analyzing' }
    | { phase: 'approved' }
    | { phase: 'rejected'; reason: string }
    | { phase: 'skipped' } // higher leagues — no AI
    | { phase: 'error' }
  const [aiState, setAiState] = useState<AIState>({ phase: 'idle' })
  const lastValidatedUrlRef = useRef<string | null>(null)

  useEffect(() => {
    // Trigger AI validation whenever a NEW cover is uploaded
    if (!coverUrl) {
      setAiState({ phase: 'idle' })
      lastValidatedUrlRef.current = null
      return
    }
    if (lastValidatedUrlRef.current === coverUrl) return
    lastValidatedUrlRef.current = coverUrl

    setAiState({ phase: 'analyzing' })
    const ctrl = new AbortController()
    fetch('/api/ai/validate-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cover_url: coverUrl, challenge_id: challengeId }),
      signal: ctrl.signal,
    })
      .then(async (res) => {
        const data = await res.json()
        if (data.skipped) { setAiState({ phase: 'skipped' }); return }
        if (data.valid === true) { setAiState({ phase: 'approved' }); return }
        if (data.valid === false) { setAiState({ phase: 'rejected', reason: data.reason ?? 'Travail non accepté' }); return }
        setAiState({ phase: 'error' })
      })
      .catch((e) => {
        if (e?.name === 'AbortError') return
        setAiState({ phase: 'error' })
      })

    return () => ctrl.abort()
  }, [coverUrl, challengeId])

  // Collaborator search
  const [collabQuery, setCollabQuery] = useState('')
  const [collabResults, setCollabResults] = useState<Collaborator[]>([])
  const [collabOpen, setCollabOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (collabQuery.trim().length < 2) {
      setCollabResults([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(collabQuery.trim())}`)
        const data = await res.json()
        const filtered = (data.users ?? []).filter(
          (u: Collaborator) => !collaborators.some(c => c.id === u.id)
        )
        setCollabResults(filtered)
      } catch {
        setCollabResults([])
      }
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [collabQuery, collaborators])

  function addCollaborator(c: Collaborator) {
    setCollaborators(prev => [...prev, c])
    setCollabQuery('')
    setCollabResults([])
  }

  function removeCollaborator(id: string) {
    setCollaborators(prev => prev.filter(c => c.id !== id))
  }

  function addAdditionalImage(url: string | null) {
    if (!url) return
    setAdditionalImages(prev => [...prev, url])
  }

  function removeAdditionalImage(idx: number) {
    setAdditionalImages(prev => prev.filter((_, i) => i !== idx))
  }

  function canGoToStep2() {
    return !!coverUrl
  }

  async function handleSubmit(asDraft: boolean) {
    if (!coverUrl) {
      setError('Image de couverture requise')
      setStep(1)
      return
    }
    if (!asDraft && !title.trim()) {
      setError('Un titre est requis pour publier')
      return
    }
    setError(null)

    const fd = new FormData()
    fd.set('challengeId', challengeId)
    fd.set('coverUrl', coverUrl)
    fd.set('title', title)
    fd.set('description', description)
    fd.set('projectLink', projectLink)
    fd.set('participationId', participationId)
    fd.set('isDraft', asDraft ? 'true' : 'false')
    fd.set('isVisible', showOnProfile ? 'true' : 'false')
    fd.set('additionalImages', JSON.stringify(additionalImages))
    fd.set('collaborators', JSON.stringify(collaborators.map(c => c.id)))

    // Pass AI verdict so action can apply final status without re-running the AI
    if (!asDraft) {
      if (aiState.phase === 'approved') fd.set('aiVerdict', 'approved')
      else if (aiState.phase === 'rejected') {
        fd.set('aiVerdict', 'rejected')
        fd.set('aiReason', aiState.reason)
      }
      else if (aiState.phase === 'skipped') fd.set('aiVerdict', 'skipped')
    }

    startTransition(async () => {
      const result = await submitChallenge(fd)
      if (result?.error) {
        setError(result.error)
        return
      }

      const finalStatus = (result as any)?.status as 'approved' | 'rejected' | 'pending' | undefined
      setSuccess({ draft: !!result?.draft, status: finalStatus })

      // Redirect to challenge page — celebrate 2s if approved, immediate otherwise
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
      ? 'Brouillon enregistré'
      : isApproved ? '🎉 Soumission validée !'
      : isRejected ? 'Soumission enregistrée'
      : 'Soumission reçue'

    const sub = success.draft
      ? 'Tu peux revenir plus tard pour finaliser et publier ton travail.'
      : isApproved ? 'Bravo ! Tes XP arrivent…'
      : isRejected ? 'Ton travail a été enregistré sans XP.'
      : 'Un admin va examiner ton travail.'

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
                Retour au challenge
              </Button>
              <Button onClick={() => router.push('/dashboard')}>Mon dashboard</Button>
            </div>
          )}
          {!success.draft && (
            <p className="text-xs text-muted-foreground pt-2">Redirection en cours…</p>
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
            <X className="size-4" /> Annuler
          </button>
          <p className="text-sm font-medium truncate text-center flex-1">{challengeTitle}</p>
          <div className="text-xs text-muted-foreground font-mono">
            Étape {step}/2
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
            additionalImages={additionalImages}
            addAdditionalImage={addAdditionalImage}
            removeAdditionalImage={removeAdditionalImage}
            showMotivation={showMotivation}
            dismissMotivation={() => setShowMotivation(false)}
            aiState={aiState}
          />
        ) : (
          <Step2
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            projectLink={projectLink}
            setProjectLink={setProjectLink}
            collabQuery={collabQuery}
            setCollabQuery={setCollabQuery}
            collabResults={collabResults}
            collabOpen={collabOpen}
            setCollabOpen={setCollabOpen}
            collaborators={collaborators}
            addCollaborator={addCollaborator}
            removeCollaborator={removeCollaborator}
            showOnProfile={showOnProfile}
            setShowOnProfile={setShowOnProfile}
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
                Annuler
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!canGoToStep2() || isPending || aiState.phase === 'analyzing'}
                className="gap-2"
              >
                {aiState.phase === 'analyzing' ? <Loader2 className="size-4 animate-spin" /> : null}
                Continuer <ArrowRight className="size-4" />
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
                <ArrowLeft className="size-4" /> Retour
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSubmit(true)}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save as draft
                </Button>
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={isPending || aiState.phase === 'analyzing'}
                  variant={aiState.phase === 'rejected' ? 'ghost' : 'default'}
                  className="gap-2"
                >
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  {aiState.phase === 'rejected'
                    ? <>Soumettre quand même <span className="text-xs ml-1 opacity-70">(sans XP)</span></>
                    : 'Publier maintenant'}
                </Button>
              </div>
            </>
          )}
        </div>
        {step === 2 && attemptsLeft < 2 && (
          <p className="text-[11px] text-center text-muted-foreground pb-2">
            {attemptsLeft} soumission{attemptsLeft > 1 ? 's' : ''} restante{attemptsLeft > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Step 1 ───────────────────────────────────────────────────────────────────
type AIStateProp =
  | { phase: 'idle' }
  | { phase: 'analyzing' }
  | { phase: 'approved' }
  | { phase: 'rejected'; reason: string }
  | { phase: 'skipped' }
  | { phase: 'error' }

function Step1({
  coverUrl,
  setCoverUrl,
  additionalImages,
  addAdditionalImage,
  removeAdditionalImage,
  showMotivation,
  dismissMotivation,
  aiState,
}: {
  coverUrl: string | null
  setCoverUrl: (url: string | null) => void
  additionalImages: string[]
  addAdditionalImage: (url: string | null) => void
  removeAdditionalImage: (idx: number) => void
  showMotivation: boolean
  dismissMotivation: () => void
  aiState: AIStateProp
}) {
  const [tempUploadKey, setTempUploadKey] = useState(0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Choisis tes visuels</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Une image de couverture et jusqu&apos;à 3 visuels supplémentaires.
        </p>
      </div>

      {/* Cover */}
      <div className="space-y-2">
        <Label className="text-sm">Image de couverture *</Label>
        <ImageUpload
          bucket="submissions"
          value={coverUrl}
          onChange={setCoverUrl}
          className="aspect-[16/10]"
        />
        <p className="text-xs text-muted-foreground">
          PNG / JPG / WebP — max 5MB. L&apos;image sera compressée automatiquement.
        </p>

        {/* AI verdict UI — appears after cover upload */}
        {coverUrl && <AIVerdictPanel aiState={aiState} onChange={() => setCoverUrl(null)} />}
      </div>

      {/* Additional images */}
      <div className="space-y-2">
        <Label className="text-sm">
          Visuels supplémentaires{' '}
          <span className="text-muted-foreground font-normal">
            ({additionalImages.length}/3)
          </span>
        </Label>
        <div className="grid grid-cols-3 gap-3">
          {additionalImages.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeAdditionalImage(i)}
                className="absolute top-2 right-2 size-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Retirer"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          {additionalImages.length < 3 && (
            <ImageUpload
              key={tempUploadKey}
              bucket="submissions"
              value={null}
              onChange={(url) => {
                addAdditionalImage(url)
                setTempUploadKey(k => k + 1)
              }}
              className="aspect-square"
            />
          )}
        </div>
      </div>

      {/* Floating motivation */}
      {showMotivation && (
        <div className="fixed bottom-24 right-6 z-20 max-w-xs rounded-2xl bg-violet-600 text-white p-4 shadow-lg flex items-start gap-3 animate-in slide-in-from-bottom-4 fade-in">
          <Sparkles className="size-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">Tu vas gérer !</p>
            <p className="text-white/85 text-xs mt-1 leading-relaxed">
              Choisis un visuel qui raconte l&apos;essentiel de ton projet. Tu pourras
              ajouter du contexte juste après.
            </p>
          </div>
          <button
            type="button"
            onClick={dismissMotivation}
            className="size-6 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0"
            aria-label="Fermer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

function AIVerdictPanel({ aiState, onChange }: { aiState: AIStateProp; onChange: () => void }) {
  if (aiState.phase === 'idle') return null

  if (aiState.phase === 'analyzing') {
    return (
      <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl p-4">
        <div className="animate-spin size-5 border-2 border-violet-500 border-t-transparent rounded-full shrink-0" />
        <div>
          <p className="font-medium text-sm">Analyse en cours…</p>
          <p className="text-xs text-muted-foreground">
            Notre IA vérifie que ton travail correspond au brief.
          </p>
        </div>
      </div>
    )
  }

  if (aiState.phase === 'approved') {
    return (
      <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-900/40 rounded-2xl p-4">
        <ShieldCheck className="size-6 text-green-600 dark:text-green-400 shrink-0" />
        <div>
          <p className="font-medium text-sm text-green-800 dark:text-green-300">Travail validé !</p>
          <p className="text-xs text-green-700 dark:text-green-400/90">
            Ton travail correspond bien au brief. Tu peux soumettre.
          </p>
        </div>
      </div>
    )
  }

  if (aiState.phase === 'rejected') {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-900/40 rounded-2xl p-4">
          <ShieldAlert className="size-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-red-800 dark:text-red-300">Travail non accepté</p>
            <p className="text-xs text-red-700 dark:text-red-400/90 leading-relaxed">{aiState.reason}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Ton travail n&apos;a pas été accepté par notre IA. Tu ne recevras pas de XP pour cette soumission.
          Tu peux changer de fichier ou soumettre quand même.
        </p>
        <Button variant="outline" onClick={onChange} className="w-full">
          Changer de fichier
        </Button>
      </div>
    )
  }

  if (aiState.phase === 'skipped') {
    return (
      <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4">
        <Sparkles className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <div>
          <p className="font-medium text-sm text-amber-800 dark:text-amber-300">Validation manuelle</p>
          <p className="text-xs text-amber-700 dark:text-amber-400/90">
            Ton travail sera examiné par un admin sous 48h.
          </p>
        </div>
      </div>
    )
  }

  // error
  return (
    <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl p-4">
      <Sparkles className="size-5 text-muted-foreground shrink-0" />
      <p className="text-xs text-muted-foreground">
        Validation IA indisponible — tu peux quand même soumettre, un admin examinera ton travail.
      </p>
    </div>
  )
}

// ── Step 2 ───────────────────────────────────────────────────────────────────
function Step2({
  title,
  setTitle,
  description,
  setDescription,
  projectLink,
  setProjectLink,
  collabQuery,
  setCollabQuery,
  collabResults,
  collabOpen,
  setCollabOpen,
  collaborators,
  addCollaborator,
  removeCollaborator,
  showOnProfile,
  setShowOnProfile,
}: {
  title: string
  setTitle: (v: string) => void
  description: string
  setDescription: (v: string) => void
  projectLink: string
  setProjectLink: (v: string) => void
  collabQuery: string
  setCollabQuery: (v: string) => void
  collabResults: Collaborator[]
  collabOpen: boolean
  setCollabOpen: (v: boolean) => void
  collaborators: Collaborator[]
  addCollaborator: (c: Collaborator) => void
  removeCollaborator: (id: string) => void
  showOnProfile: boolean
  setShowOnProfile: (v: boolean) => void
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Détails du projet</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Donne du contexte sur ton travail.
        </p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm">Titre du projet *</Label>
        <Input
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ex : Refonte de l'app de banque mobile"
          maxLength={120}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm">Description</Label>
        <textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={5}
          placeholder="Explique tes choix de design, ton process, les outils utilisés…"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* Project link */}
      <div className="space-y-2">
        <Label htmlFor="projectLink" className="text-sm">Link du projet</Label>
        <Input
          id="projectLink"
          type="url"
          value={projectLink}
          onChange={e => setProjectLink(e.target.value)}
          placeholder="https://figma.com/file/... ou https://behance.net/…"
        />
      </div>

      {/* Collaborators */}
      <div className="space-y-2 relative">
        <Label className="text-sm">Collaborateurs</Label>

        {/* Selected */}
        {collaborators.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {collaborators.map(c => (
              <span
                key={c.id}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 pl-1 pr-2 py-1"
              >
                <Avatar size="sm">
                  {c.avatar_url && <AvatarImage src={c.avatar_url} alt={c.username} />}
                  <AvatarFallback>{c.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">{c.username}</span>
                <button
                  type="button"
                  onClick={() => removeCollaborator(c.id)}
                  className="ml-0.5 size-4 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                  aria-label="Retirer"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={collabQuery}
            onChange={e => { setCollabQuery(e.target.value); setCollabOpen(true) }}
            onFocus={() => setCollabOpen(true)}
            onBlur={() => setTimeout(() => setCollabOpen(false), 150)}
            placeholder="Cherche par nom ou email"
            className="pl-9"
          />
        </div>

        {/* Results dropdown */}
        {collabOpen && collabQuery.trim().length >= 2 && collabResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
            {collabResults.map(u => (
              <button
                key={u.id}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => addCollaborator(u)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted text-left transition-colors"
              >
                <Avatar size="sm">
                  {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.username} />}
                  <AvatarFallback>{u.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.username}</p>
                  {u.full_name && (
                    <p className="text-xs text-muted-foreground truncate">{u.full_name}</p>
                  )}
                </div>
                <Plus className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
        {collabOpen && collabQuery.trim().length >= 2 && collabResults.length === 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded-xl border border-border bg-popover shadow-lg p-4 text-sm text-muted-foreground text-center">
            Aucun utilisateur trouvé
          </div>
        )}
      </div>

      {/* Profile toggle */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
        <div>
          <p className="text-sm font-medium">Afficher dans mon profil public</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Les visiteurs de ton profil verront ce projet dans ta galerie.
          </p>
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
    </div>
  )
}
