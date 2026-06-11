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
  try {
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

    if (!response.ok) return [];
    const data = await response.json();
    
    // Clean normalization map to unify database schema variations and prevent the "1 blog" bug
    return data.map(item => ({
      slug: item.slug || `article-${item.id}`, // Failsafe so it doesn't collapse
      url_path: `articles/${item.slug || item.id}.html`,
      title: item.title,
      description: item.description,
      article_type: item.article_type || item.type || "analysis",
      primary_keyword: item.primary_keyword || item.primaryKeyword || "World Cup 2026",
      word_count: item.word_count || item.wordCount || 0
    }));
  } catch {
    return [];
  }
}

async function fetchFromManifest() {
  // Enforcing root relative path so it never triggers a 404
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
      <a class="article-card-link" href="/${escapeHtml(article.url_path)}">
        <span class="article-type">${escapeHtml(label(article.article_type))}</span>
        <h2>${escapeHtml(article.title)}</h2>
        <p>${escapeHtml(article.description)}</p>
        <div class="article-card-footer">
          <span>${escapeHtml(article.primary_keyword)}</span>
          <span>${escapeHtml(article.word_count ? article.word_count + " words" : "1000+ words")}</span>
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
  console.log("ARTICLES.JS IS RUNNING");
  
  const supabaseData = await fetchFromSupabase();
  const manifestData = await fetchFromManifest();
  
  const combined = [...supabaseData, ...manifestData];
  
  // Deduplicate array based on slug properties safely
  articles = [...new Map(combined.map(item => [item.slug, item])).values()];
  
  renderArticles();
}

init();