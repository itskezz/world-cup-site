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
    <span class="team-chip" style="--team-a:${meta.colors[0]};--team-b:${meta.colors[1]}">
      <span class="team-chip-flag">${escapeHtml(meta.code)}</span>
      <span class="team-chip-name">${escapeHtml(teamName)}</span>
    </span>
  `;
}

function confidenceLabel(confidence) {
  const value = Number(confidence);
  if (value >= 70) return "Strong lean";
  if (value >= 56) return "Moderate lean";
  return "Thin edge";
}

function normalizeProbability(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : fallback;
}

function getFallbackDistribution(prediction) {
  const confidence = normalizeProbability(prediction.confidence, 50);

  if (prediction.predicted_winner === prediction.home_team) {
    return { home: confidence, draw: Math.max(12, Math.round((100 - confidence) * 0.45)), away: 100 - confidence - Math.max(12, Math.round((100 - confidence) * 0.45)) };
  }

  if (prediction.predicted_winner === prediction.away_team) {
    return { away: confidence, draw: Math.max(12, Math.round((100 - confidence) * 0.45)), home: 100 - confidence - Math.max(12, Math.round((100 - confidence) * 0.45)) };
  }

  const side = Math.round((100 - confidence) / 2);
  return { home: side, draw: confidence, away: 100 - confidence - side };
}

function getDistribution(prediction) {
  const fallback = getFallbackDistribution(prediction);

  return {
    home: normalizeProbability(prediction.home_win_pct, fallback.home),
    draw: normalizeProbability(prediction.draw_pct, fallback.draw),
    away: normalizeProbability(prediction.away_win_pct, fallback.away)
  };
}

function getVolatility(prediction) {
  return prediction.volatility_index || "Medium";
}

function volatilityText(value) {
  if (value === "Low") return "Stable tactical profile";
  if (value === "High") return "High-risk tactical variance";
  return "Balanced match variance";
}

function renderProbabilityBars(prediction) {
  const dist = getDistribution(prediction);

  return `
    <div class="predictor-bars">
      <div class="predictor-bar-row">
        <span>${escapeHtml(prediction.home_team)}</span>
        <strong>${dist.home}%</strong>
        <i><b style="width:${dist.home}%"></b></i>
      </div>
      <div class="predictor-bar-row draw-row">
        <span>Draw</span>
        <strong>${dist.draw}%</strong>
        <i><b style="width:${dist.draw}%"></b></i>
      </div>
      <div class="predictor-bar-row">
        <span>${escapeHtml(prediction.away_team)}</span>
        <strong>${dist.away}%</strong>
        <i><b style="width:${dist.away}%"></b></i>
      </div>
    </div>
  `;
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

function renderPredictions(predictions) {
  if (!list) return;

  if (!predictions.length) {
    list.innerHTML = `<article class="empty-state">No predictions available yet.</article>`;
    return;
  }

  list.innerHTML = predictions.map((prediction) => {
    const confidence = normalizeProbability(prediction.confidence, 50);
    const volatility = getVolatility(prediction);
    const statusText = prediction.is_correct === true
      ? "Correct"
      : prediction.is_correct === false
        ? "Missed"
        : "Unscored";

    return `<article class="predictor-pro-card">

  <!-- HEAD: matchup + scoreline -->
  <div class="predictor-card-head">
    <div class="predictor-matchup">
      <span class="team-chip" style="--team-a:#8a1538;--team-b:#ffffff">
        <span class="team-chip-flag">QA</span>
        <span class="team-chip-name">Qatar</span>
      </span>
      <span class="predictor-vs">vs</span>
      <span class="team-chip" style="--team-a:#e30613;--team-b:#ffffff">
        <span class="team-chip-flag">CH</span>
        <span class="team-chip-name">Switzerland</span>
      </span>
    </div>
    <div class="predictor-scoreline">
      <div>
        <span>Projected Score</span>
        <strong>2 – 1</strong>
      </div>
      <div>
        <span>Group</span>
        <strong>A</strong>
      </div>
      <div>
        <span>Venue</span>
        <strong>Lusail</strong>
      </div>
    </div>
  </div>

  <!-- PICK ROW: AI pick + confidence orb -->
  <div class="predictor-pick-row">
    <div>
      <span class="card-kicker">AI pick</span>
      <h2>Qatar</h2>
      <p>Qatar holds home advantage. Switzerland has not played a competitive match in over a year, which may impact sharpness.</p>
    </div>
    <div class="confidence-orb predictor-orb" style="--confidence:60%">
      <strong>60%</strong>
      <span>Moderate lean</span>
    </div>
  </div>

  <!-- MATRIX: probability bars + JSON -->
  <div class="predictor-matrix">
    <div class="predictor-bars">
      <div class="predictor-bar-row">
        <span>Home win</span>
        <strong>49%</strong>
        <i><b style="width:49%"></b></i>
      </div>
      <div class="predictor-bar-row draw-row">
        <span>Draw</span>
        <strong>21%</strong>
        <i><b style="width:21%"></b></i>
      </div>
      <div class="predictor-bar-row">
        <span>Away win</span>
        <strong>30%</strong>
        <i><b style="width:30%"></b></i>
      </div>
    </div>
    <pre class="json-preview">{
  "predicted_winner": "Qatar",
  "confidence": 60,
  "volatility_index": "Medium",
  "projected_score": "2-1"
}</pre>
  </div>

  <!-- INSIGHTS: 2-col detail grid -->
  <div class="predictor-insights">
    <div>
      <span>Tactical edge</span>
      <p>Home crowd pressure + high press likely to unsettle Switzerland's build-up play.</p>
    </div>
    <div>
      <span>Risk factor</span>
      <p>Switzerland's set-piece delivery could exploit Qatar's aerial weakness.</p>
    </div>
  </div>

  <!-- MARKET: status + note -->
  <div class="predictor-market">
    <div>
      <strong>Market note</strong>
      <p>No live odds connected. Informational model output only — not financial or betting advice.</p>
    </div>
    <div class="predictor-status-box">
      <span>Status</span>
      <strong>Pending</strong>
    </div>
  </div>

</article>`;
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