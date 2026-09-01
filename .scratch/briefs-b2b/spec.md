# Briefs B2B — spec 1 : le brief et sa diffusion

**Date** : 2026-09-01
**Branche** : `feat/briefs-b2b`, partie de `main` (et non de `feat/portfolio-projets`, non validée)
**État** : spec validée en cadrage, plan d'implémentation à écrire

## Le problème

Kreevo n'a aujourd'hui qu'un seul type de compte utile — le designer — et une seule
source de sujets : les **74 challenges publiés, écrits par les 4 admins**. Rien ne
permet à une entreprise de venir poser son propre sujet devant la communauté.

L'objectif : une entreprise s'inscrit, rédige un brief, choisit qui le voit, et les
designers concernés le découvrent dans un onglet dédié.

## Ce que le terrain dit (mesuré le 2026-09-01, pas supposé)

| Constat | Conséquence |
|---|---|
| **Aucune notion de B2B n'existe** : `profiles.role` ne connaît que `user` et `admin` | Tout est à créer |
| **`hire_waitlist` contient 1 ligne**, et `/hire` est une page « bientôt disponible » | La demande B2B n'est prouvée par personne. Construire le plus court chemin vers un vrai client, pas la plateforme complète |
| **Les 94 comptes sont en `plan: 'pro'`** (promo en cours) | Le filtre « réservé aux Pro » ne bloquera personne tant que la promo dure. Assumé par Marwen |
| **`challenges` contient déjà** `brief`, `context`, `constraints`, `criteria`, `deliverable` (×3 langues), `league_id`, la taxonomie, `deadline_days` | La structure d'un brief est éprouvée : on la reprend, sans réutiliser la table |
| **Solo Experience ne fait AUCUNE IA** : `generate()` calcule un parcours puis affiche un écran d'attente de 1900 ms | L'assistance IA à la rédaction est entièrement à construire. Seule la plomberie Anthropic existe |

## Décisions produit (arbitrées par Marwen)

1. **Inscription B2B libre**, en ligne, sans validation préalable du compte. Le seul
   verrou est celui du point 2 — pas deux.
2. **Garde-fou = le premier brief est validé par Marwen** avant d'être visible. Les
   suivants partent directement.
3. **Le brief est un objet séparé du challenge**, dans son propre onglet.
4. **L'onglet Brief est réservé aux comptes `plan = 'pro'`.** Marwen a maintenu ce
   choix après avoir été averti qu'il ne filtre personne aujourd'hui.
5. **Tout brief demande un exercice à réaliser** (pas de simple candidature).
6. **Aucune mission rémunérée**, aucun montant affiché nulle part, Kreevo ne touche
   pas à l'argent.
7. **Les réponses sont définitivement privées**, visibles du seul B2B. ⚠️ Ceci écarte
   une phrase antérieure de Marwen (« il peut afficher sa soumission comme les
   challenges ») — la contradiction lui a été soumise, il a tranché pour le privé.
8. **Date limite ET plafond de réponses**, les deux.
9. **Inscription** : nom de la compagnie et logo **obligatoires** ; description, URL,
   localisation **facultatives**.
10. **Abonnement payant plus tard** : on prépare l'emplacement (`can_publish`), on ne
    construit rien.
11. **Assistance IA** : formulaire libre + bouton « améliorer » champ par champ.

### Décisions prises par Claude, renversables

- **Le lien privé est un jeton secret, sans mot de passe.** Un mot de passe transmis
  dans le même email que le lien ne protège de rien et ajoute une friction. Le vrai
  verrou est le compte obligatoire pour répondre : on sait qui entre.
- **Le brief n'est pas multilingue.** Les challenges le sont parce que Marwen les
  écrit. Une entreprise écrit dans sa langue, une fois ; on stocke et affiche tel
  quel. Traduire automatiquement le document d'un client, c'est endosser la
  responsabilité d'un contresens.

## Architecture : réutiliser la porte d'entrée, ajouter un badge

