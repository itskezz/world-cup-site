-- database/schema.sql
create extension if not exists pgcrypto;

create table if not exists matches (
  id text primary key,
  home_team text not null,
  away_team text not null,
  kickoff_at timestamptz not null,
  status text not null default 'scheduled',
  home_score int,
  away_score int,
  minute int,
  venue text,
  competition text not null default 'World Cup 2026',
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_status_check check (status in ('scheduled','live','halftime','finished','postponed','cancelled')),
  constraint matches_score_check check ((home_score is null or home_score >= 0) and (away_score is null or away_score >= 0)),
  constraint matches_minute_check check (minute is null or (minute >= 0 and minute <= 130))
);

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references matches(id) on delete cascade,
  predicted_winner text not null,
  confidence numeric(5,2) not null,
  reasoning text not null,
  result text,
  is_correct boolean,
  brier_score numeric(8,4),
  model_name text not null,
  created_at timestamptz not null default now(),
  constraint predictions_confidence_check check (confidence >= 0 and confidence <= 100),
  constraint predictions_result_check check (result is null or result in ('pending','home_win','away_win','draw','void')),
  constraint predictions_brier_score_check check (brier_score is null or (brier_score >= 0 and brier_score <= 1))
);

create table if not exists model_runs (
  id uuid primary key default gen_random_uuid(),
  match_id text references matches(id) on delete set null,
  run_type text not null,
  provider text not null,
  model_name text not null,
  status text not null,
  error_message text,
  created_at timestamptz not null default now(),
  constraint model_runs_run_type_check check (run_type in ('sync_matches','prediction','preview','recap','deploy')),
  constraint model_runs_status_check check (status in ('started','success','failed','skipped'))
);

create index if not exists matches_kickoff_at_idx on matches (kickoff_at);
create index if not exists matches_status_idx on matches (status);
create index if not exists predictions_match_id_idx on predictions (match_id);
create index if not exists predictions_created_at_idx on predictions (created_at desc);
create index if not exists model_runs_created_at_idx on model_runs (created_at desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists matches_set_updated_at on matches;

create trigger matches_set_updated_at
before update on matches
for each row
execute function set_updated_at();