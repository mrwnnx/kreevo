'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  bucket: 'avatars' | 'submissions'
  value?: string | null
  onChange: (url: string | null) => void
  maxSizeMB?: number
  className?: string
  accept?: string
}

export function ImageUpload({
  bucket,
  value,
  onChange,
  maxSizeMB = bucket === 'avatars' ? 2 : 5,
  className,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const compressImage = useCallback((file: File, maxMB: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const canvas = document.createElement('canvas')
        const maxPx = 1800
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
            blob => {
              if (!blob) return reject(new Error('Compression failed'))
              if (blob.size <= maxMB * 1024 * 1024 || quality <= 0.3) {
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
  }, [])

  const upload = useCallback(async (file: File) => {
    setError(null)
    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const blob = await compressImage(file, maxSizeMB)
      const ext = 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true })

      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
      onChange(publicUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [bucket, compressImage, maxSizeMB, onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }, [upload])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
    e.target.value = ''
  }

  if (value) {
    return (
      <div className={cn('relative group rounded-xl overflow-hidden border border-border', className)}>
        <img src={value} alt="Upload" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-md transition-colors backdrop-blur-sm"
          >
            Change
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="bg-white/10 hover:bg-red-500/80 text-white p-1.5 rounded-md transition-colors backdrop-blur-sm"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 border-dashed transition-all cursor-pointer',
        dragging ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-border hover:border-primary/50 hover:bg-muted/30',
        className
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center select-none">
        {uploading ? (
          <>
            <Loader2 className="size-7 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading…</p>
          </>
        ) : (
          <>
            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
              {dragging ? <ImageIcon className="size-5 text-primary" /> : <Upload className="size-5 text-muted-foreground" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Drop image here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WebP — max {maxSizeMB}MB</p>
            </div>
          </>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive text-center pb-3 px-4">{error}</p>
      )}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
    </div>
  )
}
