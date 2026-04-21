'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function ParticipateButton({ challengeId }: { challengeId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleParticipate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/participations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }
      router.refresh()
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        size="lg"
        onClick={handleParticipate}
        disabled={loading}
        className="w-full text-base h-12 gap-2"
      >
        {loading ? <Loader2 className="size-5 animate-spin" /> : '🚀'}
        {loading ? 'Inscription en cours…' : 'Je participe'}
      </Button>
      {error && <p className="text-sm text-destructive text-center">{error}</p>}
      <p className="text-xs text-muted-foreground text-center">
        Tu auras 3 jours pour soumettre ton travail après avoir rejoint.
      </p>
    </div>
  )
}
