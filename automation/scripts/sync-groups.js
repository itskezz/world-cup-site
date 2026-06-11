// automation/scripts/sync-groups.js
import { createSupabaseAdminClient } from "../adapters/db/supabaseAdmin.js";
import { fetchGroupStandings } from "../adapters/football/index.js";
import { logger } from "../lib/logger.js";
import { sendNtfy } from "../adapters/notify/ntfy.js";

async function syncGroupStandings() {
    logger.info("Starting group standings sync from football-data.org...");

    try {
        const supabase = createSupabaseAdminClient();

        // Fetch data using your internal adapter
        const apiData = await fetchGroupStandings();

        const formattedData = [];

        // Map the football-data.org response
        for (const groupData of apiData.standings) {
            if (groupData.type !== 'TOTAL') continue;

            const groupLetter = groupData.group ? groupData.group.replace(/GROUP[_\s]/i, '').trim() : '?';

            for (const row of groupData.table) {
                formattedData.push({
                    group_letter: groupLetter,
                    team_code: row.team.tla,
                    played: row.playedGames,
                    won: row.won,
                    drawn: row.draw,
                    lost: row.lost,
                    goals_for: row.goalsFor,
                    goals_against: row.goalsAgainst,
                    goal_difference: row.goalDifference,
                    points: row.points,
                    updated_at: new Date().toISOString()
                });
            }
        }

        logger.info(`Upserting ${formattedData.length} team records to Supabase...`);

        const { error } = await supabase
            .from('public_group_standings')
            .upsert(formattedData, {
                onConflict: 'group_letter, team_code'
            });

        if (error) throw error;

        logger.info("Group standings synced successfully!");

        // Send success notification to your phone/device
        await sendNtfy("✅ Group standings updated successfully.", "Group Sync");

    } catch (error) {
        logger.error(`Group sync failed: ${error.message}`);

        // Send failure alert
        await sendNtfy(`❌ Group sync failed: ${error.message}`, "Group Sync Error");

        process.exit(1);
    }
}

syncGroupStandings();