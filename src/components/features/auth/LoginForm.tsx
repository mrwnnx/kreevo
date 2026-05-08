'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInWithEmail } from '@/app/(auth)/actions'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type AuthT = Dictionary['auth']

interface LoginFormProps {
  t: AuthT['login']
  tc: AuthT['common']
}

export function LoginForm({ t, tc }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await signInWithEmail(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{tc.passwordLabel}</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t.forgotPassword}
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={tc.passwordPlaceholder}
          required
          autoComplete="current-password"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? t.submitting : t.submit}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t.noAccount}{' '}
        <Link href="/signup" className="font-medium text-foreground hover:underline">
          {t.signupCta}
        </Link>
      </p>
    </form>
  )
}
