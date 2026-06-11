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
<body class="blog-body-bg">
  <header class="site-header" data-site-header></header>

  <main class="blog-page-shell">
    <div class="bg-white-canvas">
      <article class="blog-post">
        <header class="blog-post-header">
          <span class="article-type-badge">${escapeHtml((topic.type || "analysis").replace("-", " "))}</span>
          <h1>${escapeHtml(article.title)}</h1>
          <p class="blog-lead-intro">${escapeHtml(article.intro || article.description)}</p>
          <div class="blog-meta">
            <span><strong>Matchup:</strong> ${escapeHtml(match.home_team)} vs ${escapeHtml(match.away_team)}</span>
            <span><strong>Focus:</strong> ${escapeHtml(topic.primaryKeyword)}</span>
            <span><strong>Updated:</strong> ${escapeHtml(new Date().toLocaleDateString("en-US", {month:'short', day:'numeric', year:'numeric'}))}</span>
          </div>
        </header>

        <div class="ad-slot light">Advertisement</div>

        ${sections.map((section, index) => `
          <section class="blog-section">
            <h2>${escapeHtml(section.heading)}</h2>
            <p>${escapeHtml(section.body)}</p>
          </section>
          
          ${index === 0 ? `
            <div class="blog-inline-image-wrapper">
              <img src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80" alt="Football Stadium Pitch" class="blog-featured-media">
            </div>
          ` : ""}

          ${index === 1 ? `
            <div class="blog-inline-image-wrapper">
              <img src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80" alt="Football match action tactical view" class="blog-featured-media">
            </div>
          ` : ""}
        `).join("")}

        ${faqs.length ? `
          <section class="blog-section faq-block">
            <h2>Frequently Asked Questions</h2>
            <dl class="faq-accordion">
              ${faqs.map((faq) => `
                <dt><h3>${escapeHtml(faq.question)}</h3></dt>
                <dd><p>${escapeHtml(faq.answer)}</p></dd>
              `).join("")}
            </dl>
          </section>
        ` : ""}

        <aside class="disclosure-box">
          <strong>Responsible Gambling Note</strong>
          <p>Predictions are informational only and generated using advanced analytics models. This is not financial advice. Only wager what you can afford to lose.</p>
        </aside>
      </article>
    </div>

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
        <h2>Trending Analysis</h2>
        <ul class="top-picks-list">
          <li><a href="../analysis.html">World Cup Schedule Guide</a></li>
          <li><a href="../analysis.html">How to Watch World Cup Live Online</a></li>
          <li><a href="../analysis.html">World Cup Live Scores & Updates</a></li>
          <li><a href="../predictor.html">Latest AI Match Predictions</a></li>
        </ul>
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