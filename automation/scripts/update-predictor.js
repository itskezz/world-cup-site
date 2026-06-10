import { readFile } from "node:fs/promises";
import { createSupabaseAdminClient } from "../adapters/db/supabaseAdmin.js";
import { generatePredictionText } from "../adapters/ai/index.js";
import { parseJsonObject } from "../lib/safeJson.js";
import { logger } from "../lib/logger.js";
import { sendNtfy } from "../adapters/notify/ntfy.js";

const MODEL_NAME = process.env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct";

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function normalizeVolatility(value) {
  if (["Low", "Medium", "High"].includes(value)) return value;
  return "Medium";
}

function buildPrompt(template, match) {
  return template.replace("{{MATCH_JSON}}", JSON.stringify(match, null, 2));
}

function validatePrediction(prediction, match) {
  const allowed = new Set([match.home_team, match.away_team, "Draw"]);

  if (!allowed.has(prediction.predicted_winner)) {
    throw new Error(`Invalid predicted_winner: ${prediction.predicted_winner}`);
  }

  if (!prediction.reasoning || String(prediction.reasoning).length < 20) {
    throw new Error("Prediction reasoning is too short");
  }

  const distribution = prediction.probabilistic_distribution || {};
  const metadata = prediction.prediction_metadata || {};
  const gameState = prediction.expected_game_state || {};
  const mismatch = prediction.tactical_mismatch_exploit || {};
  const market = prediction.market_angle || {};

  return {
    match_id: match.id,
    predicted_winner: prediction.predicted_winner,
    confidence: clampNumber(prediction.confidence, 1, 100, 50),
    reasoning: String(prediction.reasoning).slice(0, 1000),
    result: "pending",
    is_correct: null,
    brier_score: null,
    model_name: MODEL_NAME,
    home_win_pct: clampNumber(distribution.home_win_pct, 0, 100, null),
    draw_pct: clampNumber(distribution.draw_pct, 0, 100, null),
    away_win_pct: clampNumber(distribution.away_win_pct, 0, 100, null),
    projected_score: String(metadata.projected_score || "").slice(0, 20),
    projected_total_goals: String(gameState.projected_total_goals || "").slice(0, 120),
    volatility_index: normalizeVolatility(metadata.volatility_index),
    first_half_dynamic: String(gameState.first_half_dynamic || "").slice(0, 400),
    tactical_target_zone: String(mismatch.target_zone || "").slice(0, 180),
    tactical_impact_rating: String(mismatch.impact_rating || "").slice(0, 40),
    market_angle: String(market.cautious_metric || "").slice(0, 500),
    model_notes: {
      simulated_outcome: String(metadata.simulated_outcome || "").slice(0, 400),
      metrics_note: "Advanced xG/PPDA fields are model-derived estimates unless an external stats provider is connected."
    }
  };
}

async function getUpcomingMatches(supabase) {
  const { data, error } = await supabase
    .from("matches")
    .select("id,home_team,away_team,kickoff_at,status,venue,competition,raw")
    .eq("status", "scheduled")
    .gte("kickoff_at", new Date().toISOString())
    .order("kickoff_at", { ascending: true })
    .limit(5);

  if (error) throw error;
  return data || [];
}

async function hasPrediction(supabase, matchId) {
  const { data, error } = await supabase
    .from("predictions")
    .select("id")
    .eq("match_id", matchId)
    .limit(1);

  if (error) throw error;
  return Boolean(data?.length);
}

async function main() {
  const supabase = createSupabaseAdminClient();
  const template = await readFile(new URL("../prompts/prediction.md", import.meta.url), "utf8");

  logger.info("predictor_update_started");

  const matches = await getUpcomingMatches(supabase);
  let created = 0;

  for (const match of matches) {
    if (await hasPrediction(supabase, match.id)) {
      logger.info("prediction_skipped_existing", { matchId: match.id });
      continue;
    }

    const prompt = buildPrompt(template, match);
    const text = await generatePredictionText(prompt);
    const parsed = parseJsonObject(text);
    const row = validatePrediction(parsed, match);

    const { error } = await supabase.from("predictions").insert(row);
    if (error) throw error;

    created += 1;
    logger.info("prediction_created", { matchId: match.id });
  }

  logger.info("predictor_update_success", { created });

  if (created > 0) {
    await sendNtfy(`Created ${created} advanced AI predictions.`, "Predictor Updated");
  }
}

main().catch(async (error) => {
  logger.error("predictor_update_failed", { error: error.message });
  await sendNtfy(`Predictor update failed: ${error.message}`, "World Cup Site Error");
  process.exitCode = 1;
});