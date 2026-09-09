'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateBriefAccessToken } from '@/lib/utils/brief-token'
import { endOfDayUTC, parseMaxResponses, validateBriefFields } from './validate'

/**
 * saveBrief — crée ou met à jour un brief, brouillon ou publication. RLS
 * (`briefs_owner_write`/`briefs_owner_update`) exige déjà role='b2b' et une
 * `company_id` appartenant à l'appelant — cette action applique les mêmes règles
 * côté client, et double-vérifie par `.eq('company_id', ...)` + `.select('id')`
 * plutôt que de conclure au succès sur l'absence d'erreur (un UPDATE qui ne
 * matche aucune ligne renvoie 204 sans erreur).
 *
 * Piège connu de ce chantier : un <select> non rempli poste '' — jamais un uuid
 * valide. Les trois colonnes de taxonomie sont coercées explicitement en null,
 * même logique pour `deadlineAt` (date vide) et `maxResponses` (plafond vide).
 * Un brouillon n'exige rien côté contenu : tous les champs texte deviennent null
 * s'ils sont vides, ce qui correspond à des colonnes texte nullables.
 *
 * Les règles de validation (plafond < 1 toujours refusé, échéance passée
 * refusée seulement à la publication) vivent dans `./validate.ts`, en pur —
 * sans import Supabase/Next — pour rester exerçables par un script hors
 * requête serveur. `deadlineAt` est stockée comme la FIN de la journée
 * calendaire UTC choisie (`endOfDayUTC`), pas son début — sinon "aujourd'hui"
 * serait toujours déjà "passé" au moment de publier, et un futur lot qui lit
 * la même colonne (fermeture à l'échéance) verrait une date différente de
 * celle validée ici.
 *
 * Visibilité et jeton : la contrainte `briefs_private_needs_token` impose
 * privé ⇔ jeton présent. `visibility` et `access_token` sont donc toujours
 * écrits ensemble, dans la même requête — jamais l'un sans l'autre — pour que
 * le passage public→privé et l'inverse restent une seule écriture atomique.
 * Le jeton n'est régénéré qu'au moment de ce passage ; resauvegarder un brief
 * déjà privé conserve son jeton (seule la route /api/briefs/[id]/token le
 * change).
 */
export async function saveBrief(formData: FormData): Promise<
  { ok: true; id: string } | { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  const { data: company } = await supabase
    .from('companies')
    .select('id, can_publish, first_brief_approved')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!company) return { ok: false, error: 'no_company' }

  const id = ((formData.get('id') as string | null) ?? '').trim() || null

  const str = (key: string) => {
    const v = ((formData.get(key) as string | null) ?? '').trim()
    return v || null
  }

  const payload = {
    title: str('title'),
    context: str('context'),
    brief: str('brief'),
    constraints: str('constraints'),
    criteria: str('criteria'),
    deliverable: str('deliverable'),
    // Les 3 colonnes uuid nullables — jamais '' en base, seul '' peut matcher ici.
    specialty_id: str('specialtyId'),
    industry_id: str('industryId'),
    project_type_id: str('projectTypeId'),
  }

  const visibility = (formData.get('visibility') as string | null) === 'private' ? 'private' : 'public'
  // Cases décochées absentes de FormData par nature — un tableau vide (rien
  // envoyé, ou toutes les ligues actives cochées, cf. BriefForm) signifie
  // "toutes les ligues".
  const targetLeagueIds = formData.getAll('targetLeagueIds').map(String).filter(Boolean)

  const deadlineRaw = str('deadlineAt')
  const deadlineAt = deadlineRaw ? endOfDayUTC(deadlineRaw) : null // fin de journée, cf. validate.ts

  const maxResponsesRaw = str('maxResponses')
  const maxResponses = parseMaxResponses(maxResponsesRaw)

  const action = (formData.get('action') as string | null) === 'publish' ? 'publish' : 'draft'

  const validation = validateBriefFields({
    action,
    title: payload.title,
    brief: payload.brief,
    deliverable: payload.deliverable,
    deadlineAt,
    maxResponsesRaw,
    canPublish: company.can_publish,
  })
  if (!validation.ok) return validation

  const publishFields =
    action === 'publish'
      ? company.first_brief_approved
        ? { status: 'published', published_at: new Date().toISOString() }
        : { status: 'pending_review' }
      : {}

  if (id) {
    const { data: current } = await supabase
      .from('briefs')
      .select('visibility, access_token')
      .eq('id', id)
      .eq('company_id', company.id)
      .maybeSingle()
    if (!current) return { ok: false, error: 'not_found' }

    const accessToken =
      visibility === 'private'
        ? current.visibility === 'private' && current.access_token
          ? current.access_token
          : generateBriefAccessToken()
        : null

    const { data, error } = await supabase
      .from('briefs')
      .update({
        ...payload,
        visibility,
        target_league_ids: targetLeagueIds,
        deadline_at: deadlineAt,
        max_responses: maxResponses,
        access_token: accessToken,
        ...publishFields,
      })
      .eq('id', id)
      .eq('company_id', company.id)
      .select('id')

    if (error || !data || data.length === 0) return { ok: false, error: 'not_found' }
    revalidatePath('/company/briefs')
    revalidatePath(`/company/briefs/${id}/edit`)
    return { ok: true, id }
  }

  const accessToken = visibility === 'private' ? generateBriefAccessToken() : null

  const { data, error } = await supabase
    .from('briefs')
    .insert({
      ...payload,
      company_id: company.id,
      visibility,
      target_league_ids: targetLeagueIds,
      deadline_at: deadlineAt,
      max_responses: maxResponses,
      access_token: accessToken,
      ...publishFields,
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: 'save_failed' }
  revalidatePath('/company/briefs')
  return { ok: true, id: data.id }
}

