import { notFound } from 'next/navigation'
import { LeagueForm } from '@/components/admin/LeagueForm'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface Props { params: Promise<{ id: string }> }

export default async function EditLeague({ params }: Props) {
  const { id } = await params

  const { data } = await (supabaseAdmin as any)
    .from('leagues')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) notFound()

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modifier la ligue</h1>
        <p className="text-sm text-muted-foreground">{data.icon} {data.name}</p>
      </div>
      <LeagueForm
        id={id}
        initial={{
          name: data.name,
          icon: data.icon,
          color: data.color,
          order_index: String(data.order_index),
          min_challenges: String(data.min_challenges),
          min_challenges_enabled: data.min_challenges_enabled ?? true,
          access: data.access,
          is_active: data.is_active,
        }}
      />
    </div>
  )
}
