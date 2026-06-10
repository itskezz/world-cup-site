// site/assets/js/home.js
import { config } from "./config.js";
import { getTeamMeta } from "./teamMeta.js";

const tabs = document.querySelectorAll("[data-home-tab]");
const panels = document.querySelectorAll("[data-home-panel]");
const matchesTarget = document.querySelector("[data-home-matches]");
const predictionsTarget = document.querySelector("[data-home-predictions]");
const articlesTarget = document.querySelector("[data-article-list]");

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

  if (!response.ok) {
    throw new Error(`Supabase read failed: ${response.status}`);
  }

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
  const articlesTarget = document.querySelector("[data-article-list]");
  
  if (!articlesTarget) {
    console.error("DEBUG: Could not find [data-article-list] in the DOM!");
    return;
  }

  try {
    const response = await fetch("/articles/articles.json", { cache: "no-store" });
    
    if (!response.ok) {
      throw new Error(`Articles manifest returned status ${response.status}`);
    }

    const articles = await response.json();
    console.log("DEBUG: Articles loaded successfully:", articles);

    if (!Array.isArray(articles) || articles.length === 0) {
      console.warn("DEBUG: Articles array is empty or invalid:", articles);
      articlesTarget.innerHTML = `<article class="empty-state">No articles found.</article>`;
      return;
    }

    articlesTarget.innerHTML = articles.slice(0, 6).map((article) => `
      <article class="home-card article-card-rich">
        <span class="article-type">${escapeHtml(article.type || "Analysis")}</span>
        <h3><a href="/articles/${escapeHtml(article.slug)}.html">${escapeHtml(article.title)}</a></h3>
        <p>${escapeHtml(article.description)}</p>
      </article>
    `).join("");
    
    console.log("DEBUG: Articles injected into DOM.");

  } catch (err) {
    console.error("DEBUG: Failed to load articles:", err);
    articlesTarget.innerHTML = `<article class="empty-state">Error loading articles. Check console.</article>`;
  }
}

setupTabs();
loadMatches();
loadPredictions();
loadArticles();