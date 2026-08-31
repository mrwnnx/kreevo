# 03 — Formulaire d'ajout d'un projet perso

Status: ready-for-agent
Blocked by: 01

**Fichiers**
- Créer : `src/app/(dashboard)/dashboard/projects/new/page.tsx`
- Créer : `src/components/features/portfolio/ProjectForm.tsx`
- Créer : `src/components/features/portfolio/actions.ts`
- Réutiliser sans modifier : `src/components/ui/ImageUpload.tsx`

**Interfaces produites**
```ts
// src/components/features/portfolio/actions.ts
export async function saveProject(formData: FormData): Promise<
  { ok: true; id: string } | { ok: false; error: string }
>
```
Champs attendus dans le `FormData` : `id?` (édition), `coverUrl`, `photos`
(JSON `{url,caption}[]`), `title`, `description`, `link`, `specialtyId`,
`industryId`, `projectTypeId`, `tools` (JSON `string[]`), `publish` (`'1'` pour
publier, absent pour brouillon).

---

- [ ] **Étape 1 — L'action serveur**

Un seul point d'écriture, création et édition confondues. Points non
négociables :

```ts
'use server'
// ...
const row = {
  kind: 'portfolio' as const,
  challenge_id: null,
  user_id: user.id,
  cover_url: coverUrl,
  title, description,
  files: { link, images: photos },   // même forme que le formulaire de challenge
  specialty_id: specialtyId,
  industry_id: industryId,
  project_type_id: projectTypeId,
  tools,
  is_draft: !publish,
  is_visible: publish,
  // AUCUNE écriture de validation_status, xp_*, ai_* : un projet perso n'y touche pas.
}
```

⚠️ **Ne rien importer depuis `src/lib/utils/submissions.ts`** dans un module
consommé par un composant client : ce fichier instancie le SDK Anthropic au
top-level, et Next 16 + Turbopack fait échouer le build en aval
(« dangerouslyAllowBrowser »). Les constantes pures vivent dans
`submission-constants.ts`.

⚠️ Vérifier la propriété avant tout `update` en édition :
`.eq('id', id).eq('user_id', user.id)`.

- [ ] **Étape 2 — Le formulaire**

Page unique, pas de multi-étapes (le formulaire de challenge n'en a deux que
pour l'analyse IA, absente ici). Dans l'ordre :

1. Couverture — `<ImageUpload bucket="submissions" />`, obligatoire
2. Photos supplémentaires, chacune avec sa légende
3. Titre — obligatoire
4. Description
5. Lien du projet — optionnel
6. Spécialité, industrie, type de projet, outils — **obligatoires**
7. Deux boutons : « Enregistrer en brouillon » et « Publier »

Les listes déroulantes lisent `specialties`, `industries` et `challenge_types`
côté serveur dans `page.tsx` et sont passées en props. Le libellé suit la langue
active : ces trois tables portent `name_fr`, `name_en`, `name_ar`.

Validation client avant envoi : couverture présente, titre non vide, et les
quatre champs de taxonomie renseignés. Message d'erreur en clair, pas de bouton
désactivé sans explication.

- [ ] **Étape 3 — Vérifier**

```bash
npx tsc --noEmit && npx next build
```
Puis, serveur de dev lancé, jouer le parcours : créer un projet, l'enregistrer
en brouillon, le rouvrir, le publier.

```bash
set -a && . .env.local && set +a
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/submissions?select=id,kind,is_draft,is_visible,challenge_id,validation_status,xp_earned&kind=eq.portfolio" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```
Attendu sur la ligne créée : `kind=portfolio`, `challenge_id=null`,
`validation_status=null`, `xp_earned=null`, et `is_draft` qui suit le bouton
cliqué.

- [ ] **Étape 4 — Prouver la visibilité publique**

En **anonyme**, depuis un terminal :
```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/submissions?select=id,title&kind=eq.portfolio" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```
Attendu : le projet **publié** apparaît, le **brouillon** non.

- [ ] **Étape 5 — Commiter**

```bash
git commit -am "feat(portfolio): add the project creation form and its server action"
```
