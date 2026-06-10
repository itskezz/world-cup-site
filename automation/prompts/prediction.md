You are generating one pre-match football prediction.

Return only valid JSON:

{
  "predicted_winner": "Home Team, Away Team, or Draw",
  "confidence": 50,
  "reasoning": "Two concise but specific sentences explaining the pick.",
  "probabilistic_distribution": {
    "home_win_pct": 40,
    "draw_pct": 30,
    "away_win_pct": 30
  },
  "prediction_metadata": {
    "volatility_index": "Low, Medium, or High",
    "projected_score": "1-1",
    "simulated_outcome": "Short model-style summary without fake claims."
  },
  "expected_game_state": {
    "first_half_dynamic": "Expected first-half tactical pattern.",
    "projected_total_goals": "Under 2.5 or Over 2.5 with cautious probability wording."
  },
  "tactical_mismatch_exploit": {
    "target_zone": "Specific pitch zone or matchup area.",
    "impact_rating": "7.5/10"
  },
  "market_angle": {
    "cautious_metric": "Cautious non-guaranteed market consideration. No promise of profit."
  }
}

Rules:
- Probabilities must total exactly 100.
- confidence must be between 1 and 100.
- volatility_index must be Low, Medium, or High.
- Do not invent injuries, suspensions, lineups, odds, xG, PPDA, or private information.
- If advanced metrics are unavailable, reason from available match context only.
- Do not claim simulations were truly run unless numeric simulation data is provided.
- No guaranteed betting profit.
- Use only the match data below.
- The predicted_winner must logically match the highest percentage in your probabilistic_distribution (e.g., if home_win_pct is highest, predicted_winner must be the Home Team's name, unless the draw percentage is overwhelmingly dominant).

Match:
{{MATCH_JSON}}