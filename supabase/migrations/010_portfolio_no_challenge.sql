begin;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'submissions_portfolio_no_challenge') then
    alter table public.submissions
      add constraint submissions_portfolio_no_challenge
      check (kind <> 'portfolio' or challenge_id is null);
  end if;
end $$;
commit;

-- DOWN
-- begin;
-- alter table public.submissions drop constraint if exists submissions_portfolio_no_challenge;
-- commit;
