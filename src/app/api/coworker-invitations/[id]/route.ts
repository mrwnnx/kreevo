import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/utils/notifications'
import { awardCoworkerXp, COWORKER_XP_SHARE } from '@/lib/utils/coworkers'

interface Params { params: Promise<{ id: string }> }

type Action = 'accept' | 'decline'

async function getInvitation(invitationId: string) {
  const { data } = await (supabaseAdmin as any)
    .from('submission_coworkers')
    .select('id, submission_id, user_id, invited_by, status, xp_awarded')
    .eq('id', invitationId)
    .single()
  return data as
    | { id: string; submission_id: string; user_id: string; invited_by: string; status: 'pending' | 'accepted' | 'declined'; xp_awarded: number }
    | null
}

async function getSubmissionMeta(submissionId: string) {
  const { data } = await (supabaseAdmin as any)
    .from('submissions')
    .select('id, challenge_id, validation_status, title, challenges(xp_reward)')
    .eq('id', submissionId)
    .single()
  return data as
    | { id: string; challenge_id: string; validation_status: string | null; title: string | null; challenges: { xp_reward: number | null } | null }
    | null
}

// Coworker responds to an invitation (accept/decline)
export async function POST(req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const action = body.action as Action | undefined
  if (action !== 'accept' && action !== 'decline') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const invitation = await getInvitation(id)
  if (!invitation) return NextResponse.json({ error: 'Invitation introuvable' }, { status: 404 })
  if (invitation.user_id !== user.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  if (invitation.status !== 'pending') {
    return NextResponse.json({ error: 'Invitation déjà traitée' }, { status: 409 })
  }

  const newStatus = action === 'accept' ? 'accepted' : 'declined'
  await (supabaseAdmin as any)
    .from('submission_coworkers')
    .update({ status: newStatus, responded_at: new Date().toISOString() })
    .eq('id', id)

  const sub = await getSubmissionMeta(invitation.submission_id)

  // Notify the author of the response
  await notify(
    invitation.invited_by,
    action === 'accept' ? 'coworker_invitation_accepted' : 'coworker_invitation_declined',
    {
      submission_id: invitation.submission_id,
      coworker_id: user.id,
    },
  )

  // If the submission is already approved, award XP share immediately on accept.
  let xpAwarded = 0
  if (action === 'accept' && sub?.validation_status === 'approved') {
    const baseXp = sub.challenges?.xp_reward ?? 150
    xpAwarded = await awardCoworkerXp(invitation.id, user.id, invitation.submission_id, baseXp)
  }

  return NextResponse.json({
    success: true,
    status: newStatus,
    xpAwarded,
    xpSharePct: Math.round(COWORKER_XP_SHARE * 100),
  })
}

// Author removes a coworker (or coworker leaves the submission)
export async function DELETE(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const invitation = await getInvitation(id)
  if (!invitation) return NextResponse.json({ error: 'Invitation introuvable' }, { status: 404 })

  const isAuthor = invitation.invited_by === user.id
  const isCoworker = invitation.user_id === user.id
  if (!isAuthor && !isCoworker) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  // Revoke any XP already awarded
  if (invitation.xp_awarded > 0) {
    const { revokeCoworkerXp } = await import('@/lib/utils/coworkers')
    await revokeCoworkerXp(invitation.id)
  }

  await (supabaseAdmin as any)
    .from('submission_coworkers')
    .delete()
    .eq('id', id)

  // If author kicked the coworker, ping them so they know.
  if (isAuthor && invitation.user_id !== user.id) {
    await notify(invitation.user_id, 'coworker_removed', {
      submission_id: invitation.submission_id,
    })
  }

  return NextResponse.json({ success: true })
}
