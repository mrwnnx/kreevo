'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { submitChallenge } from './actions'
import type { Submission } from '@/types/database.types'
import { CheckCircle } from 'lucide-react'

interface SubmitFormProps {
  challengeId: string
  existing: Submission | null
  isClosed: boolean
  participationId?: string
  attemptsLeft?: number
}

export function SubmitForm({ challengeId, existing, isClosed, participationId, attemptsLeft = 2 }: SubmitFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [coverUrl, setCoverUrl] = useState<string | null>((existing as any)?.cover_url ?? null)

  if (isClosed) {
    return (
      <div className="rounded-xl border bg-muted/20 p-4 text-center text-muted-foreground text-sm">
        Ce challenge est fermé.
      </div>
    )
  }

  async function handleSubmit(formData: FormData) {
    if (!coverUrl) { setError('Merci de téléverser une image de couverture'); return }
    formData.set('coverUrl', coverUrl)
    if (participationId) formData.set('participationId', participationId)
    setError(null)
    startTransition(async () => {
      const result = await submitChallenge(formData)
      if (result?.error) setError(result.error)
      else setSuccess(true)
    })
  }

  if (success) {
    return (
      <div className="rounded-xl border bg-green-50 p-4 text-center space-y-2">
        <CheckCircle className="size-10 text-green-500 mx-auto" />
        <p className="font-semibold text-green-700">
          {existing ? 'Soumission mise à jour !' : 'Soumission reçue !'}
        </p>
        <p className="text-sm text-green-600">
          {existing ? `Il te reste ${attemptsLeft - 1} modification(s).` : '+150 XP attribués !'}
        </p>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <input type="hidden" name="challengeId" value={challengeId} />

      <div className="space-y-2">
        <Label>
          Image de couverture *
          {attemptsLeft < 2 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({attemptsLeft} modification{attemptsLeft !== 1 ? 's' : ''} restante{attemptsLeft !== 1 ? 's' : ''})
            </span>
          )}
        </Label>
        <ImageUpload
          bucket="submissions"
          value={coverUrl}
          onChange={setCoverUrl}
          className="h-48"
        />
        <p className="text-xs text-muted-foreground">PNG/JPG/WebP — max 5MB. L'image sera compressée automatiquement.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={(existing as any)?.description ?? ''}
          placeholder="Explique tes choix de design, ton process, les outils utilisés…"
          className="w-full rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 py-2 text-base md:text-sm placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none transition-colors"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="figmaUrl">Lien Figma (optionnel)</Label>
        <Input
          id="figmaUrl"
          name="figmaUrl"
          type="url"
          defaultValue={((existing as any)?.files as any)?.figma ?? ''}
          placeholder="https://figma.com/file/..."
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending || !coverUrl} className="w-full">
        {isPending ? 'Soumission en cours…' : existing ? 'Mettre à jour' : 'Soumettre mon travail'}
      </Button>
    </form>
  )
}
