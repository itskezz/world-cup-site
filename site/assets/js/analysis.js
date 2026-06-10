// site/assets/js/analysis.js
const target = document.querySelector("[data-article-list]");
const filterButtons = document.querySelectorAll("[data-article-filter]");

let articles = [];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function articleLabel(type) {
  return String(type || "analysis").replaceAll("-", " ");
}

function renderArticles(type = "all") {
  if (!target) return;

  const visible = type === "all"
    ? articles
    : articles.filter((article) => article.type === type);

  if (!visible.length) {
    target.innerHTML = `<article class="empty-state">No articles found for this category yet.</article>`;
    return;
  }

  target.innerHTML = visible.map((article) => `
    <article class="article-list-card">
      <a class="article-card-link" href="./articles/${escapeHtml(article.slug)}.html">
        <span class="article-type">${escapeHtml(articleLabel(article.type))}</span>
        <h2>${escapeHtml(article.title)}</h2>
        <p>${escapeHtml(article.description)}</p>
        <div class="article-card-footer">
          <span>${escapeHtml(article.home_team)} vs ${escapeHtml(article.away_team)}</span>
          <span>${escapeHtml(article.wordCount || "1000+")} words</span>
        </div>
      </a>
    </article>
  `).join("");
}

async function loadArticles() {
  if (!target) return;

  try {
    const response = await fetch("./articles/articles.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Article manifest missing");
    }

    articles = await response.json();
    renderArticles();
  } catch {
    target.innerHTML = `
      <article class="empty-state">
        Articles exist after the SEO workflow runs and deploys the articles manifest.
      </article>
    `;
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const type = button.dataset.articleFilter;

    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderArticles(type);
  });
});

loadArticles();