-- ============================================================================
-- 023_comments_count_atomic.sql
-- ----------------------------------------------------------------------------
-- `submissions.comments_count` était mis à jour en DEUX requêtes : on lisait la
-- valeur, puis on écrivait valeur±1. Deux commentaires postés dans le même
-- intervalle lisent le même nombre et écrivent le même résultat — un des deux
-- est perdu, sans erreur ni trace. Le compteur ne peut que dériver vers le bas
-- sous charge, et rien ne le recale jamais.
--
--   src/app/api/submissions/[id]/comments/route.ts:109-113  (+1)
--   src/app/api/comments/[id]/route.ts:24-30                (-1)
--
-- Une seule instruction SQL qui lit et écrit dans la même transaction supprime
-- la fenêtre. `greatest(0, …)` conserve le garde-fou qui existait côté JS
-- (`Math.max(0, …)`) : un compteur négatif n'a pas de sens à l'affichage.
--
-- SÉCURITÉ : la fonction est appelée par `supabaseAdmin` (service role) depuis
-- deux routes qui ont déjà vérifié la session et la propriété du commentaire.
-- Elle est donc RETIRÉE à `anon` et `authenticated` : laissée ouverte, elle
-- offrirait à n'importe quel visiteur un moyen de gonfler ou d'écraser le
-- compteur de n'importe quelle soumission, en contournant toute la RLS —
-- exactement le piège de `019` (une fonction trop accessible vaut une policy
-- trouée). `security invoker` par défaut, jamais `definer` ici.
--
-- ⚠️ CE QUE CETTE MIGRATION NE CORRIGE PAS : le compteur est incrémenté pour
-- TOUT commentaire (réponses comprises) mais décrémenté seulement pour les
-- commentaires de premier niveau (`if (!comment.parent_id)`). Supprimer une
-- réponse laisse donc le compteur trop haut. C'est une asymétrie de comptage,
-- pas un problème de concurrence, et la corriger demande de savoir si les
-- réponses sont supprimées en cascade avec leur parent — à trancher avant.
-- ============================================================================

begin;

create or replace function public.bump_comments_count(
  p_submission_id uuid,
  p_delta int
)
returns void
language sql
as $$
  update public.submissions
     set comments_count = greatest(0, coalesce(comments_count, 0) + p_delta)
   where id = p_submission_id;
$$;

revoke execute on function public.bump_comments_count(uuid, int) from public;
revoke execute on function public.bump_comments_count(uuid, int) from anon;
revoke execute on function public.bump_comments_count(uuid, int) from authenticated;
grant execute on function public.bump_comments_count(uuid, int) to service_role;

commit;

-- ============================================================================
-- VÉRIFICATION
--
--   -- 1. Les droits : `authenticated` ne doit RIEN pouvoir exécuter.
--   select r.rolname,
--          has_function_privilege(r.rolname, 'public.bump_comments_count(uuid,int)', 'EXECUTE')
--     from pg_roles r
--    where r.rolname in ('anon', 'authenticated', 'service_role');
--   -- Attendu : false, false, true.
--
--   -- 2. Le comportement, sur une soumission de test :
--   select comments_count from submissions where id = '<id>';
--   select public.bump_comments_count('<id>', 1);
--   select comments_count from submissions where id = '<id>';   -- +1
--   select public.bump_comments_count('<id>', -99);
--   select comments_count from submissions where id = '<id>';   -- 0, jamais négatif
--
--   -- 3. Depuis une VRAIE session PostgREST (pas le service role) :
--   --   POST /rest/v1/rpc/bump_comments_count  {"p_submission_id":"…","p_delta":999}
--   --   Attendu : 42501 permission denied for function bump_comments_count.
-- ============================================================================

-- ============================================================================
-- DOWN (rollback) — exécuter séparément. ⚠️ Rétablit la mise à jour perdue.
-- ============================================================================
-- drop function if exists public.bump_comments_count(uuid, int);
