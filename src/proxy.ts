import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const REF_CODE_PATTERN = /^[a-z0-9]{4,16}$/i

export async function proxy(request: NextRequest) {
  const response = await updateSession(request)

  // Capture referral code on signup page
  if (request.nextUrl.pathname === '/signup') {
    const ref = request.nextUrl.searchParams.get('ref')?.trim()
    if (ref && REF_CODE_PATTERN.test(ref)) {
      response.cookies.set('kreevo_ref', ref, {
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
    }
  }

  return response
}

// Positive matcher — only run middleware on routes that actually need session
// validation or cookie capture. Everything else (landing, /help/*, /u/*,
// /challenges/*, /login, /auth/*, /api/*) bypasses the middleware entirely,
// saving 1-2 Supabase round trips per navigation on public pages.
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding',
    '/signup',
  ],
}
