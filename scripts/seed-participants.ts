import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ndflytgtduuvacjmdobc.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZmx5dGd0ZHV1dmFjam1kb2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjcwMTk5MSwiZXhwIjoyMDkyMjc3OTkxfQ.7gKvxIij7iyp9M84gThduKF4nhRKYkR5RDggThyVKAs'

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
