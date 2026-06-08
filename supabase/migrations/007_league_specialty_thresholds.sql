-- ============================================================================
-- 007_league_specialty_thresholds.sql
-- ----------------------------------------------------------------------------
-- Seuil XP de promotion MANUEL par (ligue × spécialité) — OVERRIDE du calcul auto.
-- Un bucket SANS ligne ici garde le comportement actuel (fallback dans le code
-- getLeagueThreshold : floor(Σ xp_reward publiés scopés × xp_threshold_percent/100)).
-- → zéro régression au déploiement tant qu'aucun seuil manuel n'est saisi.
--
-- xp_threshold = 0 est un override EXPLICITE valide (« pas de gate XP »).
-- Réversible : bloc DOWN inclus en bas.
-- ============================================================================

begin;

create table public.league_specialty_thresholds (
  league_id    uuid not null references public.leagues(id)     on delete cascade,
  specialty_id uuid not null references public.specialties(id) on delete cascade,
  xp_threshold integer not null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  primary key (league_id, specialty_id)
);

alter table public.league_specialty_thresholds enable row level security;

-- Lecture publique (pattern challenge_types / industries : USING(true)).
drop policy if exists league_specialty_thresholds_public_read on public.league_specialty_thresholds;
create policy league_specialty_thresholds_public_read
  on public.league_specialty_thresholds
  for select
  using (true);

-- Écriture réservée aux admins (pattern identique aux autres tables admin).
drop policy if exists league_specialty_thresholds_admin_write on public.league_specialty_thresholds;
create policy league_specialty_thresholds_admin_write
  on public.league_specialty_thresholds
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

commit;

-- ============================================================================
-- DOWN (rollback) — exécuter ce bloc séparément pour annuler.
-- ----------------------------------------------------------------------------
-- begin;
-- drop policy if exists league_specialty_thresholds_public_read  on public.league_specialty_thresholds;
-- drop policy if exists league_specialty_thresholds_admin_write  on public.league_specialty_thresholds;
-- drop table if exists public.league_specialty_thresholds;
-- commit;
-- ============================================================================
