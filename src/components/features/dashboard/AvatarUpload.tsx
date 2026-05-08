'use client'

import { useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLeagueColor } from '@/lib/utils/xp'

interface Props {
  userId: string
  value: string | null
  name: string
  league: string | null | undefined
  onChange: (url: string) => void
}

// Try WebP first, fall back to JPEG on browsers that don't encode WebP.
function encodeCanvas(canvas: HTMLCanvasElement, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob && blob.type === 'image/webp') {
          resolve(blob)
        } else {
          canvas.toBlob(
            (jpeg) => (jpeg ? resolve(jpeg) : reject(new Error('Encode failed'))),
            'image/jpeg',
            quality,
          )
        }
      },
      'image/webp',
      quality,
    )
  })
}

function compress(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const src = URL.createObjectURL(file)
    img.onload = async () => {
      URL.revokeObjectURL(src)
      const MAX = 400
      let { width, height } = img
      if (width > MAX || height > MAX) {
        const ratio = Math.min(MAX / width, MAX / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      try {
        resolve(await encodeCanvas(canvas, 0.85))
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Compression failed'))
      }
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = src
  })
}

export function AvatarUpload({ userId, value, name, league, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(value)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    // Immediate preview
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const blob = await compress(file)
      const supabase = createClient()
      const isWebp = blob.type === 'image/webp'
      const path = `${userId}/avatar.${isWebp ? 'webp' : 'jpg'}`
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      // bust cache
      const url = `${publicUrl}?t=${Date.now()}`
      setPreview(url)
      onChange(url)
      showToast('Photo mise à jour ✓', true)
    } catch {
      showToast('Erreur lors de l\'upload', false)
    } finally {
      setUploading(false)
    }
  }, [userId, onChange])

  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar with gradient border ring */}
      <div
        className="group relative cursor-pointer rounded-full p-[2px] shrink-0"
        style={{ backgroundColor: getLeagueColor(league) }}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {/* Inner circle */}
        <div className="relative size-24 rounded-full overflow-hidden bg-muted">
          {preview ? (
            <img src={preview} alt="Avatar" className="size-full object-cover" />
          ) : (
            <div className="size-full flex items-center justify-center bg-primary/10 text-primary text-2xl font-bold select-none">
              {initials}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <Loader2 className="size-5 text-white animate-spin" />
              ) : (
                <div className="size-10 rounded-full bg-black flex items-center justify-center">
                  <ArrowUp className="size-4 text-white" strokeWidth={2.5} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <p className={cn(
          'text-xs font-medium px-3 py-1 rounded-full',
          toast.ok
            ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
            : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
        )}>
          {toast.msg}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
