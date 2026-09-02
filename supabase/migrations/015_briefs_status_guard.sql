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
-- ⚠️ COUVRE INSERT ET UPDATE, PAS SEULEMENT UPDATE. Une première version de ce
-- fichier ne posait le garde qu'en `before update` — mais `briefs_owner_write`
-- (policy INSERT) ne contraint pas `status` non plus : une entreprise qui ne
-- peut plus faire passer son brief à `published` par un UPDATE le crée
-- directement à `published` par un POST REST direct sur /rest/v1/briefs. Même
-- trou, autre porte. Corrigé avant même la première application en prod de ce
-- fichier (rétroactif, comme 011 l'a été pour 012) — un environnement neuf
-- reparti d'ici a le garde complet dès le départ ; `018` a appliqué le même
-- correctif à une base qui avait déjà déployé l'ancienne version.
--
-- ⚠️ `security invoker`, PAS `security definer`. Piège découvert en vérifiant
-- avec une VRAIE requête PostgREST (pas du SQL direct) : à l'intérieur d'une
-- fonction `security definer`, `current_user` vaut le PROPRIÉTAIRE de la
-- fonction (ici `postgres`), jamais le rôle appelant — même quand l'appel
-- vient réellement de la clé de service. Un premier essai de ce fichier
-- utilisait `security definer` (pour que le `select ... from companies`
-- ci-dessous ne dépende pas de la RLS de l'appelant) et vérifiait le
-- contournement admin par `current_user = 'service_role'` : cette condition
-- n'était JAMAIS vraie, pour personne — le contournement n'a jamais
-- fonctionné, masqué en test SQL direct (exécuté comme `postgres`, où le
-- test passait sur le mérite du cas "déjà approuvé", pas sur le
-- contournement) et par l'ordre d'écriture de la route d'approbation
-- (`companies.first_brief_approved` posé à `true` AVANT `briefs.status`,
-- donc le brief est déjà "approuvé" quand son update arrive — le
-- contournement n'était jamais sollicité par le seul code qui existe
-- aujourd'hui, mais l'aurait été par tout futur appel service-role qui
-- publierait avant d'approuver). Corrigé en `security invoker` : le
-- `current_user` vu par la fonction redevient celui de l'appelant réel, et le
-- `select` reste valide sans RLS supplémentaire car (a) le service role
-- contourne la RLS quel que soit invoker/definer, et (b) le propriétaire lit
-- sa propre ligne sous `companies_owner_select` (017).
--
-- La route d'approbation (src/app/api/admin/briefs/[id]/review/route.ts)
-- écrit avec `supabaseAdmin` (service role, cf. src/lib/supabase/admin.ts +
-- requireAdmin() dans src/lib/admin.ts) — et un trigger, contrairement à la
-- RLS, s'exécute pour TOUT rôle, service_role compris (le service role
-- contourne la RLS, jamais les triggers). PostgREST authentifie cette clé et
-- la requête tourne alors avec `current_user = 'service_role'` — vérifié en
-- base via une fonction de diagnostic temporaire (`select current_user` sous
-- `security invoker`, appelée avec la clé de service par une vraie requête
-- REST) : `current_user` rend bien `'service_role'` à ce niveau, jamais pour
-- une session utilisateur `authenticated` ou pour `anon`.
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
  -- Le service role (routes admin) contourne déjà la RLS ; il doit aussi
  -- contourner ce garde-fou métier, sans quoi la route d'approbation
  -- elle-même casserait.
  if current_user = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Pas de ligne d'avant à la création : le seul cas à garder est "naît
    -- déjà published" (le contournement par POST direct).
    must_check := (new.status = 'published');
  else
    -- Seul le PASSAGE vers published est gardé (pas "published" en soi) :
    -- une ligne déjà published qu'on ré-enregistre sans changer son statut
    -- ne doit pas être bloquée si l'entreprise a depuis été approuvée
    -- entre-temps sur un autre brief.
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
-- VÉRIFICATION — depuis un terminal, avec une VRAIE session PostgREST (pas du
-- SQL direct) pour un compte b2b dont `companies.first_brief_approved = false` :
--
--   curl -s -X POST "$SUPABASE_URL/rest/v1/briefs" \
--     -H "apikey: $ANON" -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
--     -H "Content-Type: application/json" -H "Prefer: return=representation" \
--     -d '{"company_id":"<id>","title":"t","brief":"b","deliverable":"d","status":"published","visibility":"public"}'
--   # Attendu : 42501, pas un 201.
--
--   curl -s -X PATCH "$SUPABASE_URL/rest/v1/briefs?id=eq.<brief_id>" \
--     -H "apikey: $ANON" -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
--     -H "Content-Type: application/json" -H "Prefer: return=representation" \
--     -d '{"status":"published"}'
--   # Attendu : 42501, pas un 204 silencieux.
--
-- Puis EXACTEMENT le même appel, avec la clé de service
-- (`apikey`/`Authorization` = SUPABASE_SERVICE_ROLE_KEY, ex. via
-- POST /rest/v1/briefs) sur la MÊME entreprise non approuvée : 201/200 —
-- c'est ce test précis, sur une entreprise PAS approuvée, qui distingue "le
-- contournement marche" de "l'entreprise était de toute façon déjà
-- approuvée".
-- ============================================================================

-- ============================================================================
-- DOWN (rollback) — exécuter séparément.
-- ============================================================================
-- begin;
-- drop trigger if exists briefs_status_guard on public.briefs;
-- drop function if exists public.guard_brief_publish();
-- commit;
