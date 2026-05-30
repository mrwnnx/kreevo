import { TaxonomyForm } from '@/components/admin/TaxonomyForm'

export default function NewIndustry() {
  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvelle industrie</h1>
        <p className="text-sm text-muted-foreground">Labels FR / EN / AR.</p>
      </div>
      <TaxonomyForm kind="industry" />
    </div>
  )
}
