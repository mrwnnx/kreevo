import { createClient } from '@/lib/supabase/server'
import { ChallengeForm, type ChallengeFormInitial } from '@/components/admin/ChallengeForm'

interface Props {
  searchParams: Promise<{ specialty_id?: string; league_id?: string }>
}

// PHASE 6D — slug → texte attendu par le ChallengeForm (3 valeurs hardcodées).
// graphic = 1:1. ux_ui = ambigu (UX vs UI) → on NE pré-remplit PAS (option A) :
// l'admin tranche au step 0, mais la ligue reste pré-remplie.
function slugToFormSpecialty(slug: string | null | undefined): string | undefined {
  if (slug === 'graphic') return 'Graphic Designer'
  return undefined // ux_ui (ambigu) ou inconnu → pas de pré-remplissage
}

export default async function NewChallenge({ searchParams }: Props) {
  const { specialty_id, league_id } = await searchParams

  // Résolution specialty_id → slug → texte (création contextuelle depuis 6C).
  let specialtyText: string | undefined
  if (specialty_id) {
    const supabase = await createClient()
    const { data: spec } = await (supabase as any)
      .from('specialties')
      .select('slug')
      .eq('id', specialty_id)
      .eq('is_active', true)
      .maybeSingle()
    specialtyText = slugToFormSpecialty(spec?.slug) // undefined si non résolu / ambigu
  }

  // initial seulement si un contexte exploitable est passé (specialty texte et/ou ligue).
  const initial: ChallengeFormInitial | undefined =
    specialtyText || league_id
      ? { ...(specialtyText ? { specialty: specialtyText } : {}), ...(league_id ? { league_id } : {}) }
      : undefined

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouveau challenge</h1>
        <p className="text-sm text-muted-foreground">Crée un nouveau challenge.</p>
      </div>
      <ChallengeForm initial={initial} />
    </div>
  )
}
