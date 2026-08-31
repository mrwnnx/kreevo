# 08 — `/discover` : feed mélangé et badge « validé »

Status: ready-for-agent
Blocked by: 01, 06

**Fichiers**
- Modifier : `src/app/(public)/discover/page.tsx`
- Modifier : le composant de carte utilisé par le feed

---

- [ ] **Étape 1 — Inclure les projets perso**

Le `select` du feed filtre aujourd'hui `.eq('validation_status', 'approved')`.
Le remplacer par `.or('kind.eq.portfolio,validation_status.eq.approved')`, et
ajouter `kind` aux colonnes lues.

Rappel de cadrage vérifié : **les filtres de `/discover` portent sur le profil de
l'auteur** (`specialty_id`, `country`, `tools`, `league`), pas sur la soumission.
Un projet perso hérite donc automatiquement des filtres de son auteur — il n'y a
**rien** à câbler côté filtres.

- [ ] **Étape 2 — Le badge**

Sur une carte, si `kind === 'challenge'`, afficher le badge « validé ». Un projet
perso ne porte **rien** : la distinction valorise le challenge au lieu de
stigmatiser le portfolio. Suivre le design system (pastel, pas de Material).

- [ ] **Étape 3 — Les cartes mènent à `/p/[id]`**

- [ ] **Étape 4 — Noter la dette, ne pas la traiter ici**

`/discover` charge **300** soumissions puis filtre en mémoire. Avec des projets
perso illimités, ce plafond deviendra faux — et **silencieusement** : le feed
cessera d'afficher tout, sans erreur. Hors périmètre de ce lot ; ouvrir un ticket
séparé plutôt que d'élargir celui-ci.

- [ ] **Étape 5 — Vérifier**

```bash
npx tsc --noEmit && npx next build
```
En navigation privée : le projet perso publié apparaît dans le feed, sans badge ;
un travail de challenge approuvé apparaît avec le badge ; un brouillon
n'apparaît pas. Vérifier qu'un filtre (spécialité, outil) laisse bien passer le
projet perso de l'auteur correspondant.

- [ ] **Étape 6 — Commiter**

```bash
git commit -am "feat(portfolio): mix personal projects into the public feed, badge the validated work"
```
