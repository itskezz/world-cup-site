// automation/lib/validateArticle.js
function countWords(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

export function validateArticle(article, match, topic) {
  if (!article.title || !article.description || !Array.isArray(article.sections)) {
    throw new Error("Article must include title, description, and sections");
  }

  if (article.sections.length < 5) {
    throw new Error("Article must include at least 5 sections");
  }

  const allText = JSON.stringify(article).toLowerCase();

  if (!allText.includes(match.home_team.toLowerCase())) {
    throw new Error("Article does not mention home team");
  }

  if (!allText.includes(match.away_team.toLowerCase())) {
    throw new Error("Article does not mention away team");
  }

  const totalWords =
    countWords(article.intro) +
    article.sections.reduce((sum, section) => sum + countWords(section.body), 0) +
    (Array.isArray(article.faqs)
      ? article.faqs.reduce((sum, faq) => sum + countWords(faq.answer), 0)
      : 0);

  if (totalWords < 750) {
    throw new Error(`Article too short: ${totalWords} words`);
  }

  return {
    title: String(article.title).slice(0, 92),
    description: String(article.description).slice(0, 170),
    intro: String(article.intro || "").slice(0, 1200),
    wordCount: totalWords,
    sections: article.sections.slice(0, 8).map((section) => ({
      heading: String(section.heading || "").slice(0, 90),
      body: String(section.body || "").slice(0, 1800)
    })),
    faqs: Array.isArray(article.faqs)
      ? article.faqs.slice(0, 4).map((faq) => ({
          question: String(faq.question || "").slice(0, 140),
          answer: String(faq.answer || "").slice(0, 800)
        }))
      : []
  };
}