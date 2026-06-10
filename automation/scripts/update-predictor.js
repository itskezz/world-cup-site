// automation/scripts/update-predictor.js
import { readFile } from "node:fs/promises";
import { createSupabaseAdminClient } from "../adapters/db/supabaseAdmin.js";
import { generatePredictionText } from "../adapters/ai/index.js";
import { parseJsonObject } from "../lib/safeJson.js";
import { logger } from "../lib/logger.js";
import { sendNtfy } from "../adapters/notify/ntfy.js";

const MODEL_NAME = process.env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct";

function clampConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 50;
  return Math.max(1, Math.min(100, number));
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

  return {
    match_id: match.id,
    predicted_winner: prediction.predicted_winner,
    confidence: clampConfidence(prediction.confidence),
    reasoning: String(prediction.reasoning).slice(0, 800),
    result: "pending",
    is_correct: null,
    brier_score: null,
    model_name: MODEL_NAME
  };
}

async function getUpcomingMatches(supabase) {
  const { data, error } = await supabase
    .from("matches")
    .select("id,home_team,away_team,kickoff_at,status,venue,competition")
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
    await sendNtfy(`Created ${created} new AI predictions.`, "Predictor Updated");
  }
}

main().catch(async (error) => {
  logger.error("predictor_update_failed", { error: error.message });
  await sendNtfy(`Predictor update failed: ${error.message}`, "World Cup Site Error");
  process.exitCode = 1;
});