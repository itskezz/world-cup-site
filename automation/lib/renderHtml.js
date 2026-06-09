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

export function renderArticlePage({ article, match, slug, siteBaseUrl }) {
  const canonical = `${siteBaseUrl}/articles/${slug}.html`;

  const schema = {
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
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>
  <header class="site-header" data-site-header></header>
  <main class="page-shell legal-copy">
    <p class="eyebrow">Match Preview</p>
    <h1>${escapeHtml(article.title)}</h1>
    <p>${escapeHtml(article.description)}</p>
    ${article.sections.map((section) => `
      <section>
        <h2>${escapeHtml(section.heading)}</h2>
        <p>${escapeHtml(section.body)}</p>
      </section>
    `).join("")}
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
        <span>${escapeHtml(item.home_team)} vs ${escapeHtml(item.away_team)}</span>
        <span>${escapeHtml(new Date(item.kickoff_at).toLocaleDateString("en-US"))}</span>
      </div>
    </article>
  `).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Analysis | AI Football Predictor</title>
  <meta name="description" content="World Cup match previews, prediction analysis, and post-match recaps.">
  <link rel="stylesheet" href="./assets/css/main.css">
  <script type="module" src="./assets/js/common.js"></script>
</head>
<body>
  <header class="site-header" data-site-header></header>
  <main class="page-shell">
    <section class="page-title">
      <p class="eyebrow">Analysis</p>
      <h1>Match Previews & Recaps</h1>
      <p>Generated previews and recaps published as lightweight static pages.</p>
    </section>
    <section class="article-grid">
      ${cards || '<article class="empty-state">No articles published yet.</article>'}
    </section>
  </main>
  <footer class="site-footer" data-site-footer></footer>
</body>
</html>`;
}