import { notFound } from 'next/navigation'
import { TaxonomyForm } from '@/components/admin/TaxonomyForm'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface Props { params: Promise<{ id: string }> }

export default async function EditIndustry({ params }: Props) {
  const { id } = await params
  const { data } = await (supabaseAdmin as any)
    .from('industries')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) notFound()

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modifier l&apos;industrie</h1>
        <p className="text-sm text-muted-foreground">{data.name_fr ?? data.name_en ?? data.name_ar}</p>
      </div>
      <TaxonomyForm
        kind="industry"
        id={id}
        initial={{
          name: { fr: data.name_fr ?? '', en: data.name_en ?? '', ar: data.name_ar ?? '' },
          status: data.translation_status ?? undefined,
          display_order: String(data.display_order ?? 0),
        }}
      />
    </div>
  )
}