/**
 * Fenêtres de la question « délai » du wizard, en jours. `unsure` n'est pas
 * dans la table : une réponse « je ne sais pas » ne doit poser AUCUNE
 * échéance — mieux vaut une date absente qu'une date inventée, que
 * l'entreprise ne verrait jamais avant qu'elle ne fasse fermer son brief.
 */
const WIZARD_TIMELINE_DAYS: Record<string, number> = { days: 7, weeks: 21, month: 45 }

/**
 * createBriefFromWizard — crée le BROUILLON issu du wizard (maquette Figma
 * `579:475`), puis rend la main au formulaire complet pour la publication.
 *
 * Le wizard ne couvre pas les réglages de diffusion (visibilité, ligues
 * ciblées, plafond de réponses) : la maquette n'en montre aucun. Ils gardent
 * donc les défauts de la table (`visibility='public'`, aucune ligue = toutes)
 * et se règlent à l'étape suivante, dans `BriefForm`. Rien n'est publiable
 * d'ici : `status` reste `draft`, le trigger `guard_brief_publish` reste le
 * seul chemin vers `published`.
 *
 * Les libellés composés (titre, contraintes) arrivent déjà écrits du client :
 * lui seul connaît la langue affichée et le nom traduit des options. Le
 * serveur ne refait pas ce travail, il ne recalcule que ce qui ne doit pas
 * dépendre de l'horloge du visiteur — l'échéance.
 */
export async function createBriefFromWizard(formData: FormData): Promise<
  { ok: true; id: string } | { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!company) return { ok: false, error: 'no_company' }

  const str = (key: string) => {
    const v = ((formData.get(key) as string | null) ?? '').trim()
    return v || null
  }

  // Budget : facultatif, jamais négatif (la contrainte `briefs_budget_non_
  // negative` dirait la même chose, mais en 23514 illisible côté écran).
  const budgetRaw = str('budget')
  let budget: number | null = null
  if (budgetRaw !== null) {
    const parsed = Number(budgetRaw.replace(/\s/g, ''))
    if (!Number.isFinite(parsed) || parsed < 0) return { ok: false, error: 'invalid_budget' }
    budget = parsed
  }

  const timelineDays = WIZARD_TIMELINE_DAYS[str('timeline') ?? '']
  const deadlineAt =
    timelineDays === undefined
      ? null
      : endOfDayUTC(new Date(Date.now() + timelineDays * 86_400_000).toISOString().slice(0, 10))

  const { data, error } = await supabase
    .from('briefs')
    .insert({
      company_id: company.id,
      title: str('title'),
      context: str('context'),
      brief: str('brief'),
      constraints: str('constraints'),
      project_type_id: str('projectTypeId'),
      budget,
      deadline_at: deadlineAt,
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: 'save_failed' }
  revalidatePath('/company/briefs')
  return { ok: true, id: data.id }
}
