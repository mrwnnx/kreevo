'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

import { MultiStepSubmitForm } from '@/components/features/challenge/MultiStepSubmitForm'
import type { Profile, Submission } from '@/types/database.types'
import { getDict } from '@/lib/i18n/lang'

interface Props { params: Promise<{ id: string }> }

export default async function ChallengeSubmitPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: challenge },
    { data: participation },
    { data: existingSubmission },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('challenges').select('*').eq('id', id).single(),
    (supabase as any).from('participations').select('*').eq('challenge_id', id).eq('user_id', user.id).single(),
    (supabase.from('submissions') as any).select('*').eq('challenge_id', id).eq('user_id', user.id).single(),
  ])

  if (!profile) redirect('/login')
  if (!challenge) notFound()
  if (!participation) redirect(`/dashboard/challenges/${id}`)

  const c = challenge as any
  const p = profile as Profile
  const deadlinePassed = new Date(participation.personal_deadline) < new Date()
  if (deadlinePassed || participation.status === 'expired') redirect(`/dashboard/challenges/${id}`)

  const maxAttempts = p.plan === 'pro' ? 3 : 2
  const currentAttempts = (existingSubmission as any)?.attempt_number ?? (existingSubmission ? 1 : 0)
  const wasDraft = (existingSubmission as any)?.is_draft ?? false
  const attemptsLeft = wasDraft ? maxAttempts : maxAttempts - currentAttempts
  if (!wasDraft && attemptsLeft <= 0) redirect(`/dashboard/challenges/${id}`)

  const dict = await getDict()

  // Pre-populate the coworkers picker with the user's current invitations on this submission
  // (any status — author keeps control over the full set, including declined ones can be re-invited).
  let existingCoworkers: Array<{ id: string; username: string; full_name: string | null; avatar_url: string | null; status: 'pending' | 'accepted' | 'declined' }> = []
  if (existingSubmission) {
    const { data: cwRows } = await (supabase as any)
      .from('submission_coworkers')
      .select('status, profiles:user_id(id, username, full_name, avatar_url)')
      .eq('submission_id', (existingSubmission as any).id)
    existingCoworkers = ((cwRows ?? []) as Array<{ status: any; profiles: any }>)
      .filter((r) => r.profiles)
      .map((r) => ({ ...r.profiles, status: r.status }))
  }

  return (
    <MultiStepSubmitForm
      challengeId={c.id}
      challengeTitle={c.title}
      participationId={participation.id}
      attemptsLeft={attemptsLeft}
      existing={existingSubmission as Submission | null}
      existingCoworkers={existingCoworkers}
      t={dict.submitForm}
    />
  )
}
