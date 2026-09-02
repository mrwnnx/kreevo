-- ============================================================================
-- 018_briefs_status_guard_insert.sql
-- ----------------------------------------------------------------------------
-- Correction sur 015 : le trigger `briefs_status_guard` ne gardait que
-- `before update`, pas `before insert`. `briefs_owner_write` (policy INSERT,
-- 011) ne contraint pas `status` : une entreprise qui ne peut plus faire
-- passer son brief à `published` par un UPDATE le crée directement à
-- `published` par un POST REST direct sur /rest/v1/briefs — même trou que
-- celui que 015 fermait, une autre porte. 015 est corrigé pour qu'un
-- environnement neuf porte déjà le garde complet (INSERT + UPDATE) ; cette
-- migration applique le même changement à la base existante, qui avait déjà
-- la version `before update` seul de 015 appliquée. Même schéma que 012 pour
-- 011.
--
-- `security invoker`, pas `security definer` — reprend ici le correctif fait
-- dans 015 (voir son en-tête pour le détail du piège : `current_user` sous
-- `security definer` vaut le PROPRIÉTAIRE de la fonction, jamais l'appelant,
-- donc le contournement admin `current_user = 'service_role'` n'aurait
-- jamais fonctionné). `018` ayant été écrite et appliquée en même temps que
-- la version encore bugguée de 015 (avant la vérification par une vraie
-- requête PostgREST qui a révélé le piège), cette version corrigée du
-- fichier fait qu'un environnement neuf qui rejoue 015 ou 018 obtient la
-- même fonction correcte. `019` applique le correctif à la base qui avait
-- déjà 018 (definer) appliquée.
--
-- Cf. `.superpowers/sdd/briefs-plan/final-fix-report.md`.
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

drop trigger if exists briefs_status_guard on public.briefs;
create trigger briefs_status_guard
  before insert or update on public.briefs
  for each row
  execute function public.guard_brief_publish();

commit;

-- ============================================================================
-- VÉRIFICATION — voir le bloc VÉRIFICATION de 015 (identique, INSERT compris,
-- et le point important : tester la clé de service sur une entreprise NON
-- approuvée, pas une déjà approuvée).
-- ============================================================================

-- ============================================================================
-- DOWN (rollback) — exécuter séparément. Restaure la version `before update`
-- seul (rouvre le trou par INSERT — à n'utiliser que pour un rollback
-- d'urgence).
-- ============================================================================
-- begin;
-- create or replace function public.guard_brief_publish()
-- returns trigger
-- language plpgsql
-- security invoker
-- set search_path = public
-- as $function$
-- declare
--   approved boolean;
-- begin
--   if current_user = 'service_role' then
--     return new;
--   end if;
--   if new.status = 'published' and old.status is distinct from 'published' then
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
-- drop trigger if exists briefs_status_guard on public.briefs;
-- create trigger briefs_status_guard
--   before update on public.briefs
--   for each row
--   execute function public.guard_brief_publish();
-- commit;
