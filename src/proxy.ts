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

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
