-- database/views.sql
drop view if exists public_live_matches;
drop view if exists public_predictions;
drop view if exists public_prediction_leaderboard;

create view public_live_matches
with (security_invoker = true)
as
select
  id,
  home_team,
  away_team,
  kickoff_at,
  status,
  home_score,
  away_score,
  minute,
  venue,
  competition,
  updated_at
from matches
where kickoff_at >= now() - interval '12 hours'
order by kickoff_at asc;

create view public_predictions
with (security_invoker = true)
as
select
  p.id,
  p.match_id,
  m.home_team,
  m.away_team,
  m.kickoff_at,
  p.predicted_winner,
  p.confidence,
  p.reasoning,
  p.result,
  p.is_correct,
  p.brier_score,
  p.model_name,
  p.created_at
from predictions p
join matches m on m.id = p.match_id
order by p.created_at desc;

create view public_prediction_leaderboard
with (security_invoker = true)
as
select
  model_name,
  count(*) filter (where result is not null and result <> 'pending') as scored_predictions,
  count(*) filter (where is_correct is true) as correct_predictions,
  round(
    100.0 * count(*) filter (where is_correct is true)
    / nullif(count(*) filter (where result is not null and result <> 'pending'), 0),
    2
  ) as accuracy_percent,
  round(avg(brier_score), 4) as avg_brier_score
from predictions
group by model_name
order by accuracy_percent desc nulls last, avg_brier_score asc nulls last;