// automation/lib/validateArticle.js
export function validateArticle(article, match, topic) {
  if (!article.title || !article.description || !Array.isArray(article.sections)) {
    throw new Error("Article must include title, description, and sections");
  }

  if (article.sections.length < 4) {
    throw new Error("Article must include at least 4 sections");
  }

  const allText = JSON.stringify(article).toLowerCase();

  if (!allText.includes(match.home_team.toLowerCase())) {
    throw new Error("Article does not mention home team");
  }

  if (!allText.includes(match.away_team.toLowerCase())) {
    throw new Error("Article does not mention away team");
  }

  if (!allText.includes(topic.primaryKeyword.toLowerCase().split(" ")[0])) {
    throw new Error("Article appears unrelated to topic");
  }

  return {
    title: String(article.title).slice(0, 92),
    description: String(article.description).slice(0, 170),
    intro: String(article.intro || "").slice(0, 900),
    sections: article.sections.slice(0, 8).map((section) => ({
      heading: String(section.heading || "").slice(0, 90),
      body: String(section.body || "").slice(0, 1400)
    })),
    faqs: Array.isArray(article.faqs)
      ? article.faqs.slice(0, 4).map((faq) => ({
          question: String(faq.question || "").slice(0, 120),
          answer: String(faq.answer || "").slice(0, 600)
        }))
      : []
  };
}