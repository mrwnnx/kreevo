import { ChallengeForm } from '@/components/admin/ChallengeForm'

export default function NewChallenge() {
  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouveau challenge</h1>
        <p className="text-sm text-muted-foreground">Crée un challenge mensuel manuellement ou avec l'IA.</p>
      </div>
      <ChallengeForm />
    </div>
  )
}
