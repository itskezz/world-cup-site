// automation/lib/renderHtml.js
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function renderFaqSchema(faqs) {
  if (!faqs.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
}

export function renderArticlePage({ article, match, topic, slug, siteBaseUrl }) {
  const canonical = `${siteBaseUrl}/articles/${slug}.html`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    mainEntityOfPage: canonical,
    datePublished: new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: "AI Football Predictor"
    },
    about: {
      "@type": "SportsEvent",
      name: `${match.home_team} vs ${match.away_team}`,
      startDate: match.kickoff_at,
      location: match.venue || "TBD"
    }
  };

  const faqSchema = renderFaqSchema(article.faqs);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(article.title)} | AI Football Predictor</title>
  <meta name="description" content="${escapeHtml(article.description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="stylesheet" href="../assets/css/main.css">
  <script type="module" src="../assets/js/common.js"></script>
  <script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
  ${faqSchema ? `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>` : ""}
</head>
<body>
  <header class="site-header" data-site-header></header>
  <main class="page-shell article-copy">
    <p class="eyebrow">${escapeHtml(topic.type.replace("-", " "))}</p>
    <h1>${escapeHtml(article.title)}</h1>
    <p class="hero-copy">${escapeHtml(article.intro || article.description)}</p>

    ${article.sections.map((section) => `
      <section class="article-section">
        <h2>${escapeHtml(section.heading)}</h2>
        <p>${escapeHtml(section.body)}</p>
      </section>
    `).join("")}

    ${article.faqs.length ? `
      <section class="article-section">
        <h2>FAQ</h2>
        ${article.faqs.map((faq) => `
          <h3>${escapeHtml(faq.question)}</h3>
          <p>${escapeHtml(faq.answer)}</p>
        `).join("")}
      </section>
    ` : ""}

    <aside class="disclosure-box">
      <strong>Responsible gambling note</strong>
      <p>Predictions are informational only and are not financial advice. Only bet where legal and never risk more than you can afford to lose.</p>
    </aside>

    <p><a href="../analysis.html">Back to analysis</a></p>
  </main>
  <footer class="site-footer" data-site-footer></footer>
</body>
</html>`;
}

export function renderAnalysisIndex(articles) {
  const cards = articles.map((item) => `
    <article class="prediction-card">
      <header>
        <h2><a href="./articles/${escapeHtml(item.slug)}.html">${escapeHtml(item.title)}</a></h2>
      </header>
      <p>${escapeHtml(item.description)}</p>
      <div class="meta-row">
        <span>${escapeHtml(item.type)}</span>
        <span>${escapeHtml(item.home_team)} vs ${escapeHtml(item.away_team)}</span>
      </div>
    </article>
  `).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Analysis | AI Football Predictor</title>
  <meta name="description" content="World Cup match previews, prediction analysis, betting angles, group-impact articles, and recaps.">
  <link rel="stylesheet" href="./assets/css/main.css">
  <script type="module" src="./assets/js/common.js"></script>
</head>
<body>
  <header class="site-header" data-site-header></header>
  <main class="page-shell">
    <section class="page-title">
      <p class="eyebrow">Analysis</p>
      <h1>Match Previews & Prediction Blogs</h1>
      <p>Search-focused previews, predictor blogs, upset watches, and group-impact analysis.</p>
    </section>
    <section class="article-grid">
      ${cards || '<article class="empty-state">No articles published yet.</article>'}
    </section>
  </main>
  <footer class="site-footer" data-site-footer></footer>
</body>
</html>`;
}