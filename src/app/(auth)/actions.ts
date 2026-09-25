'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getDict, getLang } from '@/lib/i18n/lang'
import { translateAuthError } from '@/lib/auth-errors'
import { isValidUsername } from '@/lib/username'
import { finalizeProfile } from '@/lib/auth/finalize-profile'

// Destination après connexion ou activation : admin → espace admin, b2b → espace
// entreprise (qui renvoie vers l'onboarding sans fiche), sinon dashboard designer.
// Non exportée : un fichier 'use server' ne doit exporter que des actions.
async function homeForRole(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
  if (profile?.role === 'admin') return '/admin'
  if (profile?.role === 'b2b') return '/company'
  return '/dashboard'
}

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

// Même mécanisme que signUpWithEmail, sans username : le trigger handle_new_user()
// en génère un depuis l'email. `role: 'b2b'` est la seule donnée qui distingue une
// entreprise d'un designer — posée à la création, jamais mise à jour après coup.
export async function signUpCompany(formData: FormData) {
  const supabase = await createClient()
  const dict = await getDict()
  const lang = await getLang()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: 'b2b', lang },
      // Pas de ?next= ici : le lien d'activation ajoute `?token_hash=` à cette URL
      // (CONFIRMATION_ACTION_URL). C'est confirmEmail qui oriente selon le rôle.
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
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
  if (error) redirect('/login?error=link_expired')
  // Filet de sécurité : verifyOtp renvoie normalement une session (vérifié en prod, y
  // compris pour les jetons `pkce_…`). Sans session, on explique au lieu de renvoyer
  // vers /dashboard, qui rebondirait sur /login sans message.
  if (!data.session) redirect('/login?confirmed=1')

  await finalizeProfile(supabase, await cookies())
  redirect(await homeForRole(supabase, data.session.user.id))
}

// Renvoi du lien d'activation depuis /login (lien expiré). Réponse identique que
// l'adresse existe ou non : ne révèle pas quels emails ont un compte.
export async function resendConfirmation(formData: FormData) {
  const supabase = await createClient()
  const dict = await getDict()
  const email = ((formData.get('email') as string | null) ?? '').trim()
  if (!email) return { error: dict.auth.errors.validationFailed }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
  })
  // Plafond d'envoi Supabase : seule erreur utile à montrer.
  if (error?.status === 429) return { error: translateAuthError(error, dict.auth.errors) }
  return { success: dict.auth.login.resendSent }
}

export async function signInWithEmail(formData: FormData) {
  const supabase = await createClient()
  const dict = await getDict()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: translateAuthError(error, dict.auth.errors) }

  // Première connexion après activation : complète le profil + parrainage. Idempotent
  // (ne remplit que les champs vides, un parrainage déjà posé n'est pas repris).
  await finalizeProfile(supabase, await cookies())
  redirect(await homeForRole(supabase, data.user.id))
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
