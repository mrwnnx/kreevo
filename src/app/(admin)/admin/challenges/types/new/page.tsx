import { TaxonomyForm } from '@/components/admin/TaxonomyForm'

export default function NewChallengeType() {
  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouveau type de challenge</h1>
        <p className="text-sm text-muted-foreground">Labels FR / EN / AR.</p>
      </div>
      <TaxonomyForm kind="type" />
    </div>
  )
}
