'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getDict, getLang } from '@/lib/i18n/lang'
import { translateAuthError } from '@/lib/auth-errors'
import { isValidUsername } from '@/lib/username'
import { finalizeProfile } from '@/lib/auth/finalize-profile'

export async function signUpWithEmail(formData: FormData) {
  const supabase = await createClient()
  const dict = await getDict()
  const lang = await getLang()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const rawUsername = (formData.get('username') as string | null) ?? ''
  const username = rawUsername.trim()

  if (!isValidUsername(username)) {
    return { error: dict.auth.errors.validationFailed }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, full_name: username, lang },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) return { error: translateAuthError(error, dict.auth.errors) }
  return { success: dict.auth.common.checkEmail }
}

// Activation d'email par bouton (page /confirm-email) : le jeton n'est consommé qu'au
// clic de l'utilisateur, jamais par le GET d'un scanner de liens.
export async function confirmEmail(formData: FormData) {
  const tokenHash = (formData.get('token_hash') as string | null) ?? ''
  const type = ((formData.get('type') as string | null) || 'email') as EmailOtpType
  if (!tokenHash) redirect('/login?error=link_expired')

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
  if (error) redirect('/login?error=link_expired')

  await finalizeProfile(supabase, await cookies())
  redirect('/dashboard')
}

export async function signInWithEmail(formData: FormData) {
  const supabase = await createClient()
  const dict = await getDict()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: translateAuthError(error, dict.auth.errors) }
  redirect('/dashboard')
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const dict = await getDict()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })

  if (error) return { error: translateAuthError(error, dict.auth.errors) }
  if (data.url) redirect(data.url)
}

export async function signInWithLinkedIn() {
  const supabase = await createClient()
  const dict = await getDict()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin_oidc',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) return { error: translateAuthError(error, dict.auth.errors) }
  if (data.url) redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const dict = await getDict()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/update-password`,
  })

  if (error) return { error: translateAuthError(error, dict.auth.errors) }
  return { success: dict.auth.common.resetSent }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const dict = await getDict()
  const password = formData.get('password') as string

  if (!password || password.length < 8) {
    return { error: dict.auth.errors.weakPassword }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: dict.auth.errors.sessionExpired }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: translateAuthError(error, dict.auth.errors) }
  return { success: dict.auth.updatePassword.success }
}
