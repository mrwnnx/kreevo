# 08 — La page du lien privé, `noindex` et sitemap

Status: ready-for-agent
Blocked by: 05

**Fichiers**
- Créer : `src/app/(public)/brief/[token]/page.tsx`
- Modifier : `src/app/sitemap.ts` et `src/app/robots.txt` si nécessaire

---

## C'est le lot le plus risqué du chantier

Une erreur ici expose le **sujet confidentiel d'un client** dans Google. Traite chaque
étape comme une frontière de sécurité, pas comme de l'affichage.

- [ ] **Étape 1 — La page**

`/brief/<token>` affiche un brief privé. Elle s'ouvre **sans compte** — le jeton est le
secret. Répondre exigera un compte, mais c'est la spec 2.

La lecture se fait par le **service role**, parce que la policy RLS du lot 01 ne rend un
brief lisible que s'il est publié ET public : un brief privé en est exclu par
construction. Compense en filtrant explicitement dans la requête :
`access_token = <token>` ET `visibility = 'private'` ET `status = 'published'`.
Tout le reste → `notFound()`.

⚠️ Un brief privé **en attente de validation** ne doit pas être lisible par son lien
non plus. C'est le cas limite que l'on oublie.

- [ ] **Étape 2 — `noindex`, et le prouver**

La page exporte des métadonnées avec `robots: { index: false, follow: false }`.

**Vérifie l'en-tête réellement servi**, pas seulement le code :
```bash
curl -s -D- -o /dev/null http://localhost:3000/brief/<token> | grep -i "x-robots\|<meta"
curl -s http://localhost:3000/brief/<token> | grep -i 'name="robots"'
```
Attendu : la directive `noindex` présente dans le HTML servi.

- [ ] **Étape 3 — Le sitemap**

`src/app/sitemap.ts` ne doit contenir **AUCUN brief, d'aucune sorte**.

Raison, et elle vaut d'être comprise : dans cette spec, « public » ne veut pas dire
« visible du monde entier ». Un brief public s'affiche dans l'onglet Brief des
designers ciblés, **derrière une connexion**. Il n'a donc aucune page publique à
indexer. Et un brief privé ne doit évidemment pas y être. Le sitemap ne bouge pas.

Vérifie le contenu réel :
```bash
curl -s http://localhost:3000/sitemap.xml | grep -c "/brief/"
```

- [ ] **Étape 4 — Le jeton ne doit fuiter nulle part**

Cherche activement : le jeton apparaît-il dans une réponse d'API, dans un attribut de
données, dans le HTML d'une autre page, dans les métadonnées Open Graph ? Le seul
endroit légitime est l'espace de l'entreprise propriétaire.

- [ ] **Étape 5 — Vérifier**

```bash
npx tsc --noEmit && npx next build
```
Mesures en **anonyme**, depuis un terminal :
- le bon jeton → 200 avec le contenu ;
- un jeton inventé → 404 ;
- le jeton d'un brief **encore en attente de validation** → 404 ;
- l'identifiant du brief utilisé à la place du jeton → 404 ;
- le brief privé n'apparaît ni dans `/dashboard/briefs`, ni dans le sitemap, ni dans
  aucune réponse d'API publique.

Supprime tes lignes de test et prouve-le.

- [ ] **Étape 6 — Commiter**

```bash
git commit -m "feat(briefs): private brief link, never indexed"
```
