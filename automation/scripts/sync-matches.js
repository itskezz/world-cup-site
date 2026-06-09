// automation/scripts/sync-matches.js
import { createSupabaseAdminClient } from "../adapters/db/supabaseAdmin.js";
import { fetchMatches } from "../adapters/football/index.js";
import { logger } from "../lib/logger.js";

async function main() {
  const supabase = createSupabaseAdminClient();

  logger.info("sync_matches_started");

  const matches = await fetchMatches();

  if (!matches.length) {
    logger.warn("sync_matches_no_matches");
    return;
  }

  const { error } = await supabase
    .from("matches")
    .upsert(matches, { onConflict: "id" });

  if (error) {
    throw error;
  }

  logger.info("sync_matches_success", { count: matches.length });
}

main().catch((error) => {
  logger.error("sync_matches_failed", { error: error.message });
  process.exitCode = 1;
});