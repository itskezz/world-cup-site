import { config } from "./config.js";
import { getTeamMeta } from "./teamMeta.js";

/* ─── DOM refs ─────────────────────────────────────────────────────────────── */
const list            = document.querySelector("[data-predictions]");
const status          = document.querySelector("[data-predictor-status]");
const refreshButton   = document.querySelector("[data-refresh-predictions]");

/* ─── Playground refs ──────────────────────────────────────────────────────── */
const inputs = {
  homeAttack:   document.querySelector('[data-model-input="homeAttack"]'),
  homeDefense:  document.querySelector('[data-model-input="homeDefense"]'),
  awayAttack:   document.querySelector('[data-model-input="awayAttack"]'),
  awayDefense:  document.querySelector('[data-model-input="awayDefense"]')
};
const outputs = {
  homeAttack:   document.querySelector('[data-model-output="homeAttack"]'),
  homeDefense:  document.querySelector('[data-model-output="homeDefense"]'),
  awayAttack:   document.querySelector('[data-model-output="awayAttack"]'),
  awayDefense:  document.querySelector('[data-model-output="awayDefense"]')
};
const scoreTarget      = document.querySelector("[data-playground-score]");
const confidenceTarget = document.querySelector("[data-playground-confidence]");
const volatilityLabel  = document.querySelector("[data-playground-volatility-label]");
const jsonPreview      = document.querySelector("[data-json-preview]");
const probTargets = {
  home:    document.querySelector("[data-prob-home]"),
  draw:    document.querySelector("[data-prob-draw]"),
  away:    document.querySelector("[data-prob-away]"),
  homeBar: document.querySelector("[data-prob-home-bar]"),
  drawBar: document.querySelector("[data-prob-draw-bar]"),
  awayBar: document.querySelector("[data-prob-away-bar]")
};

let volatility = "Medium";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
function setStatus(message) {
  if (status) status.textContent = message;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]
  );
}

function teamChip(teamName) {
  const meta = getTeamMeta(teamName);
  return `
    <span class="team-chip" style="--team-a:${meta.colors[0]};--team-b:${meta.colors[1]}">
      <span class="team-chip-flag">${escapeHtml(meta.code)}</span>
      <span class="team-chip-name">${escapeHtml(teamName)}</span>
    </span>`;
}

function confidenceLabel(confidence) {
  const v = Number(confidence);
  if (v >= 70) return "Strong lean";
  if (v >= 56) return "Moderate lean";
  return "Thin edge";
}

function normalizeProbability(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : fallback;
}

function getFallbackDistribution(prediction) {
  const c = normalizeProbability(prediction.confidence, 50);
  if (prediction.predicted_winner === prediction.home_team) {
    const d = Math.max(12, Math.round((100 - c) * 0.45));
    return { home: c, draw: d, away: 100 - c - d };
  }
  if (prediction.predicted_winner === prediction.away_team) {
    const d = Math.max(12, Math.round((100 - c) * 0.45));
    return { away: c, draw: d, home: 100 - c - d };
  }
  const side = Math.round((100 - c) / 2);
  return { home: side, draw: c, away: 100 - c - side };
}

function getDistribution(prediction) {
  const fallback = getFallbackDistribution(prediction);
  return {
    home: normalizeProbability(prediction.home_win_pct,  fallback.home),
    draw: normalizeProbability(prediction.draw_pct,      fallback.draw),
    away: normalizeProbability(prediction.away_win_pct,  fallback.away)
  };
}

function getVolatility(prediction) {
  return prediction.volatility_index || "Medium";
}

function volatilityText(value) {
  if (value === "Low")  return "Stable tactical profile";
  if (value === "High") return "High-risk tactical variance";
  return "Balanced match variance";
}

