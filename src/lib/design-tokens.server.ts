import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { type DesignTokens, DEFAULT_TOKENS, normalizeTokens } from '@/lib/design-tokens'

export const getDesignTokens = unstable_cache(
  async (): Promise<DesignTokens> => {
    try {
      const supabase = await createClient()
      const { data } = await (supabase as any)
        .from('settings')
        .select('value')
        .eq('key', 'design_tokens')
        .single()
      return data?.value ? normalizeTokens(data.value) : DEFAULT_TOKENS
    } catch {
      return DEFAULT_TOKENS
    }
  },
  ['design_tokens'],
  { revalidate: 3600, tags: ['design_tokens'] }
)