`profiles.role` gagne la valeur `b2b`, et une table `companies` porte les
informations d'entreprise.

**Ce qu'on ne refait pas** : inscription, connexion, connexion Google, mot de passe
oublié, session, règles RLS. C'est beaucoup de code éprouvé, et c'est ce qui casse le
plus salement quand on le duplique.

**Le prix payé** : le compte d'une entreprise gardera des colonnes de designer vides
(`league`, `xp`, `specialty`). Moche en base, invisible pour l'utilisateur — le même
compromis que `submissions.kind`, qui a tenu sur dix lots.

### Alternatives écartées

- **Authentification entièrement séparée** : un deuxième « mot de passe oublié », une
  deuxième mécanique de session, un middleware qui gère deux mondes. Plusieurs fois le
  travail, pour un gain que personne ne voit.
- **Tout dans `profiles`** : élargir une table **lue publiquement**, dont l'audit
  d'août a montré qu'elle expose déjà plus que prévu.

## Modèle de données

### `companies`

| Colonne | Rôle |
|---|---|
| `id` | clé primaire |
| `owner_id` | → `profiles(id)`, le compte propriétaire. Une entreprise = un compte dans cette spec |
| `name` | **obligatoire** |
| `logo_url` | **obligatoire** |
| `description`, `website_url`, `location` | facultatifs |
| `can_publish` | booléen, **défaut `true` aujourd'hui**. C'est l'emplacement réservé à l'abonnement futur : le jour où un paiement existe, il devient `false` par défaut et le paiement le bascule. ⚠️ Le mettre à `false` dès maintenant rendrait l'inscription libre fictive — il y aurait deux verrous manuels (ce drapeau ET la validation du premier brief) là où Marwen n'en a demandé qu'un |
| `first_brief_approved` | booléen, défaut `false`. Passe à `true` quand Marwen valide le premier brief |
| `created_at`, `updated_at` | |

### `briefs`

| Colonne | Rôle |
|---|---|
| `id`, `company_id` | |
| `title`, `context`, `brief`, `constraints`, `criteria`, `deliverable` | le contenu, en une seule langue |
| `specialty_id`, `industry_id`, `project_type_id` | taxonomie, pour filtrer et afficher |
| `visibility` | `'public'` \| `'private'`, contrainte CHECK |
| `target_league_ids` | tableau d'identifiants de ligues. Vide ⇒ toutes. Ignoré si `visibility='private'` |
| `access_token` | jeton du lien privé, régénérable. Nul si public |
| `deadline_at` | date limite |
| `max_responses` | plafond de réponses |
| `status` | `'draft'` \| `'pending_review'` \| `'published'` \| `'closed'` \| `'rejected'` |
| `rejection_reason` | motif renvoyé au B2B |
| `created_at`, `published_at` | |

### Stockage

Nouveau bucket `companies` pour les logos, **avec dès le départ** ce que le bucket
`onboarding` n'a jamais eu : 2 Mo maximum et types d'images en liste blanche.

## Parcours du B2B

1. **`/hire`** cesse d'être une page « bientôt disponible » et devient la porte
   d'entrée. On y arrive par le menu **« Recruter »** de la page d'accueil, qui existe
   déjà (`MarketingHeader.tsx` et le pied de page pointent tous deux vers `/hire`).
   La page offre **deux chemins** : créer un compte entreprise, et **se connecter**
   pour une entreprise déjà inscrite. La connexion réutilise `/login` — c'est le même
   mécanisme pour tout le monde ; c'est la **découverte** du chemin qui doit être
   évidente depuis « Recruter », pas la mécanique.
   La liste d'attente existante est conservée.
2. **Inscription** sur le mécanisme existant ; l'arrivée par `/hire` pose le marqueur
   `b2b`.
3. **Écran d'informations d'entreprise** dans la foulée. Tant qu'il n'est pas rempli,
   le compte n'a pas de fiche et ne peut rien faire — c'est ce qui évite les comptes
   fantômes.
