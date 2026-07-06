import { createClient } from '@supabase/supabase-js'

// Run with: npx tsx --env-file=.env.local scripts/seed-participants.ts
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const CHALLENGE_ID = '5cb81391-c8b4-4db0-b542-e1c6a6a49006'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function seed() {
  // Fetch existing profiles (up to 15)
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, username')
    .limit(15)

  if (profErr || !profiles?.length) {
    console.error('Could not fetch profiles:', profErr?.message)
    process.exit(1)
  }
  console.log(`Found ${profiles.length} existing profiles`)

  const deadline = new Date(Date.now() + 3 * 86400000).toISOString()

  const participations = profiles.map(p => ({
    user_id: p.id,
    challenge_id: CHALLENGE_ID,
    status: 'active',
    personal_deadline: deadline,
  }))

  const { error: partErr } = await supabase
    .from('participations')
    .upsert(participations, { onConflict: 'user_id,challenge_id' })

  if (partErr) {
    console.error('Participation insert error:', partErr.message)
    process.exit(1)
  }
  console.log(`✓ ${participations.length} participations upserted`)
  console.log(`\nDone! Visit /dashboard/challenges/${CHALLENGE_ID}`)
}

seed()
