import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type Admin = ReturnType<typeof createClient<Database>>

let client: Admin | null = null

function get(): Admin {
  if (!client) {
    client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  }
  return client
}

/**
 * Client service role — contourne la RLS, réservé au serveur.
 *
 * Construit à la PREMIÈRE UTILISATION, pas à l'import. `createClient` lève si
 * l'URL est absente : au niveau module, cette exception partait pendant la
 * collecte des pages de `next build`, si bien qu'un clone frais ou un
 * environnement sans les secrets ne pouvait pas construire le projet — la même
 * panne que `new Resend(undefined)`. Aucun appelant ne change : le proxy
 * transmet tout au vrai client, qui n'existe qu'au premier accès.
 *
 * Les ~40 fichiers qui l'importent continuent d'écrire `supabaseAdmin.from(…)`.
 */
export const supabaseAdmin = new Proxy({} as Admin, {
  get: (_t, prop, receiver) => Reflect.get(get(), prop, receiver),
  has: (_t, prop) => prop in get(),
})
