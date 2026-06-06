import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SpecialtyForm } from '@/components/admin/SpecialtyForm'

interface Props { params: Promise<{ id: string }> }

export default async function EditSpecialty({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('specialties')
    .select('id, slug, name, name_fr, name_en, name_ar, emoji, order_index, is_active')
    .eq('id', id)
    .single()

  if (!data) notFound()

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modifier la spécialité</h1>
        <p className="text-sm text-muted-foreground">Le slug est verrouillé (référencé par les FK).</p>
      </div>
      <SpecialtyForm
        id={id}
        initial={{
          slug: data.slug,
          name: data.name ?? '',
          name_fr: data.name_fr ?? '',
          name_en: data.name_en ?? '',
          name_ar: data.name_ar ?? '',
          emoji: data.emoji ?? '',
          order_index: data.order_index ?? 0,
          is_active: data.is_active,
        }}
      />
    </div>
  )
}
