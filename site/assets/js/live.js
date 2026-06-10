// site/assets/js/live.js
import { config } from "./config.js";
import { getTeamMeta } from "./teamMeta.js";

const list = document.querySelector("[data-live-matches]");
const status = document.querySelector("[data-live-status]");
const refreshButton = document.querySelector("[data-refresh-live]");
const liveCount = document.querySelector("[data-live-count]");
const upcomingCount = document.querySelector("[data-upcoming-count]");
const finishedCount = document.querySelector("[data-finished-count]");
const lastUpdated = document.querySelector("[data-last-updated]");

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

function formatKickoff(value) {
  if (!value) return "Kickoff TBD";

  return new Date(value).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getCountdown(value) {
  if (!value) return "TBD";

  const kickoff = new Date(value).getTime();
  const diff = kickoff - Date.now();

  if (diff <= 0) return "Started";

  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
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

function getStatusClass(match) {
  if (match.status === "live" || match.status === "halftime") return "is-live";
  if (match.status === "finished") return "is-finished";
  if (match.status === "scheduled") return "is-upcoming";
  return "is-neutral";
}

async function fetchLiveMatches() {
  if (!config.supabaseUrl.includes("supabase.co")) return [];

  const url = new URL("/rest/v1/public_live_matches", config.supabaseUrl);
  url.searchParams.set("select", "*");
  url.searchParams.set("order", "kickoff_at.asc");
  url.searchParams.set("limit", "40");

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

function updateSummary(matches) {
  const live = matches.filter((match) => match.status === "live" || match.status === "halftime").length;
  const upcoming = matches.filter((match) => match.status === "scheduled").length;
  const finished = matches.filter((match) => match.status === "finished").length;

  if (liveCount) liveCount.textContent = live;
  if (upcomingCount) upcomingCount.textContent = upcoming;
  if (finishedCount) finishedCount.textContent = finished;
  if (lastUpdated) lastUpdated.textContent = new Date().toLocaleTimeString();
}

function renderMatches(matches) {
  if (!list) return;

  updateSummary(matches);

  if (!matches.length) {
    list.innerHTML = `<article class="empty-state">No matches available yet.</article>`;
    return;
  }

  list.innerHTML = matches.map((match) => `
    <article class="live-match-card ${getStatusClass(match)}">
      <div class="live-card-top">
        <span class="live-status-badge">${escapeHtml(match.status)}</span>
        <span class="live-countdown">${escapeHtml(getCountdown(match.kickoff_at))}</span>
      </div>

      <div class="matchup-row live-matchup">
        ${teamBadge(match.home_team)}
        <div class="live-score">
          <strong>${match.home_score ?? "-"}</strong>
          <span>-</span>
          <strong>${match.away_score ?? "-"}</strong>
        </div>
        ${teamBadge(match.away_team)}
      </div>

      <div class="live-detail-grid">
        <div>
          <span>Kickoff</span>
          <strong>${escapeHtml(formatKickoff(match.kickoff_at))}</strong>
        </div>
        <div>
          <span>Venue</span>
          <strong>${escapeHtml(match.venue || "TBD")}</strong>
        </div>
        <div>
          <span>Minute</span>
          <strong>${match.minute ? `${escapeHtml(match.minute)}'` : "N/A"}</strong>
        </div>
        <div>
          <span>Updated</span>
          <strong>${escapeHtml(match.updated_at ? new Date(match.updated_at).toLocaleTimeString() : "N/A")}</strong>
        </div>
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