4. **Espace entreprise** après connexion : ses briefs, sa fiche. Ni ligue, ni XP, ni
   challenge, ni portfolio.
5. **Rédaction** : un formulaire normal, chaque champ portant un bouton « améliorer »
   qui envoie **ce champ-là** à l'IA. Le B2B voit la proposition, accepte ou refuse.
   Il garde la main, et on ne paie un appel que sur demande explicite.
   Réutilise le client Anthropic et son plafond de 10 appels/heure/compte.
6. **Publication** : choix de la visibilité, des ligues ciblées, de la date limite et
   du plafond. Si `first_brief_approved` est faux, le brief part en `pending_review`.

## Visibilité

**Public ciblé** : le B2B coche une ou plusieurs ligues. Par défaut **toutes** — un
B2B qui ne comprend pas le système de ligues ne doit pas publier dans le vide. Le
brief apparaît dans l'onglet Brief des designers dont la ligue correspond et dont le
`plan` vaut `pro`.

**Privé par lien** : URL `/brief/<token>` avec un jeton impossible à deviner. La page
s'ouvre **sans compte** — le jeton est le secret — mais répondre exigera un compte.
Le B2B peut régénérer le jeton, ce qui invalide l'ancien lien immédiatement.

⚠️ **Un brief privé porte `noindex` et n'entre dans aucun sitemap.** C'est l'endroit
où une erreur coûterait le plus cher : le sujet confidentiel d'un client indexé par
Google.

## Côté designer

**Onglet Brief** (`/dashboard/briefs`), visible des seuls comptes `pro` : logo de
l'entreprise, titre, spécialité, date limite, places restantes.

Un brief dont la date est passée ou dont le plafond est atteint s'affiche **fermé**,
pas caché : un designer doit pouvoir constater qu'il est arrivé trop tard plutôt que
de voir une liste rétrécir sans explication.

**Page d'un brief** : contenu complet, entreprise, et un bouton « Réaliser cet
exercice » qui, dans cette spec, mène à un écran « bientôt ». C'est la couture avec
la spec 2.

## Modération

Les briefs en `pending_review` arrivent dans la file admin existante, à côté des
contenus signalés. Approuver publie et passe `first_brief_approved` à `true` ;
refuser renvoie le brief au B2B avec un motif.

⚠️ Deux leçons du chantier précédent, à ne pas réapprendre : les actions admin de ce
repo **avalent silencieusement leurs erreurs**, et un `UPDATE` dont le `WHERE` ne
matche aucune ligne renvoie `204` **sans erreur**. Ne jamais conclure au succès sur
l'absence d'erreur : vérifier qu'une ligne a été touchée.

## Hors périmètre de cette spec

Les réponses des designers et leur dépouillement, les analytics pour le B2B,
l'abonnement payant, la traduction du brief, et le multi-utilisateur côté entreprise.

## Risques

1. **Zéro client B2B aujourd'hui.** Un brief publié sans entreprise pour l'écrire ne
   sert à rien. Le succès de cette spec se mesure à un seul chiffre : **un vrai brief
   publié par une vraie entreprise**.
2. **Inscription libre.** N'importe qui peut créer un compte entreprise. La validation
   du premier brief est le seul filtre — il porte donc tout le poids.
3. **Un brief privé qui fuiterait** exposerait le sujet confidentiel d'un client. Le
   `noindex` et l'absence de sitemap sont des exigences, pas des détails.

## Vérification

Aucune suite de tests dans ce repo. La preuve passe par `npx tsc --noEmit`,
`npx next build`, et **trois mesures en anonyme depuis un terminal** :

- un brief **privé** n'apparaît nulle part publiquement et sa page rend `noindex` ;
- un brief **public** n'est visible que des ligues ciblées ;
- un brief **en attente de validation** n'est visible de personne.

⚠️ Mesurer en anonyme depuis un terminal, jamais depuis le navigateur : celui-ci
porte une session, et la branche propriétaire des policies masque les fuites.
