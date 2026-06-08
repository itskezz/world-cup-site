create table matches (
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
  updated_at timestamptz not null default now()
);

create table predictions (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references matches(id) on delete cascade,
  predicted_winner text not null,
  confidence numeric(5,2) not null check (confidence >= 0 and confidence <= 100),
  reasoning text not null,
  result text,
  is_correct boolean,
  brier_score numeric(8,4),
  model_name text not null,
  created_at timestamptz not null default now()
);

create table model_runs (
  id uuid primary key default gen_random_uuid(),
  match_id text references matches(id) on delete set null,
  run_type text not null,
  provider text not null,
  model_name text not null,
  status text not null,
  error_message text,
  created_at timestamptz not null default now()
);