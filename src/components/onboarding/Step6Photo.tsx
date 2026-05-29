'use client'

import { useCallback, useRef, useState } from 'react'
import { Camera, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { StepHeader } from './StepHeader'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type OnbT = Dictionary['onboarding']

interface Step6Props {
  avatarUrl: string
  onNext: (data: { avatarUrl: string }) => void
  onBack: () => void
  onSkip: () => void
  saving?: boolean
  t: OnbT['step6']
  tc: OnbT['common']
}

const MAX_MB = 5

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      const maxPx = 1200
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        const ratio = Math.min(maxPx / width, maxPx / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      let quality = 0.85
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Compression failed'))
            if (blob.size <= MAX_MB * 1024 * 1024 || quality <= 0.3) {
              resolve(blob)
            } else {
              quality -= 0.1
              tryCompress()
            }
          },
          'image/jpeg',
          quality
        )
      }
      tryCompress()
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

export function Step6Photo({ avatarUrl, onNext, onBack, onSkip, saving, t, tc }: Step6Props) {
  const [photo, setPhoto] = useState(avatarUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = useCallback(async (file: File) => {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError(t.errorImageOnly)
      return
    }
    setUploading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error(t.errorNotAuth)
      const blob = await compressImage(file)
      const path = `${user.id}/${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
      if (upErr) throw upErr
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(path)
      setPhoto(publicUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.errorUploadFailed)
    } finally {
      setUploading(false)
    }
  }, [t])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  return (
    <div>
      <StepHeader title={t.title} subtitle={t.subtitle} />

      {photo ? (
        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src={photo}
              alt="Profile"
              className="size-24 rounded-full object-cover border-2 border-primary"
            />
            <div className="absolute -bottom-1 -end-1 size-7 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              <Check className="size-4 text-primary-foreground" strokeWidth={3} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="mt-4 text-sm font-medium text-primary hover:opacity-80 underline underline-offset-4 disabled:opacity-50"
          >
            {uploading ? t.uploading : t.changePhoto}
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`rounded-[var(--radius-card)] border-2 border-dashed text-center p-12 cursor-pointer transition-colors ${
            dragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40 hover:bg-accent/30'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="size-10 mx-auto text-primary animate-spin" />
              <p className="mt-3 text-sm text-muted-foreground">{t.uploading}</p>
            </>
          ) : (
            <>
              <Camera className="size-10 mx-auto text-muted-foreground" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-semibold text-foreground">{t.dropHere}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.orBrowse}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-3">{t.formatHint}</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) upload(f)
          e.target.value = ''
        }}
      />

      {error && <p className="text-xs text-destructive text-center mt-3">{error}</p>}

      <div className="flex gap-3 mt-8">
        <Button type="button" onClick={onBack} variant="outline" size="lg" className="h-12">
          {tc.back}
        </Button>
        <Button
          type="button"
          onClick={() => onNext({ avatarUrl: photo })}
          disabled={saving || uploading}
          size="lg"
          className="flex-1 h-12"
        >
          {saving ? tc.saving : tc.continue}
        </Button>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="mx-auto block mt-4 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
      >
        {tc.skip}
      </button>
    </div>
  )
}
