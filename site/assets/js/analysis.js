// site/assets/js/analysis.js
import { config } from "./config.js";

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

async function fetchArticles() {
  const url = new URL("/rest/v1/public_generated_articles", config.supabaseUrl);
  url.searchParams.set("select", "*");
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "100");

  const response = await fetch(url, {
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`Article fetch failed: ${response.status}`);
  }

  return response.json();
}

function renderArticles(type = "all") {
  if (!target) return;

  const visible = type === "all"
    ? articles
    : articles.filter((article) => article.article_type === type);

  if (!visible.length) {
    target.innerHTML = `<article class="empty-state">No articles found for this category yet.</article>`;
    return;
  }

  target.innerHTML = visible.map((article) => `
    <article class="article-list-card">
      <a class="article-card-link" href="./${escapeHtml(article.url_path)}">
        <span class="article-type">${escapeHtml(articleLabel(article.article_type))}</span>
        <h2>${escapeHtml(article.title)}</h2>
        <p>${escapeHtml(article.description)}</p>
        <div class="article-card-footer">
          <span>${escapeHtml(article.home_team)} vs ${escapeHtml(article.away_team)}</span>
          <span>${escapeHtml(article.primary_keyword)}</span>
          <span>${escapeHtml(article.word_count || "1000+")} words</span>
        </div>
      </a>
    </article>
  `).join("");
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const type = button.dataset.articleFilter;

    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderArticles(type);
  });
});

async function init() {
  if (!target) return;

  try {
    articles = await fetchArticles();
    renderArticles();
  } catch {
    target.innerHTML = `<article class="empty-state">Article data unavailable.</article>`;
  }
}

init();