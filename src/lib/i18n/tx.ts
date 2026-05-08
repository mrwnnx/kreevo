/**
 * Client-safe `{var}` interpolation helper.
 * Lives in its own module so client components can import it without
 * pulling in `next/headers` (server-only).
 *
 * @example tx('Hello {name}', { name: 'Marwen' }) → 'Hello Marwen'
 */
export function tx(
  template: string,
  params: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ''))
}

/** Re-export Lang type for client components. */
export type Lang = 'fr' | 'en'
