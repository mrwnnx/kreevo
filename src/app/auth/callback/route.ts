import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}`
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

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const meta = (user.user_metadata ?? {}) as Record<string, unknown>
        const provider = (user.app_metadata?.provider as string | undefined) ?? ''

        const given = (meta.given_name as string | undefined)?.trim()
        const family = (meta.family_name as string | undefined)?.trim()
        const fullName = (meta.full_name as string | undefined) ?? (meta.name as string | undefined)
        const picture =
          (meta.avatar_url as string | undefined) ??
          (meta.picture as string | undefined)

        let first = given ?? ''
        let last = family ?? ''
        if ((!first || !last) && fullName && fullName.trim().includes(' ')) {
          const parts = fullName.trim().split(/\s+/)
          if (!first) first = parts[0]
          if (!last) last = parts.slice(1).join(' ')
        }

        const { data: existing } = await (supabase as any)
          .from('profiles')
          .select('first_name, last_name, avatar_url, full_name, linkedin_url, referred_by')
          .eq('id', user.id)
          .single()

        if (existing) {
          const update: Record<string, unknown> = {}
          if (!existing.first_name && first) update.first_name = first
          if (!existing.last_name && last) update.last_name = last
          if (!existing.full_name && fullName) update.full_name = fullName
          if (!existing.avatar_url && picture) update.avatar_url = picture

          if (provider === 'linkedin_oidc' && !existing.linkedin_url) {
            const linkedinId = meta.sub as string | undefined
            if (linkedinId) update.linkedin_url = `https://www.linkedin.com/in/${linkedinId}`
          }

          // Apply referral: read kreevo_ref cookie, find referrer, link profiles + create referral row
          const refCode = cookieStore.get('kreevo_ref')?.value
          if (refCode && !(existing as any).referred_by) {
            const { data: referrer } = await (supabase as any)
              .from('profiles')
              .select('id')
              .eq('referral_code', refCode)
              .neq('id', user.id)
              .maybeSingle()
            if (referrer?.id) {
              update.referred_by = referrer.id
              await (supabase as any).from('referrals').insert({
                referrer_id: referrer.id,
                referred_id: user.id,
                status: 'pending',
                xp_awarded: 0,
              })
            }
            cookieStore.set('kreevo_ref', '', { maxAge: 0, path: '/' })
          }

          if (Object.keys(update).length > 0) {
            update.updated_at = new Date().toISOString()
            await (supabase as any)
              .from('profiles')
              .update(update)
              .eq('id', user.id)
          }
        }
      }
    } catch (err) {
      console.error('OAuth metadata pre-fill failed:', err)
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
