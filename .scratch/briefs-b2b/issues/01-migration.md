# 01 — Migration : rôle `b2b`, `companies`, `briefs`, bucket, RLS

Status: ready-for-agent

**Fichiers**
- Créer : `supabase/migrations/011_briefs_b2b.sql`
- Régénérer : `src/types/database.types.ts`

**Interfaces produites** (tous les lots suivants en dépendent)
- `profiles.role` accepte `'b2b'`
- table `companies` : `id, owner_id, name, logo_url, description, website_url, location, can_publish, first_brief_approved, created_at, updated_at`
- table `briefs` : `id, company_id, title, context, brief, constraints, criteria, deliverable, specialty_id, industry_id, project_type_id, visibility, target_league_ids, access_token, deadline_at, max_responses, status, rejection_reason, created_at, published_at`
- bucket de stockage `companies`

---

- [ ] **Étape 1 — Écrire la migration**

`supabase/migrations/011_briefs_b2b.sql` :

```sql
-- ============================================================================
-- 011_briefs_b2b.sql
-- Une entreprise est un compte comme un autre, avec un marqueur de rôle et une
-- fiche à part. Cf. .scratch/briefs-b2b/spec.md
-- ============================================================================
begin;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null,
  logo_url text not null,
  description text,
  website_url text,
  location text,
  can_publish boolean not null default true,
  first_brief_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.briefs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text,
  context text,
  brief text,
  constraints text,
  criteria text,
  deliverable text,
  specialty_id uuid references public.specialties(id),
  industry_id uuid references public.industries(id),
  project_type_id uuid references public.challenge_types(id),
  visibility text not null default 'public',
  target_league_ids uuid[] not null default '{}',
  access_token text unique,
  deadline_at timestamptz,
  max_responses int,
  status text not null default 'draft',
  rejection_reason text,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'briefs_visibility_check') then
    alter table public.briefs add constraint briefs_visibility_check
      check (visibility in ('public','private'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'briefs_status_check') then
    alter table public.briefs add constraint briefs_status_check
      check (status in ('draft','pending_review','published','closed','rejected'));
  end if;
  -- Un brief privé porte un jeton, un brief public n'en porte pas.
  if not exists (select 1 from pg_constraint where conname = 'briefs_private_needs_token') then
    alter table public.briefs add constraint briefs_private_needs_token
      check ((visibility = 'private') = (access_token is not null));
  end if;
end $$;

create index if not exists briefs_status_idx on public.briefs (status);
create index if not exists briefs_company_idx on public.briefs (company_id);

alter table public.companies enable row level security;
alter table public.briefs enable row level security;

-- `companies` : lecture publique du nom et du logo (ils s'affichent sur un brief),
-- écriture réservée au propriétaire.
create policy "companies_public_read" on public.companies for select using (true);
create policy "companies_owner_write" on public.companies for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "companies_owner_insert" on public.companies for insert
  with check (owner_id = auth.uid());

-- `briefs` : un brief PUBLIÉ et PUBLIC est lisible de tous ; sinon seul son
-- propriétaire le voit. Le lien privé passera par le service role, pas par la RLS.
create policy "briefs_visible" on public.briefs for select using (
  (status = 'published' and visibility = 'public')
  or company_id in (select id from public.companies where owner_id = auth.uid())
);
create policy "briefs_owner_write" on public.briefs for insert
  with check (company_id in (select id from public.companies where owner_id = auth.uid()));
create policy "briefs_owner_update" on public.briefs for update
  using (company_id in (select id from public.companies where owner_id = auth.uid()));

-- Le trigger d'inscription pose le rôle depuis les métadonnées du compte.
-- Reprise à l'identique de handle_new_user(), avec la seule ligne `role` ajoutée.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
DECLARE
  base_username text;
  final_username text;
  counter int := 0;
  new_role text;
BEGIN
  base_username := COALESCE(NULLIF(NEW.raw_user_meta_data->>'username',''), split_part(NEW.email,'@',1));
  base_username := regexp_replace(lower(base_username), '[^a-z0-9_]', '', 'g');
  IF length(base_username) < 3 THEN base_username := 'user'; END IF;
  final_username := base_username;
  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username);
    counter := counter + 1;
    final_username := base_username || counter;
  END LOOP;
  -- Seule valeur acceptée depuis le client : 'b2b'. Tout le reste retombe sur 'user',
  -- sans quoi n'importe qui s'inscrirait admin en forgeant ses métadonnées.
  new_role := CASE WHEN NEW.raw_user_meta_data->>'role' = 'b2b' THEN 'b2b' ELSE 'user' END;
  INSERT INTO public.profiles (id, username, full_name, avatar_url, plan, plan_expires_at, role)
  VALUES (NEW.id, final_username,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name',''), NULLIF(NEW.raw_user_meta_data->>'name','')),
    NULLIF(NEW.raw_user_meta_data->>'avatar_url',''),
    'pro', TIMESTAMPTZ '2026-12-31 23:59:59+00', new_role);
  INSERT INTO public.subscriptions (user_id, plan) VALUES (NEW.id, 'free') ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

commit;

-- ============================================================================
-- DOWN — exécuter séparément.
-- ============================================================================
-- begin;
-- drop table if exists public.briefs;
-- drop table if exists public.companies;
-- -- puis restaurer handle_new_user() sans la colonne `role` (version d'avant ce lot)
-- commit;
```

