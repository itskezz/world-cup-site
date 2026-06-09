// site/assets/js/predictor.js
import { config } from "./config.js";

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

  list.innerHTML = predictions.map((prediction) => `
    <article class="prediction-card">
      <header>
        <h2>${escapeHtml(prediction.predicted_winner)}</h2>
        <strong>${escapeHtml(prediction.confidence)}%</strong>
      </header>
      <p>${escapeHtml(prediction.reasoning)}</p>
      <div class="meta-row">
        <span>${escapeHtml(prediction.result || "Pending")}</span>
        <span>${prediction.is_correct === true ? "Correct" : prediction.is_correct === false ? "Missed" : "Unscored"}</span>
      </div>
    </article>
  `).join("");
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