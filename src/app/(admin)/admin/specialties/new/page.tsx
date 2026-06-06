import { SpecialtyForm } from '@/components/admin/SpecialtyForm'

export default function NewSpecialty() {
  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvelle spécialité</h1>
        <p className="text-sm text-muted-foreground">Slug auto-suggéré (immuable ensuite). Active = visible dans l&apos;onboarding.</p>
      </div>
      <SpecialtyForm />
    </div>
  )
}
