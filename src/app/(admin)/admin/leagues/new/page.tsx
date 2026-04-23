import { LeagueForm } from '@/components/admin/LeagueForm'

export default function NewLeague() {
  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvelle ligue</h1>
        <p className="text-sm text-muted-foreground">Crée une nouvelle ligue de challenges.</p>
      </div>
      <LeagueForm />
    </div>
  )
}
