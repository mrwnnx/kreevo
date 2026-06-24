import { supabaseAdmin } from '@/lib/supabase/admin'
import { Mail, Calendar, Hash } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminHireWaitlistPage() {
  const { data: entries, error } = await (supabaseAdmin as any)
    .from('hire_waitlist')
    .select('id, email, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-8">
        <p className="text-destructive">Erreur : {error.message}</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Waitlist recrutement</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {entries?.length ?? 0} inscription{entries?.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-mono">Email</th>
              <th className="px-4 py-3 font-mono">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries?.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Aucune inscription pour le moment.
                </td>
              </tr>
            ) : (
              entries?.map((entry: { id: string; email: string; created_at: string }) => (
                <tr key={entry.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{entry.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
