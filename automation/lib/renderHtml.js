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

function renderFaqSchema(faqs = []) {
  if (!faqs || !faqs.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

export function renderArticlePage({ article, match, topic, slug, siteBaseUrl }) {
  const canonical = `${siteBaseUrl}/articles/${slug}.html`;
  
  // Safe fallbacks for AI content blocks
  const sections = article.sections || [];
  const faqs = article.faqs || [];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.description,
    "mainEntityOfPage": canonical,
    "datePublished": new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": "AI Football Predictor"
    },
    "about": {
      "@type": "SportsEvent",
      "name": `${match.home_team} vs ${match.away_team}`,
      "startDate": match.kickoff_at,
      "location": match.venue || "TBD"
    }
  };

  const faqSchema = renderFaqSchema(faqs);

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

  <main class="blog-page-shell">
    <article class="blog-post">
      <header class="blog-post-header">
        <span class="article-type">${escapeHtml((topic.type || "analysis").replace("-", " "))}</span>
        <h1>${escapeHtml(article.title)}</h1>
        <p>${escapeHtml(article.intro || article.description)}</p>
        <div class="blog-meta">
          <span>${escapeHtml(match.home_team)} vs ${escapeHtml(match.away_team)}</span>
          <span>${escapeHtml(topic.primaryKeyword)}</span>
          <span>Updated ${escapeHtml(new Date().toLocaleDateString("en-US"))}</span>
        </div>
      </header>

      <div class="ad-slot light">Advertisement</div>

      ${sections.map((section) => `
        <section class="blog-section">
          <h2>${escapeHtml(section.heading)}</h2>
          <p>${escapeHtml(section.body)}</p>
        </section>
      `).join("")}

      ${faqs.length ? `
        <section class="blog-section faq-block">
          <h2>FAQ</h2>
          ${faqs.map((faq) => `
            <h3>${escapeHtml(faq.question)}</h3>
            <p>${escapeHtml(faq.answer)}</p>
          `).join("")}
        </section>
      ` : ""}

      <aside class="disclosure-box">
        <strong>Responsible gambling note</strong>
        <p>Predictions are informational only and are not financial advice. Only bet where legal and never risk more than you can afford to lose.</p>
      </aside>
    </article>

    <aside class="blog-sidebar">
      <section class="sidebar-card newsletter-card">
        <span class="article-type">Instant update</span>
        <h2>Get the next algorithmic prediction</h2>
        <p>Receive the next match prediction 2 hours before kickoff, plus major live-score and article alerts.</p>
        <form class="newsletter-form">
          <input type="email" placeholder="Email address" aria-label="Email address">
          <button type="button">Notify me</button>
        </form>
        <small>Email capture provider connects later.</small>
      </section>

      <section class="sidebar-card">
        <h2>Trending / Top Picks</h2>
        <ul class="top-picks-list">
          <li><a href="../analysis.html">World Cup 2026 schedule guide</a></li>
          <li><a href="../analysis.html">How to watch World Cup 2026 live online</a></li>
          <li><a href="../analysis.html">World Cup live scores and updates</a></li>
          <li><a href="../predictor.html">Latest AI match predictions</a></li>
        </ul>
      </section>

      <section class="sidebar-card ad-card">
        <span>Advertisement</span>
      </section>
    </aside>
  </main>

  <footer class="site-footer" data-site-footer></footer>
</body>
</html>`;
}

export function renderAnalysisIndex(articles = []) {
  const cards = articles.map((item) => `
    <article class="prediction-card article-card-rich">
      <span class="article-type">${escapeHtml(item.type || "analysis")}</span>
      <header>
        <h2><a href="./articles/${escapeHtml(item.slug)}.html">${escapeHtml(item.title)}</a></h2>
      </header>
      <p>${escapeHtml(item.description)}</p>
      <div class="meta-row">
        <span>${escapeHtml(item.primaryKeyword || "World Cup 2026")}</span>
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
  <meta name="description" content="World Cup match previews, prediction blogs, betting angles, upset watches, group-impact analysis, and recaps.">
  <link rel="stylesheet" href="./assets/css/main.css">
  <script type="module" src="./assets/js/common.js"></script>
</head>
<body>
  <header class="site-header" data-site-header></header>
  <main class="page-shell">
    <section class="page-title">
      <p class="eyebrow">Analysis</p>
      <h1>Match Blogs & Prediction Analysis</h1>
      <p>Search-focused football blogs covering predictions, betting angles, upset watch, and group-impact storylines.</p>
    </section>
    
    <section class="article-grid" data-article-list>
      ${cards || '<article class="empty-state">No articles published yet.</article>'}
    </section>
  </main>
  <footer class="site-footer" data-site-footer></footer>
</body>
</html>`;
}