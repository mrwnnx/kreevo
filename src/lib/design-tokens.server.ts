import { supabaseAdmin } from '@/lib/supabase/admin'
import { type DesignTokens, DEFAULT_TOKENS, normalizeTokens } from '@/lib/design-tokens'

export async function getDesignTokens(): Promise<DesignTokens> {
  try {
    const { data } = await supabaseAdmin
      .from('settings' as any)
      .select('value')
      .eq('key', 'design_tokens')
      .single()
    return data?.value ? normalizeTokens(data.value) : DEFAULT_TOKENS
  } catch {
    return DEFAULT_TOKENS
  }
}
