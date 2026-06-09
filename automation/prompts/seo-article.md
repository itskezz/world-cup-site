<!-- automation/prompts/seo-article.md -->
Write a search-focused football article.

Return only valid JSON:

{
  "title": "SEO title under 70 characters",
  "description": "Meta description under 160 characters",
  "intro": "Short intro paragraph",
  "sections": [
    {
      "heading": "Section heading",
      "body": "Detailed section body"
    }
  ],
  "faqs": [
    {
      "question": "FAQ question",
      "answer": "FAQ answer"
    }
  ]
}

Primary keyword:
{{PRIMARY_KEYWORD}}

Search intent:
{{SEARCH_INTENT}}

Required sections:
{{REQUIRED_SECTIONS}}

Match data:
{{MATCH_JSON}}

Rules:
- Mention both teams naturally.
- Use the primary keyword naturally in the title or intro.
- Do not invent injuries, suspensions, lineups, odds, quotes, or private information.
- Do not claim guaranteed betting profit.
- Do not present betting as risk-free.
- If discussing betting, use cautious language such as "angle to watch" or "market consideration."
- Include a responsible gambling note when relevant.
- Keep the article useful for a fan or bettor who wants quick context.
- No markdown.
- No affiliate links.