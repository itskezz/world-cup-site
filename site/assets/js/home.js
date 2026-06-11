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

function label(type) {
  return String(type || "analysis").replaceAll("-", " ");
}

async function fetchFromSupabase() {
  const url = new URL("/rest/v1/public_generated_articles", config.supabaseUrl);
  url.searchParams.set("select", "*");
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "200");

  const response = await fetch(url, {
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`
    }
  });

  if (!response.ok) throw new Error(`Article fetch failed: ${response.status}`);
  return response.json();
}

async function fetchFromManifest() {
  const response = await fetch("/articles/articles.json", { cache: "no-store" });
  if (!response.ok) return [];

  const rows = await response.json();

  return rows.map((item) => ({
    slug: item.slug,
    url_path: `articles/${item.slug}.html`,
    title: item.title,
    description: item.description,
    article_type: item.article_type || item.type || "analysis",
    primary_keyword: item.primaryKeyword || item.primary_keyword || "World Cup 2026",
    home_team: item.home_team || "World Cup",
    away_team: item.away_team || "2026",
    word_count: item.wordCount || item.word_count || 0
  }));
}

function renderArticles(type = "all") {
  // Guard clause just in case the script runs on a page without the grid
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
        <span class="article-type">${escapeHtml(label(article.article_type))}</span>
        <h2>${escapeHtml(article.title)}</h2>
        <p>${escapeHtml(article.description)}</p>
        <div class="article-card-footer">
          <span>${escapeHtml(article.primary_keyword)}</span>
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
  try {
    articles = await fetchFromSupabase();
    if (!articles.length) articles = await fetchFromManifest();
    renderArticles();
  } catch {
    articles = await fetchFromManifest();
    renderArticles();
  }
}

// Only initialize if the target grid actually exists on the page
if (target) {
  init();
}