'use client'

import { useCallback, useRef, useState } from 'react'
import { Camera, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StepHeader } from './StepHeader'

interface Step5Props {
  avatarUrl: string
  onNext: (data: { avatarUrl: string }) => void
  onBack: () => void
  onSkip: () => void
  saving?: boolean
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

export function Step5Photo({ avatarUrl, onNext, onBack, onSkip, saving }: Step5Props) {
  const [photo, setPhoto] = useState(avatarUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = useCallback(async (file: File) => {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file')
      return
    }
    setUploading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
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
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  return (
    <div>
      <StepHeader
        title="Add your profile photo 📸"
        subtitle="Put a face to your work — designers with photos get 3x more views."
      />

      {photo ? (
        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src={photo}
              alt="Profile"
              className="size-24 rounded-full object-cover border-2 border-emerald-500"
            />
            <div className="absolute -bottom-1 -right-1 size-7 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white">
              <Check className="size-4 text-white" strokeWidth={3} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="mt-4 text-sm font-medium text-violet-600 hover:text-violet-700 underline underline-offset-4 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Change photo'}
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
          className={`rounded-2xl border-2 border-dashed text-center p-12 cursor-pointer transition-colors ${
            dragging
              ? 'border-violet-400 bg-violet-50'
              : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/60'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="size-10 mx-auto text-violet-600 animate-spin" />
              <p className="mt-3 text-sm text-zinc-600">Uploading…</p>
            </>
          ) : (
            <>
              <Camera className="size-10 mx-auto text-zinc-400" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-semibold text-zinc-900">Drop your photo here</p>
              <p className="text-xs text-zinc-500 mt-1">or click to browse</p>
              <p className="text-[11px] text-zinc-400 mt-3">PNG, JPG — Max 5MB</p>
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

      {error && <p className="text-xs text-red-500 text-center mt-3">{error}</p>}

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
          onClick={() => onNext({ avatarUrl: photo })}
          disabled={saving || uploading}
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
