# 09 — Réorganiser son portfolio : épingler et ordonner

Status: ready-for-agent
Blocked by: 07

**Fichiers**
- Créer : `src/app/api/projects/order/route.ts` (PATCH)
- Modifier : `src/app/(public)/u/[username]/page.tsx` (mode « Organiser »)
- Créer : le composant client de réordonnancement

---

- [ ] **Étape 1 — La route d'ordre**

`PATCH /api/projects/order`, corps : `{ items: { id: string; position: number }[] }`.

- écrit `portfolio_position` en une passe ;
- vérifie que **toutes** les lignes appartiennent à l'appelant, en une requête,
  et rejette l'ensemble en `403` si une seule ne lui appartient pas — ne jamais
  écrire partiellement ;
- **rejette en `400` un tableau vide ou de plus de 200 entrées**, et toute
  `position` qui n'est pas un entier positif. Les routes de Kreevo n'ont
  historiquement aucun garde-fou d'entrée ; ne pas en ajouter une de plus.

Épinglage : `pinned_at = now()` ou `null`. Décision : **un seul épinglé à la
fois** — épingler un projet dépingle le précédent. Plus simple à comprendre
qu'un nombre libre d'épingles, et évite un portfolio entièrement épinglé.

- [ ] **Étape 2 — Le mode « Organiser »**

Visible du seul propriétaire, sur son propre `/u/[username]`. Un interrupteur
bascule la grille en mode réordonnable : glisser-déposer, une icône d'épingle par
carte, un bouton « Terminer » qui envoie l'ordre.

Sur mobile, le glisser-déposer est pénible : prévoir des flèches « monter /
descendre » en repli.

- [ ] **Étape 3 — Vérifier**

```bash
npx tsc --noEmit && npx next build
```
Réordonner, recharger la page → l'ordre tient. Épingler un projet → il passe en
tête. Épingler un second → le premier est dépinglé. Puis, depuis un autre
compte, envoyer un `PATCH` sur `/api/projects/order` contenant l'id d'un projet qui ne lui appartient pas →
attendu `403`, et **aucune** ligne modifiée (le vérifier en base, pas seulement
au code de retour).

- [ ] **Étape 4 — Commiter**

```bash
git commit -am "feat(portfolio): let an author pin and reorder their whole showcase"
```
