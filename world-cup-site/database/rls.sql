alter table matches enable row level security;
alter table predictions enable row level security;
alter table model_runs enable row level security;

create policy "public can read matches"
on matches for select
using (true);

create policy "public can read predictions"
on predictions for select
using (true);

create policy "service role can manage matches"
on matches for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role can manage predictions"
on predictions for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role can manage model runs"
on model_runs for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');