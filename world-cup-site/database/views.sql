create view public_live_matches as
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
  updated_at
from matches;

create view public_predictions as
select
  id,
  match_id,
  predicted_winner,
  confidence,
  reasoning,
  result,
  is_correct,
  brier_score,
  model_name,
  created_at
from predictions;