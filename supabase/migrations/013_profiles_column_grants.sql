-- 013_profiles_column_grants.sql
--
-- PHASE 1 — Ferme l'escalade de privilège sur public.profiles.
--
-- LE PROBLÈME (deux causes qui se combinent) :
--   1. La policy `profiles_owner_write` est FOR ALL USING (id = auth.uid()) avec
--      with_check = NULL : elle vérifie *qui* écrit, jamais *quoi*.
--   2. `anon` et `authenticated` ont UPDATE au niveau TABLE (le `grant all` par
--      défaut de Supabase), donc sur les 34 colonnes.
--   Conséquence mesurée : un utilisateur connecté ordinaire pouvait se mettre
--   role='admin' (→ requireAdmin() lui donne le client de service), plan='pro',
--   xp=99999, league='Diamond' — le tout en HTTP 204.
--
-- ⚠️ Un `revoke update (colonne)` seul ne fait RIEN quand le droit est accordé
--    sur la table entière. Il faut révoquer le droit de TABLE, puis ré-accorder
--    colonne par colonne. C'est ce que fait ce fichier.
--
-- `anon` ne récupère rien : un visiteur non connecté n'a aucune raison d'écrire
-- un profil.
--
-- ---------------------------------------------------------------------------
-- ⚠️ POURQUOI xp, league, league_entered_at ET referred_by SONT ENCORE ACCORDÉES
-- ---------------------------------------------------------------------------
-- Ce sont des colonnes sensibles (classement, ligue, parrainage) et elles
-- devraient être en écriture serveur uniquement. Elles restent accordées
-- UNIQUEMENT parce que deux routes les écrivent aujourd'hui avec le CLIENT DE
-- SESSION, et que le code corrigé n'est pas déployable pour l'instant (la
-- branche `feat/briefs-b2b` n'est pas fusionnée, alors que cette base est
-- PARTAGÉE avec la production) :
--
--   • src/app/api/profile/route.ts:117-119
--       update.xp = 0 / update.league = 'Stone' / update.league_entered_at = ...
--       Règle métier : changer de spécialité en Stone/Bronze remet la
--       progression à zéro. Le contrôle d'autorisation existe déjà côté serveur
--       (verrouillé à partir de Silver, lignes 108-115).
--
--   • src/app/auth/callback/route.ts:105
--       update.referred_by = referrer.id  (parrainage, cookie httpOnly
--       `kreevo_ref` posé par src/proxy.ts:13)
--
-- ⚠️ NE LES RETIRE PAS SANS AVOIR D'ABORD CORRIGÉ CES DEUX ROUTES.
--    En PostgreSQL, un UPDATE qui nomme UNE SEULE colonne non accordée échoue
--    EN ENTIER (42501) — les colonnes accordées de la même instruction ne sont
--    pas écrites non plus. Les retirer aujourd'hui casserait donc :
--      - /api/profile → 500, et TOUTE la sauvegarde de profil est perdue
--        (bio, avatar, liens…), pas seulement le reset de spécialité ;
--      - auth/callback → perte SILENCIEUSE (catch ligne 125) du
--        pré-remplissage OAuth first_name/last_name/full_name/avatar_url/
--        linkedin_url pour tout inscrit venu par un lien de parrainage.
--
-- PHASE 2 (à faire quand le code corrigé pourra être déployé) :
--   1. déplacer ces deux écritures vers supabaseAdmin (client de service), en
--      instructions séparées, sans changer les contrôles d'autorisation ;
--   2. puis exécuter le bloc « PHASE 2 » en bas de ce fichier.
--
-- Reste aussi ouvert, volontairement hors périmètre ici : `anon` et
-- `authenticated` conservent INSERT / DELETE / TRUNCATE au niveau table sous une
-- policy FOR ALL sans with_check — l'INSERT n'est donc contrôlé par rien.

-- ============================== UP ==============================

revoke update on public.profiles from anon;
revoke update on public.profiles from authenticated;

-- 26 colonnes sur 34. Chacune est écrite par une route utilisant le client de
-- session ; aucune autre ne l'est.
grant update (
  -- liste blanche `allowed` de src/app/api/profile/route.ts:11-32
  username,               -- validée par isValidUsername + unicité (route.ts:38-61)
  full_name,              -- + recomposée route.ts:133, + OAuth callback:87
  avatar_url,             -- + OAuth callback:88
  bio,
  country,
  city,
  specialty,              -- slug, résolu contre une spécialité active
  specialty_id,           -- FK validée contre specialties.is_active (route.ts:68-91)
  objective,
  objectives,
  tools,
  links,
  first_name,             -- + OAuth callback:85
  last_name,              -- + OAuth callback:86
  experience_level,
  job_title,
  behance_url,
  linkedin_url,           -- + OAuth callback:92
  onboarding_completed,
  tour_completed,         -- src/components/onboarding/OnboardingTour.tsx:36
  -- injectées par les routes elles-mêmes
  updated_at,             -- route.ts:136 et callback:117
  preferred_language,     -- src/lib/i18n/actions.ts:35
  -- ⚠️ dette PHASE 1 — voir l'avertissement en tête de fichier
  xp,                     -- route.ts:117
  league,                 -- route.ts:118
  league_entered_at,      -- route.ts:119
  referred_by             -- callback:105
) on public.profiles to authenticated;

-- NON accordées (8) et pourquoi :
--   role            → escalade de privilèges (requireAdmin, src/lib/admin.ts:14)
--   plan            → abonnement gratuit
--   plan_expires_at → idem
--   is_suspended    → un compte suspendu se dé-suspendrait lui-même
--   referral_code   → aucune route de session ne l'écrit, et auth/callback:101
--                     résout le parrain PAR referral_code : pouvoir le choisir
--                     permettrait de squatter le code d'un autre
--   id              → clé primaire
--   created_at      → aucune route ne l'écrit
--   level           → colonne héritée, aucune écriture nulle part dans src/

-- ============================= DOWN =============================
-- Restaure l'état antérieur (table-level UPDATE pour anon + authenticated).
-- ⚠️ Rétablit la faille : à n'utiliser que pour un rollback d'urgence.
--
-- revoke update (
--   username, full_name, avatar_url, bio, country, city,
--   specialty, specialty_id, objective, objectives, tools, links,
--   first_name, last_name, experience_level, job_title,
--   behance_url, linkedin_url, onboarding_completed, tour_completed,
--   updated_at, preferred_language,
--   xp, league, league_entered_at, referred_by
-- ) on public.profiles from authenticated;
--
-- grant update on public.profiles to anon, authenticated;

-- ===================== PHASE 2 (NE PAS EXÉCUTER MAINTENANT) =====================
-- À exécuter SEULEMENT une fois que src/app/api/profile/route.ts:117-119 et
-- src/app/auth/callback/route.ts:105 écrivent via supabaseAdmin, et que ce code
-- est DÉPLOYÉ en production (base partagée).
--
-- revoke update (xp, league, league_entered_at, referred_by)
--   on public.profiles from authenticated;
