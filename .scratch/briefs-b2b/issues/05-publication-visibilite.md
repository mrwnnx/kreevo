# 05 — Publication : visibilité, ligues, échéance, plafond

Status: ready-for-agent
Blocked by: 03

**Fichiers**
- Modifier : `src/components/features/company/BriefForm.tsx` (écran de publication)
- Modifier : l'action serveur des briefs
- Créer : `src/app/api/briefs/[id]/token/route.ts` (régénération du jeton)

---

- [ ] **Étape 1 — L'écran de publication**

Au moment de publier, l'entreprise choisit :
- **la visibilité** : publique ciblée, ou privée par lien ;
- **les ligues** si publique — cases à cocher, **toutes cochées par défaut**. Un B2B qui
  ne comprend pas le système de ligues ne doit pas publier dans le vide ;
- **la date limite** ;
- **le plafond de réponses**.

Le contenu doit être complet pour publier (titre, brief, livrable au minimum) — alors
qu'un brouillon n'exige rien. Dis dans le message d'erreur **laquelle des deux règles**
s'applique : « un titre est requis pour publier » est utile, « un titre est requis »
sur un brouillon serait faux.

- [ ] **Étape 2 — Le jeton du lien privé**

Un brief privé reçoit un `access_token` imprévisible — utilise `crypto.randomUUID()`
deux fois concaténées, ou `crypto.randomBytes(24).toString('base64url')`. **Jamais**
un identifiant séquentiel ni un hash du titre.

La contrainte posée au lot 01 impose : privé ⇔ jeton présent. Un brief public ne doit
pas en porter.

`POST /api/briefs/[id]/token` régénère le jeton et invalide l'ancien lien. Vérifie la
propriété, et **conditionne le succès à une ligne réellement modifiée** — un `UPDATE`
qui ne matche rien renvoie `204` sans erreur.

- [ ] **Étape 3 — Le statut à la publication**

- Si la `companies` a `first_brief_approved = false` → `status = 'pending_review'`.
- Sinon → `status = 'published'`, `published_at = now()`.
- Si `can_publish = false` → refus explicite avec un message clair. (Ce drapeau vaut
  `true` par défaut aujourd'hui ; il existe pour l'abonnement futur.)

- [ ] **Étape 4 — Vérifier**

```bash
npx tsc --noEmit && npx next build
```
Mesures, en base :
- premier brief d'une entreprise → `pending_review`, et **invisible en anonyme** ;
- après passage de `first_brief_approved` à `true`, le brief suivant → `published` ;
- un brief privé porte un jeton, un brief public n'en porte pas (la contrainte doit
  rejeter l'inverse — teste-le) ;
- régénérer le jeton change bien la valeur, et l'ancien ne correspond plus.

Supprime tes lignes de test et prouve-le.

- [ ] **Étape 5 — Commiter**

```bash
git commit -am "feat(briefs): publish with visibility, league targeting, deadline and cap"
```
