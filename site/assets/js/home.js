import { config } from "./config.js";
import { getTeamMeta } from "./teamMeta.js";

const tabs = document.querySelectorAll("[data-home-tab]");
const panels = document.querySelectorAll("[data-home-panel]");
const matchesTarget = document.querySelector("[data-home-matches]");
const predictionsTarget = document.querySelector("[data-home-predictions]");
const articlesTarget = document.querySelector("[data-home-articles]");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function formatDate(value) {
  if (!value) return "TBD";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function teamBadge(teamName) {
  const meta = getTeamMeta(teamName);
  return `
    <span class="team-badge" style="--team-a:${meta.colors[0]};--team-b:${meta.colors[1]}">
      <span class="team-flag">${escapeHtml(meta.code)}</span>
      <span>${escapeHtml(teamName)}</span>
    </span>
  `;
}

async function supabaseRead(view, params = {}) {
  if (!config.supabaseUrl.includes("supabase.co")) return [];

  const url = new URL(`/rest/v1/${view}`, config.supabaseUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`
    }
  });

  if (!response.ok) throw new Error(`Supabase read failed: ${response.status}`);
  return response.json();
}

function setupTabs() {
  tabs.forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.dataset.homeTab;
      tabs.forEach((item) => item.classList.toggle("active", item === button));
      panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.homePanel === selected));
    });
  });
}

async function loadMatches() {
  if (!matchesTarget) return;
  try {
    const matches = await supabaseRead("public_live_matches", {
      select: "*",
      order: "kickoff_at.asc",
      limit: "6"
    });
    if (!matches.length) {
      matchesTarget.innerHTML = `<article class="empty-state">No match data available yet.</article>`;
      return;
    }
    matchesTarget.innerHTML = matches.map((match) => `
      <article class="home-card">
        <div class="matchup-row compact">
          ${teamBadge(match.home_team)}
          <span class="versus">vs</span>
          ${teamBadge(match.away_team)}
        </div>
        <div class="home-card-main">
          <strong>${match.home_score ?? "-"} - ${match.away_score ?? "-"}</strong>
          <span>${escapeHtml(match.status)}</span>
        </div>
        <div class="meta-row">
          <span>${escapeHtml(formatDate(match.kickoff_at))}</span>
          <span>${escapeHtml(match.venue || "Venue TBD")}</span>
        </div>
      </article>
    `).join("");
  } catch {
    matchesTarget.innerHTML = `<article class="empty-state">Match data unavailable.</article>`;
  }
}

async function loadPredictions() {
  if (!predictionsTarget) return;
  try {
    const predictions = await supabaseRead("public_predictions", {
      select: "*",
      order: "created_at.desc",
      limit: "6"
    });
    if (!predictions.length) {
      predictionsTarget.innerHTML = `<article class="empty-state">No predictions available yet.</article>`;
      return;
    }
    predictionsTarget.innerHTML = predictions.map((prediction) => `
      <article class="home-card">
        <div class="matchup-row compact">
          ${teamBadge(prediction.home_team)}
          <span class="versus">vs</span>
          ${teamBadge(prediction.away_team)}
        </div>
        <div class="home-card-main">
          <strong>${escapeHtml(prediction.predicted_winner)}</strong>
          <span>${escapeHtml(prediction.confidence)}% confidence</span>
        </div>
        <p>${escapeHtml(prediction.reasoning)}</p>
      </article>
    `).join("");
  } catch {
    predictionsTarget.innerHTML = `<article class="empty-state">Prediction data unavailable.</article>`;
  }
}

async function loadArticles() {
  if (!articlesTarget) return;

  try {
    // 1. Fetch from Supabase using the built-in supabaseRead function
    let supabaseData = [];
    try {
      const dbData = await supabaseRead("public_generated_articles", {
        select: "*",
        order: "created_at.desc",
        limit: "6" // We only need a few for the homepage
      });
      
      // Normalize to match manifest format so they blend seamlessly
      supabaseData = dbData.map(item => ({
        slug: item.slug || `article-${item.id}`,
        title: item.title,
        description: item.description,
        type: item.article_type || item.type || "analysis",
        primaryKeyword: item.primary_keyword || item.primaryKeyword || "World Cup 2026"
      }));
    } catch (dbErr) {
      console.warn("Homepage: Could not fetch articles from Supabase", dbErr);
    }

    // 2. Fetch from local manifest
    let manifestData = [];
    try {
      const response = await fetch("/articles/articles.json", { cache: "no-store" });
      if (response.ok) {
        manifestData = await response.json();
      }
    } catch (manErr) {
      console.warn("Homepage: Could not fetch articles from manifest", manErr);
    }

    // 3. Combine, deduplicate by slug, and limit to max 6 for the layout
    const combined = [...supabaseData, ...manifestData];
    const articles = [...new Map(combined.map(item => [item.slug, item])).values()];

    if (!articles.length) {
      articlesTarget.innerHTML = `<article class="empty-state">Run the SEO article workflow to populate article cards.</article>`;
      return;
    }

    articlesTarget.innerHTML = articles.slice(0, 6).map((article) => `
      <article class="home-card article-card-rich">
        <span class="article-type">${escapeHtml(article.type || "analysis").replace("-", " ")}</span>
        <h3><a href="/articles/${escapeHtml(article.slug)}.html">${escapeHtml(article.title)}</a></h3>
        <p>${escapeHtml(article.description)}</p>
        <div class="meta-row">
          <span>${escapeHtml(article.primaryKeyword || "World Cup analysis")}</span>
        </div>
      </article>
    `).join("");
  } catch (err) {
    console.error("Article load failed:", err);
    articlesTarget.innerHTML = `<article class="empty-state">Article data unavailable.</article>`;
  }
}

setupTabs();
loadMatches();
loadPredictions();
loadArticles();