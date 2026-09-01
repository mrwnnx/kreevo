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