/* ─── Card renderer ────────────────────────────────────────────────────────── */
function renderCard(prediction) {
  const confidence = normalizeProbability(prediction.confidence, 50);
  const vol        = getVolatility(prediction);
  const dist       = getDistribution(prediction);
  const statusText = prediction.is_correct === true
    ? "Correct"
    : prediction.is_correct === false
      ? "Missed"
      : "Unscored";

  return `
    <article class="predictor-pro-card">

      <!-- HEAD -->
      <header class="predictor-card-head">
        <div class="predictor-matchup">
          ${teamChip(prediction.home_team)}
          <span class="predictor-vs">vs</span>
          ${teamChip(prediction.away_team)}
        </div>
        <div class="predictor-scoreline">
          <div>
            <span>Projected Score</span>
            <strong>${escapeHtml(prediction.projected_score || "Pending")}</strong>
          </div>
          <div>
            <span>Volatility</span>
            <strong>${escapeHtml(vol)}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>${escapeHtml(prediction.result || "Pending")}</strong>
          </div>
        </div>
      </header>

      <!-- PICK ROW -->
      <section class="predictor-pick-row">
        <div>
          <span class="card-kicker">AI pick</span>
          <h2>${escapeHtml(prediction.predicted_winner)}</h2>
          <p>${escapeHtml(prediction.reasoning)}</p>
        </div>
        <div class="confidence-orb predictor-orb" style="--confidence:${confidence}%">
          <strong>${confidence}%</strong>
          <span>${confidenceLabel(confidence)}</span>
        </div>
      </section>

      <!-- MATRIX: probability bars + volatility banner -->
      <section class="predictor-matrix">
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
        <div class="volatility-banner ${escapeHtml(vol.toLowerCase())}">
          <strong>${escapeHtml(vol)} Volatility</strong>
          <span>${escapeHtml(volatilityText(vol))}</span>
        </div>
      </section>

      <!-- INSIGHTS -->
      <section class="predictor-insights">
        <div>
          <span>First-half dynamic</span>
          <p>${escapeHtml(prediction.first_half_dynamic    || "Model read pending.")}</p>
        </div>
        <div>
          <span>Total goals profile</span>
          <p>${escapeHtml(prediction.projected_total_goals || "No projection stored yet.")}</p>
        </div>
        <div>
          <span>Tactical target</span>
          <p>${escapeHtml(prediction.tactical_target_zone  || "No tactical mismatch stored yet.")}</p>
        </div>
        <div>
          <span>Impact rating</span>
          <p>${escapeHtml(prediction.tactical_impact_rating || "N/A")}</p>
        </div>
      </section>

      <!-- MARKET -->
      <aside class="predictor-market">
        <div>
          <strong>Market angle</strong>
          <p>${escapeHtml(prediction.market_angle || "No live odds connected. Informational output only — not financial or betting advice.")}</p>
        </div>
        <div class="predictor-status-box">
          <span>Outcome</span>
          <strong>${escapeHtml(statusText)}</strong>
        </div>
      </aside>

    </article>`;
}

/* ─── List renderer ────────────────────────────────────────────────────────── */
function renderPredictions(predictions) {
  if (!list) return;

  if (!predictions.length) {
    list.innerHTML = `<article class="empty-state"><p>No predictions available yet.</p></article>`;
    return;
  }

  list.innerHTML = predictions.map(renderCard).join("");
}

/* ─── Supabase fetch ───────────────────────────────────────────────────────── */
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

