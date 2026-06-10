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

function volatilityText(value) {
  if (value === "Low") return "Stable tactical profile";
  if (value === "High") return "High-risk variance";
  return "Balanced volatility";
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

  if (!response.ok) throw new Error(`Supabase read failed: ${response.status}`);
  return response.json();
}

function renderProbabilityBar(prediction) {
  const home = Number(prediction.home_win_pct || 0);
  const draw = Number(prediction.draw_pct || 0);
  const away = Number(prediction.away_win_pct || 0);

  if (!home && !draw && !away) {
    return `<div class="empty-mini">Probability distribution pending.</div>`;
  }

  return `
    <div class="probability-bars">
      <div>
        <span>${escapeHtml(prediction.home_team)}</span>
        <strong>${home}%</strong>
        <i><b style="width:${home}%"></b></i>
      </div>
      <div>
        <span>Draw</span>
        <strong>${draw}%</strong>
        <i><b style="width:${draw}%"></b></i>
      </div>
      <div>
        <span>${escapeHtml(prediction.away_team)}</span>
        <strong>${away}%</strong>
        <i><b style="width:${away}%"></b></i>
      </div>
    </div>
  `;
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
      <article class="prediction-card advanced-card prediction-pro-card">
        <div class="matchup-row">
          ${teamBadge(prediction.home_team)}
          <span class="versus">vs</span>
          ${teamBadge(prediction.away_team)}
        </div>

        <header class="prediction-header">
          <div>
            <span class="card-kicker">AI prediction</span>
            <h2>${escapeHtml(prediction.predicted_winner)}</h2>
            <p class="prediction-subtitle">${escapeHtml(prediction.projected_score || "Projected score pending")}</p>
          </div>
          <div class="confidence-orb" style="--confidence:${confidence}%">
            <strong>${escapeHtml(confidence)}%</strong>
            <span>${confidenceLabel(confidence)}</span>
          </div>
        </header>

        <div class="volatility-banner ${escapeHtml(String(prediction.volatility_index || "Medium").toLowerCase())}">
          <strong>${escapeHtml(prediction.volatility_index || "Medium")} volatility</strong>
          <span>${escapeHtml(volatilityText(prediction.volatility_index))}</span>
        </div>

        ${renderProbabilityBar(prediction)}

        <p class="prediction-reason">${escapeHtml(prediction.reasoning)}</p>

        <div class="prediction-detail-panel">
          <div>
            <span>First-half dynamic</span>
            <p>${escapeHtml(prediction.first_half_dynamic || "Pending tactical read.")}</p>
          </div>
          <div>
            <span>Total goals</span>
            <p>${escapeHtml(prediction.projected_total_goals || "Pending projection.")}</p>
          </div>
          <div>
            <span>Tactical target</span>
            <p>${escapeHtml(prediction.tactical_target_zone || "Pending matchup zone.")}</p>
          </div>
          <div>
            <span>Impact rating</span>
            <p>${escapeHtml(prediction.tactical_impact_rating || "N/A")}</p>
          </div>
        </div>

        <aside class="market-note">
          <strong>Market angle</strong>
          <p>${escapeHtml(prediction.market_angle || "No betting market angle connected. Treat this as informational analysis, not advice.")}</p>
        </aside>

        <div class="insight-grid">
          <div><span>Status</span><strong>${escapeHtml(prediction.result || "pending")}</strong></div>
          <div><span>Scoring</span><strong>${escapeHtml(statusText)}</strong></div>
          <div><span>Model</span><strong>AI matrix</strong></div>
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