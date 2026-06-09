import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Rang d'un user parmi les designers de SA spécialité (TOUTES ligues confondues),
// trié sur profiles.xp (carrière). SOURCE UNIQUE réutilisée par le profil public
// (/u/[username]) ET l'onglet « Ma spécialité » du leaderboard.
// Le client est passé en paramètre pour que chaque appelant garde EXACTEMENT son
// scope (RLS côté profil public, service-role côté leaderboard) — comportement
// identique au calcul historiquement inline dans /u/[username].
export async function getSpecialtyRank(
  client: SupabaseClient<Database>,
  specialtyId: string,
  xp: number | null,
  userId: string,
): Promise<{ rank: number; total: number }> {
  const [{ data: ahead }, { count: total }] = await Promise.all([
    client
      .from('profiles')
      .select('id')
      .eq('specialty_id', specialtyId)
      .gte('xp', xp)
      .neq('id', userId),
    client
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('specialty_id', specialtyId),
  ])
  return { rank: (ahead?.length ?? 0) + 1, total: total ?? 0 }
}