⚠️ **Le point le plus dangereux de ce ticket** : `handle_new_user()` est le trigger qui
crée TOUS les comptes. S'il casse, **plus personne ne peut s'inscrire**, y compris les
designers. La version ci-dessus est une reprise à l'identique de l'existant avec une
seule ligne ajoutée — ne la réécris pas autrement.

- [ ] **Étape 2 — Appliquer la migration**

Par la Management API (`POST .../database/query`, corps `{"query": "..."}`). Réponse
`[]` = DDL réussi. ⚠️ Chaîner plusieurs instructions ne renvoie que le résultat de la
dernière : fais tes vérifications dans des appels séparés.

- [ ] **Étape 3 — Créer le bucket `companies`**

Par l'API Storage avec la clé service role de `.env.local` :
`POST {SUPABASE_URL}/storage/v1/bucket`, corps
`{"id":"companies","name":"companies","public":true,"file_size_limit":2097152,"allowed_mime_types":["image/jpeg","image/png","image/webp"]}`.

⚠️ Le bucket `onboarding` a vécu des mois sans limite de taille ni liste blanche. Ne
recommence pas : les deux sont posées **à la création**.

- [ ] **Étape 4 — Prouver que l'inscription des designers n'est pas cassée**

C'est la vérification la plus importante du lot. Crée un compte de test par l'API
d'authentification **sans** métadonnée `role`, vérifie que son profil est créé avec
`role='user'` et `plan='pro'`, puis supprime le compte.

```bash
set -a && . .env.local && set +a
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/signup" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" \
  -d '{"email":"zz-test-designer@example.com","password":"<mot de passe aléatoire>"}'
```
Attendu : profil créé, `role='user'`. Puis refais-le avec
`"data":{"role":"b2b"}` dans les métadonnées → `role='b2b'`.
Puis avec `"data":{"role":"admin"}` → **attendu `role='user'`**, la valeur est ignorée.
Supprime les trois comptes ensuite (`DELETE /auth/v1/admin/users/{id}`) et prouve-le.

- [ ] **Étape 5 — Prouver que la RLS ne laisse rien fuiter**

En **anonyme**, avec la clé publishable, depuis un terminal :
```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/briefs?select=id,status,visibility" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```
Attendu : `[]` tant qu'aucun brief publié public n'existe. Insère ensuite un brief
`draft` puis un `pending_review` par le service role : ni l'un ni l'autre ne doit
apparaître en anonyme. Supprime-les.

- [ ] **Étape 6 — Régénérer les types**

`GET https://api.supabase.com/v1/projects/ndflytgtduuvacjmdobc/types/typescript`.
⚠️ **PIÈGE** : `src/types/database.types.ts` se termine par des alias écrits à la main
(`Profile`, `League`, `Challenge`, `Submission`…) dont **18 fichiers dépendent**. La
régénération les détruit : sauvegarde en `.bak`, régénère, **re-concatène les alias**.

- [ ] **Étape 7 — Vérifier et commiter**

```bash
npx tsc --noEmit && npx next build
git add supabase/migrations/011_briefs_b2b.sql src/types/database.types.ts
git commit -m "feat(briefs): add the b2b role, companies and briefs tables"
```
