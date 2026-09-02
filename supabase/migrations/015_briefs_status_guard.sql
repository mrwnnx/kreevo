-- ============================================================================
-- 015_briefs_status_guard.sql
-- ----------------------------------------------------------------------------
-- `briefs_owner_update` (011) n'a aucune restriction de colonne :
--   using (company_id in (select id from companies where owner_id = auth.uid()))
-- Une entreprise peut donc faire passer SON PROPRE brief de `pending_review`
-- directement à `published` par un PATCH REST direct sur /rest/v1/briefs — le
-- garde-fou "le premier brief est validé par Marwen" (spec 1, décision
-- produit #2) se contourne sans toucher à l'application.
--
-- Une policy ne peut pas fermer ça : un `with check` ne voit que la ligne
-- PROPOSÉE (NEW), jamais celle d'avant (OLD) — impossible d'écrire "refuse si
-- le statut passe À published" dans un `with check`, seulement "refuse si le
-- statut PROPOSÉ est published", ce qui reviendrait à interdire published pour
-- toujours, y compris aux écritures légitimes qui le posent déjà à published
-- (une entreprise déjà approuvée qui republie). D'où un trigger.
--
-- ⚠️ NE BLOQUE PAS L'ADMIN. La route d'approbation
-- (src/app/api/admin/briefs/[id]/review/route.ts) écrit avec `supabaseAdmin`
-- (service role, cf. src/lib/supabase/admin.ts + requireAdmin() dans
-- src/lib/admin.ts) — et un trigger `before update`, contrairement à la RLS,
-- s'exécute pour TOUT rôle, service_role compris (le service role contourne
-- la RLS, jamais les triggers). PostgREST fait `SET ROLE service_role` pour
-- toute requête signée avec la clé de service, donc `current_user` vaut
-- littéralement 'service_role' pendant l'exécution du trigger pour ce chemin
-- — jamais pour une session utilisateur, `authenticated` ou `anon`. C'est ce
-- que ce trigger vérifie pour laisser passer l'admin sans y toucher.
-- ============================================================================

begin;

create or replace function public.guard_brief_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  approved boolean;
begin
  -- Le service role (routes admin) contourne déjà la RLS ; il doit aussi
  -- contourner ce garde-fou métier, sans quoi la route d'approbation
  -- elle-même casserait.
  if current_user = 'service_role' then
    return new;
  end if;

  -- Seul le PASSAGE vers published est gardé (pas "published" en soi) : une
  -- ligne déjà published qu'on ré-enregistre sans changer son statut ne doit
  -- pas être bloquée si l'entreprise a depuis été approuvée entre-temps sur
  -- un autre brief.
  if new.status = 'published' and old.status is distinct from 'published' then
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
  before update on public.briefs
  for each row
  execute function public.guard_brief_publish();

commit;

-- ============================================================================
-- VÉRIFICATION — depuis un terminal, avec un compte b2b connecté dont
-- `companies.first_brief_approved = false` (le cas par défaut à l'inscription) :
--
--   curl -s -X PATCH "$SUPABASE_URL/rest/v1/briefs?id=eq.<brief_id>" \
--     -H "apikey: $ANON" -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
--     -H "Content-Type: application/json" -H "Prefer: return=representation" \
--     -d '{"status":"published"}'
--
-- Attendu : erreur 42501 (pas un 204 silencieux). Puis vérifier que la route
-- /api/admin/briefs/[id]/review (service role) publie toujours normalement —
-- elle écrit `companies.first_brief_approved = true` avant `briefs.status =
-- 'published'` dans la même requête, donc n'a même jamais besoin du contour-
-- nement pour un premier brief ; le contournement sert surtout à ne jamais
-- dépendre de l'ordre, et aux briefs suivants (déjà approuvés) republiés par
-- l'admin.
-- ============================================================================

-- ============================================================================
-- DOWN (rollback) — exécuter séparément.
-- ============================================================================
-- begin;
-- drop trigger if exists briefs_status_guard on public.briefs;
-- drop function if exists public.guard_brief_publish();
-- commit;
