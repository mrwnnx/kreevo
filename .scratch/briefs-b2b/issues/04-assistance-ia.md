# 04 — Assistance IA : le bouton « améliorer »

Status: ready-for-agent
Blocked by: 03

**Fichiers**
- Créer : `src/app/api/briefs/improve/route.ts`
- Modifier : `src/components/features/company/BriefForm.tsx`
- Modifier : `src/lib/ratelimit.ts` (un limiteur dédié)

---

- [ ] **Étape 1 — La route**

`POST /api/briefs/improve`, corps `{ field, value, context }` où `field` désigne le
champ concerné (titre, contexte, brief, contraintes, critères, livrable) et `context`
donne les autres champs déjà remplis, pour que la reformulation reste cohérente.

Elle renvoie **une proposition**, elle n'écrit rien en base. C'est le formulaire qui
décide d'appliquer ou non.

Réutilise `src/lib/anthropic/client.ts`. **N'importe rien depuis
`src/lib/utils/submissions.ts`** : ce fichier instancie le SDK au top-level et casse le
build Turbopack dès qu'un composant client se trouve dans la chaîne d'imports.

- [ ] **Étape 2 — Les gardes**

- **Authentification** : l'appelant doit être connecté et propriétaire d'une entreprise.
- **Plafond dédié** : ajoute `getBriefImproveRatelimit()` dans `src/lib/ratelimit.ts`,
  avec son **propre préfixe** — ne partage pas le seau de `getAiRatelimit()`, qui
  protège les routes de soumission. Clé : l'identifiant du compte.
- **Borne d'entrée** : refuse un `value` vide ou de plus de 4000 caractères, et un
  `field` hors de la liste attendue. Les routes de ce repo n'ont historiquement aucun
  garde-fou d'entrée ; n'en ajoute pas une de plus.

⚠️ Ce sont les seules routes du repo qui **dépensent de l'argent à chaque appel**. Le
plafond n'est pas décoratif.

⚠️ `getAiRatelimit()` est **fail-open** : sans `UPSTASH_REDIS_REST_URL`/`_TOKEN`, il
renvoie `null` et ne plafonne rien. Écris le tien sur le même modèle et **dis-le dans
ton rapport** — un plafond déployé ne prouve pas qu'il plafonne.

- [ ] **Étape 3 — Le bouton dans le formulaire**

Un bouton « améliorer » par champ. Au clic : état d'attente, puis la proposition est
montrée **à côté** de ce que l'entreprise a écrit, avec « accepter » ou « refuser ».
Ne remplace jamais le texte sans accord explicite — le B2B garde la main, c'est le sens
de l'option choisie.

Un seul appel en vol à la fois. Message d'erreur en clair si le plafond est atteint.

- [ ] **Étape 4 — Vérifier**

```bash
npx tsc --noEmit && npx next build
```
Mesures :
- un appel sur un champ renvoie bien une proposition, et **rien n'a changé en base** ;
- refuser laisse le texte d'origine intact ;
- un `field` inconnu et un `value` de 5000 caractères renvoient `400` ;
- un appelant non connecté renvoie `401`.

Compte les appels réellement partis chez Anthropic et donne le chiffre : personne ne
doit découvrir la facture après coup.

- [ ] **Étape 5 — Commiter**

```bash
git commit -am "feat(briefs): per-field AI rewrite, on demand only"
```
