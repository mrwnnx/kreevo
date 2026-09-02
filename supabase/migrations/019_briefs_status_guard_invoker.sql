-- ============================================================================
-- 019_briefs_status_guard_invoker.sql
-- ----------------------------------------------------------------------------
-- Correction sur 015/018 : `guard_brief_publish()` était `security definer`.
-- Repéré en vérifiant le garde par une VRAIE requête PostgREST authentifiée
-- avec la clé de service (pas du SQL direct ni de la lecture de code) : le
-- POST direct restait rejeté en 42501 même avec la clé de service, sur une
-- entreprise non approuvée.
--
-- Cause : à l'intérieur d'une fonction `security definer`, `current_user`
-- vaut le PROPRIÉTAIRE de la fonction (`postgres`, le rôle de migration —
-- confirmé avec une fonction de diagnostic temporaire), jamais le rôle
-- réellement appelant. La condition `current_user = 'service_role'` n'était
-- donc jamais vraie, pour personne — le contournement admin n'a jamais
-- fonctionné depuis 015. Ça n'avait rien montré jusqu'ici parce que :
--   1. le seul appel service-role qui existe (route d'approbation) écrit
--      `companies.first_brief_approved = true` AVANT `briefs.status =
--      'published'`, dans deux requêtes séparées — le brief est donc déjà
--      "approuvé" au sens métier quand son update arrive, et passe sur ce
--      mérite, jamais sur le contournement ;
--   2. la vérification précédente de 015 était en SQL direct (rôle
--      `postgres`, jamais `service_role`), donc n'exerçait jamais cette
--      branche non plus.
-- Un futur appel service-role qui publierait SANS approuver d'abord la
-- société (ex. un script de rattrapage, une nouvelle route admin) aurait
-- échoué en 42501, sans qu'aucun code applicatif n'ait rien fait de mal.
--
-- Correction : `security invoker`. Le `select ... from companies` interne
-- reste valide sans RLS supplémentaire, pour deux raisons indépendantes :
-- le service role contourne la RLS quel que soit invoker/definer, et le
-- propriétaire d'une entreprise lit déjà sa propre ligne sous
-- `companies_owner_select` (017).
--
-- Cf. `.superpowers/sdd/briefs-plan/final-fix-report.md` pour la preuve par
-- requête PostgREST réelle (session b2b vs clé de service, même entreprise
-- non approuvée).
-- ============================================================================

begin;

create or replace function public.guard_brief_publish()
returns trigger
language plpgsql
security invoker
set search_path = public
as $function$
declare
  approved boolean;
  must_check boolean;
begin
  if current_user = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    must_check := (new.status = 'published');
  else
    must_check := (new.status = 'published' and old.status is distinct from 'published');
  end if;

  if must_check then
    select c.first_brief_approved into approved
    from public.companies c
    where c.id = new.company_id;

    if coalesce(approved, false) = false then
      raise exception 'briefs: cannot publish before the company''s first brief is approved'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$function$;

-- Le trigger lui-même ne change pas (avant insert or update) — seule la
-- fonction change de sémantique. Pas de drop/create trigger nécessaire ici,
-- `create or replace function` suffit et préserve le trigger existant.

commit;

-- ============================================================================
-- VÉRIFICATION — depuis un terminal, avec une entreprise NON approuvée :
--
--   1. Session b2b réelle (POST /rest/v1/briefs, status=published) → 42501.
--   2. EXACTEMENT le même POST, avec la clé de service → 201.
--
-- Le point 2 est celui qui manquait avant cette migration : avant 019, la
-- clé de service recevait aussi 42501 sur une entreprise non approuvée.
-- ============================================================================

-- ============================================================================
-- DOWN (rollback) — exécuter séparément. Restaure `security definer` (rouvre
-- le bug : le contournement service_role ne fonctionne plus — à n'utiliser
-- que pour un rollback d'urgence, jamais en connaissance de cause).
-- ============================================================================
-- begin;
-- create or replace function public.guard_brief_publish()
-- returns trigger
-- language plpgsql
-- security definer
-- set search_path = public
-- as $function$
-- declare
--   approved boolean;
--   must_check boolean;
-- begin
--   if current_user = 'service_role' then
--     return new;
--   end if;
--   if tg_op = 'INSERT' then
--     must_check := (new.status = 'published');
--   else
--     must_check := (new.status = 'published' and old.status is distinct from 'published');
--   end if;
--   if must_check then
--     select c.first_brief_approved into approved
--     from public.companies c
--     where c.id = new.company_id;
--     if coalesce(approved, false) = false then
--       raise exception 'briefs: cannot publish before the company''s first brief is approved'
--         using errcode = '42501';
--     end if;
--   end if;
--   return new;
-- end;
-- $function$;
-- commit;
