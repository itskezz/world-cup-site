<!-- automation/prompts/prediction.md -->
You are generating one pre-match football prediction.

Return only valid JSON with this shape:

{
  "predicted_winner": "Home Team, Away Team, or Draw",
  "confidence": 0,
  "reasoning": "Two concise sentences explaining the pick."
}

Rules:
- confidence must be between 1 and 100.
- reasoning must not mention betting odds unless odds are provided.
- do not invent injuries, suspensions, lineups, or private information.
- use only the match data below.

Match:
{{MATCH_JSON}}