/* ─── Load ─────────────────────────────────────────────────────────────────── */
async function loadPredictions() {
  try {
    setStatus("Refreshing…");
    const predictions = await fetchPredictions();
    renderPredictions(predictions);
    setStatus(`Updated ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    console.error(err);
    setStatus("Data unavailable");
    renderPredictions([]);
  }
}

refreshButton?.addEventListener("click", loadPredictions);
loadPredictions();
window.setInterval(loadPredictions, config.pollingMs);

/* ═══════════════════════════════════════════════════════════════════════════
   PLAYGROUND
   ═════════════════════════════════════════════════════════════════════════ */
function getValue(key) {
  return Number(inputs[key]?.value || 50);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function poissonGoals(attack, opposingDefense) {
  const attackFactor  = attack / 50;
  const defenseFactor = (101 - opposingDefense) / 50;
  return clamp(1.25 * attackFactor * defenseFactor, 0.2, 4.2);
}

function volatilityMultiplier() {
  if (volatility === "Low")  return 0.84;
  if (volatility === "High") return 1.24;
  return 1;
}

function normalizeProbabilities(homeLambda, awayLambda) {
  const strengthDelta = homeLambda - awayLambda;
  const vol = volatilityMultiplier();
  let home = 42 + strengthDelta * 15;
  let away = 42 - strengthDelta * 15;
  let draw = 24 - Math.abs(strengthDelta) * 3;
  draw = clamp(draw / vol, 14, 34);
  home = clamp(home, 8, 78);
  away = clamp(away, 8, 78);
  const total = home + draw + away;
  home  = Math.round((home / total) * 100);
  draw  = Math.round((draw / total) * 100);
  away  = 100 - home - draw;
  return { home, draw, away };
}

function projectedScore(homeLambda, awayLambda) {
  return {
    home: clamp(Math.round(homeLambda), 0, 6),
    away: clamp(Math.round(awayLambda), 0, 6)
  };
}

function confidenceFromProbabilities(probabilities) {
  const top        = Math.max(probabilities.home, probabilities.draw, probabilities.away);
  const volPenalty = volatility === "High" ? 8 : volatility === "Low" ? -4 : 0;
  return clamp(Math.round(top - 12 - volPenalty), 18, 86);
}

function winnerFromProbabilities(probabilities) {
  if (probabilities.home >= probabilities.draw && probabilities.home >= probabilities.away) return "Home Team";
  if (probabilities.away >= probabilities.home && probabilities.away >= probabilities.draw) return "Away Team";
  return "Draw";
}

function updateBars(probabilities) {
  probTargets.home.textContent    = `${probabilities.home}%`;
  probTargets.draw.textContent    = `${probabilities.draw}%`;
  probTargets.away.textContent    = `${probabilities.away}%`;
  probTargets.homeBar.style.width = `${probabilities.home}%`;
  probTargets.drawBar.style.width = `${probabilities.draw}%`;
  probTargets.awayBar.style.width = `${probabilities.away}%`;
}

function buildJson(score, probabilities, confidence) {
  return {
    predicted_winner: winnerFromProbabilities(probabilities),
    confidence,
    reasoning: "The model leans toward the side with the stronger attack-to-defense profile, adjusted by volatility and draw risk.",
    probabilistic_distribution: {
      home_win_pct: probabilities.home,
      draw_pct:     probabilities.draw,
      away_win_pct: probabilities.away
    },
    prediction_metadata: {
      volatility_index:  volatility,
      projected_score:   `${score.home}-${score.away}`,
      simulated_outcome: "Playground estimate based on attack, defense, and volatility sliders."
    },
    expected_game_state: {
      first_half_dynamic:     volatility === "High"
        ? "Open early phases with higher transition risk."
        : "Controlled opening phase with gradual pressure building.",
      projected_total_goals:  score.home + score.away >= 3
        ? "Over 2.5 goals profile"
        : "Under 2.5 goals profile"
    },
    tactical_mismatch_exploit: {
      target_zone:   "Stronger attack channel against weaker defensive side",
      impact_rating: `${clamp(Math.round(Math.abs(getValue("homeAttack") - getValue("awayDefense")) / 10 + 5), 1, 10)}/10`
    },
    market_angle: {
      cautious_metric: "Informational model output only. Not financial or betting advice."
    }
  };
}

function renderPlayground() {
  for (const key of Object.keys(inputs)) {
    if (outputs[key]) outputs[key].textContent = inputs[key].value;
  }

  const homeLambda   = poissonGoals(getValue("homeAttack"),  getValue("awayDefense"));
  const awayLambda   = poissonGoals(getValue("awayAttack"),  getValue("homeDefense"));
  const score        = projectedScore(homeLambda, awayLambda);
  const probabilities = normalizeProbabilities(homeLambda, awayLambda);
  const confidence   = confidenceFromProbabilities(probabilities);
  const json         = buildJson(score, probabilities, confidence);

  if (scoreTarget)      scoreTarget.textContent      = `${score.home} - ${score.away}`;
  if (confidenceTarget) confidenceTarget.textContent = `${confidence}%`;
  if (volatilityLabel)  volatilityLabel.textContent  = volatility;

  updateBars(probabilities);
  if (jsonPreview) jsonPreview.textContent = JSON.stringify(json, null, 2);
}

for (const input of Object.values(inputs)) {
  input?.addEventListener("input", renderPlayground);
}

document.querySelectorAll("[data-volatility]").forEach((button) => {
  button.addEventListener("click", () => {
    volatility = button.dataset.volatility;
    document.querySelectorAll("[data-volatility]").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    renderPlayground();
  });
});

renderPlayground();