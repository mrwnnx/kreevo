# 01 — Migration : colonne `kind`, taxonomie, ordre, RLS

Status: ready-for-agent

**Fichiers**
- Créer : `supabase/migrations/009_portfolio_projects.sql`
- Régénérer : `src/types/database.types.ts`

**Interfaces produites** (les lots suivants en dépendent)
- `submissions.kind: 'challenge' | 'portfolio'`
- `submissions.specialty_id`, `industry_id`, `project_type_id`: `string | null`
- `submissions.tools: string[] | null`
- `submissions.portfolio_position: number | null`, `pinned_at: string | null`

---

- [ ] **Étape 1 — Écrire la migration**

`supabase/migrations/009_portfolio_projects.sql` :

```sql
-- ============================================================================
-- 009_portfolio_projects.sql
-- Un projet de portfolio est une soumission sans challenge, sans validation et
-- sans XP. Cf. .scratch/portfolio-projets/spec.md
-- ============================================================================
begin;

alter table public.submissions
  add column if not exists kind text not null default 'challenge',
  add column if not exists specialty_id uuid references public.specialties(id),
  add column if not exists industry_id uuid references public.industries(id),
  add column if not exists project_type_id uuid references public.challenge_types(id),
  add column if not exists tools text[],
  add column if not exists portfolio_position int,
  add column if not exists pinned_at timestamptz;

-- `add constraint` n'a pas de `if not exists` : garde pour rendre la migration rejouable.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'submissions_kind_check') then
    alter table public.submissions
      add constraint submissions_kind_check check (kind in ('challenge','portfolio'));
  end if;
end $$;

create index if not exists submissions_kind_idx on public.submissions (kind);

-- Lecture publique : approuvé (challenge) OU publié (portfolio).
-- ALTER et non DROP+CREATE : la policy n'est jamais absente, donc aucune
-- fenêtre pendant laquelle la table serait en lecture libre.
alter policy "submissions_visible" on public.submissions
  using (
    (
      is_visible = true
      and is_draft = false
      and (kind = 'portfolio' or validation_status = 'approved')
    )
    or user_id = auth.uid()
  );

commit;

-- ============================================================================
-- DOWN — exécuter séparément pour annuler.
-- ============================================================================
-- begin;
-- alter policy "submissions_visible" on public.submissions
--   using ((is_visible = true and is_draft = false and validation_status = 'approved')
--          or user_id = auth.uid());
-- drop index if exists submissions_kind_idx;
-- alter table public.submissions drop constraint if exists submissions_kind_check;
-- alter table public.submissions
--   drop column if exists kind, drop column if exists specialty_id,
--   drop column if exists industry_id, drop column if exists project_type_id,
--   drop column if exists tools, drop column if exists portfolio_position,
--   drop column if exists pinned_at;
-- commit;
```

- [ ] **Étape 2 — Faire appliquer la migration**

Claude n'a pas de PAT Supabase. Deux voies :
- Marwen la colle dans le SQL Editor de Supabase ;
- ou il fournit `SUPABASE_PAT` et l'agent la passe par
  `POST https://api.supabase.com/v1/projects/ndflytgtduuvacjmdobc/database/query`.

⚠️ Un `Success` dans le SQL Editor **ne prouve pas** que la policy a changé —
lors de l'audit d'août, c'était le `select` qui s'exécutait. L'étape 3 est la
seule preuve.

- [ ] **Étape 3 — Prouver la migration (chemin de vérif différent)**

```bash
set -a && . .env.local && set +a
# les 7 colonnes existent, et les 87 lignes sont bien 'challenge'
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/submissions?select=kind,tools,pinned_at&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/submissions?select=id&kind=eq.challenge" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Prefer: count=exact" -H "Range: 0-0" -D- -o /dev/null | grep -i content-range
```
Attendu : les colonnes répondent, et **87 lignes** en `challenge`.

- [ ] **Étape 4 — Prouver que la RLS n'a rien ouvert de trop**

En **anonyme**, avec la clé publishable, depuis un terminal :

```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/submissions?select=is_draft,validation_status,kind&limit=300" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); \
print(len(d),'lignes,', sum(1 for r in d if r['is_draft']),'brouillon(s),', \
sum(1 for r in d if r['kind']=='challenge' and r['validation_status']!='approved'),'challenge non approuvé(s)')"
```
Attendu : **0 brouillon, 0 challenge non approuvé**. Le nombre de lignes doit
être identique à avant la migration (65 au dernier relevé) tant qu'aucun projet
perso n'existe.

- [ ] **Étape 5 — Régénérer les types**

```bash
# via la Management API (nécessite le PAT) :
# GET https://api.supabase.com/v1/projects/ndflytgtduuvacjmdobc/types/typescript
```
⚠️ Les alias écrits à la main en fin de `database.types.ts` (`Profile`,
`Submission`, `Challenge`…) sont perdus par la régénération : **les
re-concaténer**, 18 fichiers en dépendent. Garder un `.bak` à côté.

- [ ] **Étape 6 — Vérifier et commiter**

```bash
npx tsc --noEmit && npx next build
git add supabase/migrations/009_portfolio_projects.sql src/types/database.types.ts
git commit -m "feat(portfolio): add the kind discriminator and open RLS to published projects"
```
