import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { confirmEmail } from '../actions'
import { getDict } from '@/lib/i18n/lang'

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDict()
  return {
    title: `${dict.auth.confirmEmail.title} — Kreevo`,
    robots: { index: false, follow: false },
  }
}

// Arrivée depuis le lien d'activation. Rien n'est consommé à l'affichage : les scanners
// de liens s'arrêtent au GET, seul le clic sur le bouton active le compte.
export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string }>
}) {
  const { token_hash = '', type = 'email' } = await searchParams
  const dict = await getDict()
  const t = dict.auth.confirmEmail

  return (
    <div className="card-sharp rounded-xl p-4 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-xs text-muted-foreground font-mono">{t.subtitle}</p>
      </div>
      <form action={confirmEmail}>
        <input type="hidden" name="token_hash" value={token_hash} />
        <input type="hidden" name="type" value={type} />
        <Button type="submit" className="w-full">{t.submit}</Button>
      </form>
    </div>
  )
}
