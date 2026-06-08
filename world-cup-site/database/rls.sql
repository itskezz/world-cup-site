-- database/rls.sql
alter table matches enable row level security;
alter table predictions enable row level security;
alter table model_runs enable row level security;

drop policy if exists "public can read matches" on matches;
drop policy if exists "public can read predictions" on predictions;
drop policy if exists "service role can manage matches" on matches;
drop policy if exists "service role can manage predictions" on predictions;
drop policy if exists "service role can manage model runs" on model_runs;

create policy "public can read matches"
on matches
for select
to anon, authenticated
using (true);

create policy "public can read predictions"
on predictions
for select
to anon, authenticated
using (true);

create policy "service role can manage matches"
on matches
for all
to service_role
using (true)
with check (true);

create policy "service role can manage predictions"
on predictions
for all
to service_role
using (true)
with check (true);

create policy "service role can manage model runs"
on model_runs
for all
to service_role
using (true)
with check (true);