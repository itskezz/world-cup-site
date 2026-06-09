// automation/lib/validateArticle.js
const REQUIRED_KEYS = ["title", "description", "sections"];

export function validateArticle(article, match) {
  for (const key of REQUIRED_KEYS) {
    if (!article[key]) {
      throw new Error(`Article missing required key: ${key}`);
    }
  }

  if (!Array.isArray(article.sections) || article.sections.length < 3) {
    throw new Error("Article must include at least 3 sections");
  }

  const text = JSON.stringify(article).toLowerCase();

  const home = match.home_team.toLowerCase();
  const away = match.away_team.toLowerCase();

  if (!text.includes(home) || !text.includes(away)) {
    throw new Error("Article does not mention both teams");
  }

  return {
    title: String(article.title).slice(0, 90),
    description: String(article.description).slice(0, 170),
    sections: article.sections.slice(0, 6).map((section) => ({
      heading: String(section.heading || "").slice(0, 80),
      body: String(section.body || "").slice(0, 1200)
    }))
  };
}