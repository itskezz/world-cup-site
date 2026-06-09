<!-- automation/prompts/match-preview.md -->
Write one football match preview.

Return only valid JSON:

{
  "title": "SEO title",
  "description": "Meta description",
  "sections": [
    {
      "heading": "Section heading",
      "body": "Section body"
    }
  ]
}

Rules:
- Mention both teams.
- Do not invent injuries, suspensions, lineups, odds, or insider information.
- Do not guarantee outcomes.
- Do not give financial advice.
- Keep it useful, specific, and search-friendly.
- Include at least 3 sections.
- No markdown.
- No affiliate links.

Match data:
{{MATCH_JSON}}