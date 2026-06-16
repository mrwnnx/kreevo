import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * IP rate-limit primitive (Upstash). FAIL-OPEN by design: if the Upstash env
 * vars are absent (local dev, or prod not yet configured), `getContactRatelimit`
 * returns null and the caller skips the cap rather than crashing.
 *
 * Scoped to the help-contact route for now; reuse for other routes is a separate
 * lot (give each its own prefix to avoid sharing buckets).
 */
let cached: Ratelimit | null | undefined

export function getContactRatelimit(): Ratelimit | null {
  if (cached !== undefined) return cached

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    cached = null
    return cached
  }

  cached = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    prefix: 'rl:help-contact',
    analytics: false,
  })
  return cached
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? '127.0.0.1'
}
