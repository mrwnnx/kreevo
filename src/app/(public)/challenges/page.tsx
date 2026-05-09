import { getDict } from '@/lib/i18n/lang'

export default async function ChallengesPage() {
  const dict = await getDict()
  return (
    <main className="container mx-auto py-12">
      <h1 className="text-3xl font-bold">{dict.publicChallenges.title}</h1>
    </main>
  )
}
