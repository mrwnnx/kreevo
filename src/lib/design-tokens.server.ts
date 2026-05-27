import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { type DesignTokens, DEFAULT_TOKENS, normalizeTokens } from '@/lib/design-tokens'

export const DESIGN_TOKENS_CACHE_TAG = 'design-tokens'

/**
 * Fetches the current design tokens. Cached at process level (Next data cache)
 * with a 1h revalidation window. The admin save action calls
 * `revalidateTag(DESIGN_TOKENS_CACHE_TAG)` so a change reflects immediately
 * instead of waiting up to an hour.
 */
export const getDesignTokens = unstable_cache(
  async (): Promise<DesignTokens> => {
    try {
      const { data } = await supabaseAdmin
        .from('settings')
        .select('value')
        .eq('key', 'design_tokens')
        .single()
      return data?.value ? normalizeTokens(data.value) : DEFAULT_TOKENS
    } catch {
      return DEFAULT_TOKENS
    }
  },
  ['design-tokens'],
  { tags: [DESIGN_TOKENS_CACHE_TAG], revalidate: 3600 },
)
