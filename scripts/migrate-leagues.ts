import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const LEAGUE_MAP: Record<string, string> = {
  rookie:  '7ajra',
  rising:  'Bronze',
  pro:     'Silver',
  elite:   'Gold',
  legend:  'Legend',
}

async function main() {
  const { data: profiles, error } = await (supabase as any)
    .from('profiles')
    .select('id, username, league')

  if (error) { console.error(error.message); process.exit(1) }

  const toMigrate = (profiles as any[]).filter(p => LEAGUE_MAP[p.league])
  console.log(`${profiles.length} users total — ${toMigrate.length} à migrer`)

  let migrated = 0
  for (const p of toMigrate) {
    const newLeague = LEAGUE_MAP[p.league]
    const { error: err } = await (supabase as any)
      .from('profiles')
      .update({ league: newLeague })
      .eq('id', p.id)
    if (err) {
      console.error(`Erreur pour ${p.username}:`, err.message)
    } else {
      console.log(` ✓ @${p.username} : ${p.league} → ${newLeague}`)
      migrated++
    }
  }

  console.log(`\nMigration terminée : ${migrated}/${toMigrate.length} users mis à jour`)
}

main()
