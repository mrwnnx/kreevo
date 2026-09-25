import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { finalizeProfile } from '@/lib/auth/finalize-profile'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin
  // Honor ?next= (e.g. password recovery → /update-password). Same-site paths only.
  const nextParam = requestUrl.searchParams.get('next')
  const next = nextParam && nextParam.startsWith('/') ? nextParam : '/dashboard'

  // Lien d'activation d'email ({{ .TokenHash }}, cf. CONFIRMATION_ACTION_URL). On ne
  // l'active PAS ici : les scanners de liens (Gmail…) font ce GET avant l'utilisateur
  // et brûlaient le jeton à usage unique. On renvoie vers une page à bouton.
  const tokenHash = requestUrl.searchParams.get('token_hash')
  if (tokenHash) {
    const type = requestUrl.searchParams.get('type') ?? 'email'
    return NextResponse.redirect(
      `${origin}/confirm-email?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`
    )
  }

  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const reason = requestUrl.searchParams.get('error_code') === 'otp_expired' ? 'link_expired' : error
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(reason)}`
    )
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // ignore
            }
          },
        },
      }
    )

    const { error: exchangeError } = await supabase.auth
      .exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Exchange error:', exchangeError)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    await finalizeProfile(supabase, cookieStore)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
