// automation/scripts/sync-matches.js
import { createSupabaseAdminClient } from "../adapters/db/supabaseAdmin.js";
import { fetchMatches } from "../adapters/football/index.js";
import { logger } from "../lib/logger.js";
import { sendNtfy } from "../adapters/notify/ntfy.js";

async function main() {
  const supabase = createSupabaseAdminClient();

  logger.info("sync_matches_started");

  const matches = await fetchMatches();

  if (!matches.length) {
    logger.warn("sync_matches_no_matches");
    await sendNtfy("Match sync ran, but no matches were returned.", "Match Sync Warning");
    return;
  }

  const { error } = await supabase
    .from("matches")
    .upsert(matches, { onConflict: "id" });

  if (error) {
    throw error;
  }

  const liveCount = matches.filter((match) => match.status === "live" || match.status === "halftime").length;

  logger.info("sync_matches_success", {
    count: matches.length,
    liveCount
  });

  if (liveCount > 0) {
    await sendNtfy(`Synced ${matches.length} matches. ${liveCount} live now.`, "Live Match Sync");
  }
}

main().catch(async (error) => {
  logger.error("sync_matches_failed", { error: error.message });
  await sendNtfy(`Match sync failed: ${error.message}`, "World Cup Site Error");
  process.exitCode = 1;
});