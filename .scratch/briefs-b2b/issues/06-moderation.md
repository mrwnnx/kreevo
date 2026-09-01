# 06 — Modération : validation du premier brief

Status: ready-for-agent
Blocked by: 05

**Fichiers**
- Modifier : `src/app/(admin)/admin/moderation/page.tsx` et `src/app/api/admin/moderation/route.ts`
- Créer : `src/app/api/admin/briefs/[id]/review/route.ts`

---

- [ ] **Étape 1 — La file**

Les briefs en `status='pending_review'` rejoignent la file admin existante, à côté des
contenus signalés, dans leur propre onglet. Affiche le nom de l'entreprise, son logo,
le titre et le contenu complet — Marwen doit pouvoir lire ce qui va atteindre ses
designers.

- [ ] **Étape 2 — Approuver et refuser**

`POST /api/admin/briefs/[id]/review`, corps `{ action: 'approve' | 'reject', reason? }`.

- **Approuver** : `status='published'`, `published_at=now()`, et
  `companies.first_brief_approved = true` — les briefs suivants de cette entreprise
  partiront directement.
- **Refuser** : `status='rejected'` et `rejection_reason` renseigné. Le motif est
  **obligatoire** : un refus sans explication est inutilisable pour l'entreprise.

Autorisation par `requireAdmin()` (`src/lib/admin.ts`), le motif du repo.

⚠️ **Deux leçons du chantier précédent, à ne pas réapprendre :**
- Les actions admin de ce repo **avalent silencieusement leurs erreurs**. Lis l'erreur,
  remonte-la, n'affiche un succès que s'il y en a un.
- Un `UPDATE` dont le `WHERE` ne matche aucune ligne renvoie `204` **sans erreur** :
  chaîne `.select('id')` et vérifie qu'une ligne a été touchée. Sur le chantier
  portfolio, ce piège a produit une suppression qui affichait « c'est fait » sans rien
  supprimer.

- [ ] **Étape 3 — Le retour côté entreprise**

Un brief refusé s'affiche comme tel dans la liste de l'entreprise, **avec son motif**,
et redevient modifiable. Le corriger et le republier le remet en `pending_review`.

- [ ] **Étape 4 — Vérifier**

```bash
npx tsc --noEmit && npx next build
```
Mesures :
- un brief `pending_review` apparaît dans la file admin ;
- l'approuver le rend visible en anonyme **et** passe `first_brief_approved` à `true` ;
- le brief suivant de la même entreprise part directement en `published` ;
- un refus sans motif est rejeté par la route ;
- un appelant non-admin reçoit `403`.

Supprime tes lignes de test et prouve-le.

- [ ] **Étape 5 — Commiter**

```bash
git commit -am "feat(briefs): review the first brief of each company"
```
