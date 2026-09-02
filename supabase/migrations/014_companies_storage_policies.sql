-- ============================================================================
-- 014_companies_storage_policies.sql
-- ----------------------------------------------------------------------------
-- Le bucket `companies` a été posé à chaud (aucune migration ne le décrivait)
-- et n'a REÇU AUCUNE policy sur `storage.objects`. Or `CompanyForm` (spec 1)
-- téléverse le logo côté client, avec la session de l'utilisateur — la RLS
-- refuse tout (403) faute de policy `insert`. Le logo étant obligatoire pour
-- créer une fiche entreprise, la fonctionnalité entière était morte : aucune
-- entreprise ne pouvait s'inscrire. Vérifié : `select policyname from
-- pg_policies where tablename='objects' and qual ilike '%companies%'` ne
-- renvoie rien avant cette migration.
--
-- Réglages du bucket relevés en base avant d'écrire (Management API,
-- 2026-09-02) : public=true, file_size_limit=2097152 (2 Mo),
-- allowed_mime_types={image/jpeg,image/png,image/webp}. Reproduits ici tels
-- quels, en upsert, pour qu'un environnement neuf reparte avec exactement le
-- même bucket — pas une approximation.
--
-- Policies calquées sur `avatars` (mêmes pg_policies relevées en base) :
--   avatars_auth_insert  / INSERT / public  / check bucket_id='avatars' and auth.uid() is not null
--   avatars_owner_update / UPDATE / public  / using bucket_id='avatars' and owner=auth.uid()
--   avatars_owner_delete / DELETE / public  / using bucket_id='avatars' and owner=auth.uid()
--   avatars_owner_select / SELECT / authenticated / using bucket_id='avatars' and owner=auth.uid()
--
-- Un écart assumé sur SELECT : `avatars_owner_select` ne rend l'API de lecture
-- (list/download authentifié) qu'au propriétaire — mais un avatar s'affiche
-- quand même à tout le monde, car le bucket est public et l'URL publique
-- (`/storage/v1/object/public/...`) ne consulte PAS cette RLS ; c'est le
-- réglage `public=true` du bucket qui l'autorise, pas une policy. La spec de
-- ce lot demande explicitement une "lecture publique" pour `companies`
-- (`.scratch/briefs-b2b/spec.md`, §1) : on l'écrit donc en clair, au rôle
-- `public`, sans restriction au propriétaire — même famille que
-- `onboarding_read`/`email_banners_read`, déjà en place sur d'autres buckets
-- publics de ce projet. Ça ne change rien à ce qui est déjà visible via l'URL
-- publique ; ça couvre en plus l'accès par l'API Storage elle-même.
-- ============================================================================

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('companies', 'companies', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "companies_logo_insert" on storage.objects;
create policy "companies_logo_insert" on storage.objects for insert
  with check (bucket_id = 'companies' and auth.uid() is not null);

drop policy if exists "companies_logo_read" on storage.objects;
create policy "companies_logo_read" on storage.objects for select
  using (bucket_id = 'companies');

drop policy if exists "companies_logo_owner_update" on storage.objects;
create policy "companies_logo_owner_update" on storage.objects for update
  using (bucket_id = 'companies' and owner = auth.uid());

drop policy if exists "companies_logo_owner_delete" on storage.objects;
create policy "companies_logo_owner_delete" on storage.objects for delete
  using (bucket_id = 'companies' and owner = auth.uid());

commit;

-- ============================================================================
-- VÉRIFICATION — depuis un terminal, avec un compte b2b connecté (obtenir un
-- access_token via /auth/v1/token?grant_type=password), PAS depuis le
-- navigateur :
--
--   curl -s -X POST "$SUPABASE_URL/storage/v1/object/companies/<uid>/logo.webp" \
--     -H "apikey: $ANON" -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
--     -H "Content-Type: image/webp" --data-binary @logo.webp
--
-- Attendu : 200, pas 403. Puis nettoyer l'objet de test (DELETE sur la même
-- URL) avant de conclure — la base est celle de production.
-- ============================================================================

-- ============================================================================
-- DOWN (rollback) — exécuter séparément.
-- ⚠️ Supprimer le bucket échoue tant qu'il contient des objets (contrainte de
--    clé étrangère de storage.objects vers storage.buckets) — vider le bucket
--    d'abord si besoin.
-- ============================================================================
-- begin;
-- drop policy if exists "companies_logo_insert" on storage.objects;
-- drop policy if exists "companies_logo_read" on storage.objects;
-- drop policy if exists "companies_logo_owner_update" on storage.objects;
-- drop policy if exists "companies_logo_owner_delete" on storage.objects;
-- delete from storage.buckets where id = 'companies';
-- commit;
