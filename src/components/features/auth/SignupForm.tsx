'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { Check, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUpWithEmail } from '@/app/(auth)/actions'
import { isValidUsername, normalizeUsername, USERNAME_REGEX } from '@/lib/username'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type AuthT = Dictionary['auth']

interface SignupFormProps {
  t: AuthT['signup']
  tc: AuthT['common']
}

type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken'

export function SignupForm({ t, tc }: SignupFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [username, setUsername] = useState('')
  const [availability, setAvailability] = useState<AvailabilityState>('idle')

  const isFormatValid = isValidUsername(username)

  useEffect(() => {
    if (!isFormatValid) {
      setAvailability('idle')
      return
    }
    setAvailability('checking')
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/username/availability?u=${encodeURIComponent(username)}`,
          { signal: controller.signal },
        )
        const data = (await res.json()) as { valid: boolean; available: boolean }
        if (!data.valid) {
          setAvailability('idle')
        } else {
          setAvailability(data.available ? 'available' : 'taken')
        }
      } catch {
        // network or abort — keep current state
      }
    }, 350)
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [username, isFormatValid])

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(null)
    formData.set('username', username)
    startTransition(async () => {
      const result = await signUpWithEmail(formData)
      if (result?.error) setError(result.error)
      if (result?.success) setSuccess(result.success)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">{t.usernameLabel}</Label>
        <Input
          id="username"
          name="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(normalizeUsername(e.target.value))}
          placeholder={t.usernamePlaceholder}
          required
          autoComplete="username"
          pattern={USERNAME_REGEX.source}
          title={t.usernameTitle}
        />
        {username.length > 0 && (
          <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
            <span className="text-muted-foreground truncate">
              {t.usernamePreviewLabel}: kreevo.online/u/{username}
            </span>
            <UsernameStatus state={availability} t={t} />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{tc.emailLabel}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={tc.emailPlaceholder}
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{tc.passwordLabel}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={tc.passwordPlaceholder}
          required
          autoComplete="new-password"
          minLength={8}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || !isFormatValid || availability === 'taken'}
      >
        {isPending ? t.submitting : t.submit}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t.hasAccount}{' '}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          {t.loginCta}
        </Link>
      </p>
    </form>
  )
}

function UsernameStatus({
  state,
  t,
}: {
  state: AvailabilityState
  t: AuthT['signup']
}) {
  if (state === 'checking') {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
      </span>
    )
  }
  if (state === 'available') {
    return (
      <span className="inline-flex items-center gap-1 text-green-600">
        <Check className="size-3" /> {t.usernameAvailable}
      </span>
    )
  }
  if (state === 'taken') {
    return (
      <span className="inline-flex items-center gap-1 text-destructive">
        <X className="size-3" /> {t.usernameTaken}
      </span>
    )
  }
  return null
}
