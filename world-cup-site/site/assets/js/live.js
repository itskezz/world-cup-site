// site/assets/js/live.js
import { config } from "./config.js";

const list = document.querySelector("[data-live-matches]");
const status = document.querySelector("[data-live-status]");
const refreshButton = document.querySelector("[data-refresh-live]");

function setStatus(message) {
  if (status) status.textContent = message;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

async function fetchLiveMatches() {
  if (!config.supabaseUrl.includes("supabase.co")) return [];

  const url = new URL("/rest/v1/public_live_matches", config.supabaseUrl);
  url.searchParams.set("select", "*");
  url.searchParams.set("order", "kickoff_at.asc");

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

function renderMatches(matches) {
  if (!list) return;

  if (!matches.length) {
    list.innerHTML = `<article class="empty-state">No live matches available yet.</article>`;
    return;
  }

  list.innerHTML = matches.map((match) => `
    <article class="match-card">
      <header>
        <h2>${escapeHtml(match.home_team)} vs ${escapeHtml(match.away_team)}</h2>
        <div class="match-score">${match.home_score ?? "-"}-${match.away_score ?? "-"}</div>
      </header>
      <div class="meta-row">
        <span>${escapeHtml(match.status)}</span>
        <span>${match.minute ? `${escapeHtml(match.minute)}'` : ""}</span>
        <span>${escapeHtml(match.venue || "")}</span>
      </div>
    </article>
  `).join("");
}

async function loadLiveMatches() {
  try {
    setStatus("Refreshing");
    const matches = await fetchLiveMatches();
    renderMatches(matches);
    setStatus(`Updated ${new Date().toLocaleTimeString()}`);
  } catch {
    setStatus("Data unavailable");
    renderMatches([]);
  }
}

refreshButton?.addEventListener("click", loadLiveMatches);
loadLiveMatches();
window.setInterval(loadLiveMatches, config.pollingMs);