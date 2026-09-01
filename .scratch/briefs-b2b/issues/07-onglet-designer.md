# 07 — L'onglet Brief côté designer

Status: ready-for-agent
Blocked by: 05

**Fichiers**
- Créer : `src/app/(dashboard)/dashboard/briefs/page.tsx` et `[id]/page.tsx`
- Modifier : `src/components/layout/Sidebar.tsx` et `FloatingNav.tsx`

---

- [ ] **Étape 1 — L'accès**

L'onglet est visible des seuls comptes dont `plan = 'pro'`.

⚠️ **À savoir, et à ne pas prendre pour un bug** : les 94 comptes actuels sont **tous**
en `plan='pro'` à cause de la promo (le trigger d'inscription pose `plan='pro'` jusqu'au
2026-12-31). Le filtre ne bloquera donc personne aujourd'hui. C'est un choix assumé de
Marwen, qui a été averti. Code le filtre quand même : il mordra quand la promo tombera.

- [ ] **Étape 2 — La liste**

Les briefs `status='published'` et `visibility='public'` dont `target_league_ids` est
vide **ou** contient la ligue du designer. Affiche : logo de l'entreprise, titre,
spécialité, date limite, places restantes.

Colonnes explicites dans le `select`, jamais `select('*')`.

- [ ] **Étape 3 — Fermé, pas caché**

Un brief dont la date limite est passée, ou dont le plafond de réponses est atteint,
s'affiche **fermé** et non masqué. Un designer doit pouvoir constater qu'il est arrivé
trop tard plutôt que de voir une liste rétrécir sans explication.

(Le nombre de réponses vient de la spec 2 ; tant qu'elle n'existe pas, considère qu'il
vaut zéro et n'invente pas de compteur.)

- [ ] **Étape 4 — La page d'un brief**

Contenu complet, entreprise (logo, nom, description, lien vers son site), échéance.
Bouton « Réaliser cet exercice » qui mène à un écran « bientôt » — c'est la couture
avec la spec 2, assumée.

- [ ] **Étape 5 — Vérifier**

```bash
npx tsc --noEmit && npx next build
```
Mesures :
- un brief ciblant une seule ligue n'apparaît **que** pour un designer de cette ligue ;
- un brief `pending_review` n'apparaît pour personne ;
- un brief **privé** n'apparaît pas dans cette liste (il ne s'atteint que par son lien) ;
- un brief dont l'échéance est passée s'affiche fermé.

Pour tester les ligues, modifie temporairement la ligue d'un compte de test — **pas
celle d'un vrai utilisateur** — et remets-la.

- [ ] **Étape 6 — Commiter**

```bash
git commit -am "feat(briefs): a Briefs tab for pro designers, filtered by league"
```
