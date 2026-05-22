/**
 * Public-facing site URL helper.
 * Reads NEXT_PUBLIC_APP_URL with a Vercel preview fallback.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.kreevo.online')

export function siteUrl(path: string = ''): string {
  if (!path || path === '/') return SITE_URL
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
