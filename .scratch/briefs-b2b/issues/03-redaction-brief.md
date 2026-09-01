# 03 — Rédaction du brief et brouillon

Status: ready-for-agent
Blocked by: 02

**Fichiers**
- Créer : `src/app/(company)/company/briefs/page.tsx` — la liste
- Créer : `src/app/(company)/company/briefs/new/page.tsx` et `[id]/edit/page.tsx`
- Créer : `src/components/features/company/BriefForm.tsx`, et l'action serveur

**Interfaces produites**
```ts
export async function saveBrief(formData: FormData): Promise<
  { ok: true; id: string } | { ok: false; error: string }
>
```
Champs : `id?`, `title`, `context`, `brief`, `constraints`, `criteria`, `deliverable`,
`specialtyId`, `industryId`, `projectTypeId`.

---

- [ ] **Étape 1 — Le formulaire**

Un formulaire normal, un champ par élément du brief : titre, contexte, brief,
contraintes, critères, livrable. Plus la taxonomie (spécialité, industrie, type de
projet), qui servira à filtrer et à afficher.

**Le brief est écrit dans une seule langue**, celle de l'entreprise. Aucune traduction,
aucun champ `_fr`/`_en`/`_ar` — c'est une décision de la spec, pas un oubli.

⚠️ Les listes déroulantes lisent `specialties`, `industries` et `challenge_types`. Ces
tables portent `name_fr`, `name_en`, `name_ar` — pas une simple colonne `name`.

- [ ] **Étape 2 — Brouillon et édition**

Enregistrer laisse le brief en `status='draft'`. Rien n'est exigé pour un brouillon :
une entreprise doit pouvoir sauvegarder trois lignes et revenir demain.

L'édition réutilise le même formulaire pré-rempli. Vérifie la propriété **côté
serveur** : le brief doit appartenir à la `companies` dont `owner_id` est l'appelant.
Un brief d'une autre entreprise → `notFound()`, pas un 403 (un 403 confirmerait que
l'identifiant existe).

- [ ] **Étape 3 — La liste des briefs de l'entreprise**

Brouillons et briefs publiés ensemble, avec leur statut lisible. Colonnes explicites
dans le `select`, jamais `select('*')`.

- [ ] **Étape 4 — Vérifier**

```bash
npx tsc --noEmit && npx next build
```
Parcours joué : créer un brouillon presque vide, le retrouver, le compléter.
Puis, depuis un **autre** compte entreprise, tenter d'ouvrir l'édition du premier →
404 attendu, et **vérifie en base qu'aucune ligne n'a bougé**.
Supprime tes lignes de test et prouve-le.

- [ ] **Étape 5 — Commiter**

```bash
git commit -am "feat(briefs): write and draft a brief"
```
