// site/assets/js/predictor.js
import { config } from "./config.js";
import { getTeamMeta } from "./teamMeta.js";

const list = document.querySelector("[data-predictions]");
const status = document.querySelector("[data-predictor-status]");
const refreshButton = document.querySelector("[data-refresh-predictions]");

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

function teamBadge(teamName) {
  const meta = getTeamMeta(teamName);

  return `
    <span class="team-badge" style="--team-a:${meta.colors[0]};--team-b:${meta.colors[1]}">
      <span class="team-flag">${escapeHtml(meta.code)}</span>
      <span>${escapeHtml(teamName)}</span>
    </span>
  `;
}

function confidenceLabel(confidence) {
  const value = Number(confidence);

  if (value >= 70) return "Strong lean";
  if (value >= 56) return "Moderate lean";
  return "Thin edge";
}

async function fetchPredictions() {
  if (!config.supabaseUrl.includes("supabase.co")) return [];

  const url = new URL("/rest/v1/public_predictions", config.supabaseUrl);
  url.searchParams.set("select", "*");
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "30");

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

function renderPredictions(predictions) {
  if (!list) return;

  if (!predictions.length) {
    list.innerHTML = `<article class="empty-state">No predictions available yet.</article>`;
    return;
  }

  list.innerHTML = predictions.map((prediction) => {
    const confidence = Number(prediction.confidence || 0);
    const statusText = prediction.is_correct === true
      ? "Correct"
      : prediction.is_correct === false
        ? "Missed"
        : "Unscored";

    return `
      <article class="prediction-card advanced-card">
        <div class="matchup-row">
          ${teamBadge(prediction.home_team)}
          <span class="versus">vs</span>
          ${teamBadge(prediction.away_team)}
        </div>

        <header class="prediction-header">
          <div>
            <span class="card-kicker">AI pick</span>
            <h2>${escapeHtml(prediction.predicted_winner)}</h2>
          </div>
          <div class="confidence-orb" style="--confidence:${confidence}%">
            <strong>${escapeHtml(confidence)}%</strong>
            <span>${confidenceLabel(confidence)}</span>
          </div>
        </header>

        <div class="confidence-track" aria-label="Confidence">
          <span style="width:${Math.max(0, Math.min(100, confidence))}%"></span>
        </div>

        <p class="prediction-reason">${escapeHtml(prediction.reasoning)}</p>

        <div class="insight-grid">
          <div>
            <span>Market note</span>
            <strong>No live odds connected</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>${escapeHtml(prediction.result || "pending")}</strong>
          </div>
          <div>
            <span>Scoring</span>
            <strong>${escapeHtml(statusText)}</strong>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

async function loadPredictions() {
  try {
    setStatus("Refreshing");
    const predictions = await fetchPredictions();
    renderPredictions(predictions);
    setStatus(`Updated ${new Date().toLocaleTimeString()}`);
  } catch {
    setStatus("Data unavailable");
    renderPredictions([]);
  }
}

refreshButton?.addEventListener("click", loadPredictions);
loadPredictions();
window.setInterval(loadPredictions, config.pollingMs);