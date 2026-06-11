// automation/syncGroups.js
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncGroupStandings() {
  console.log('Fetching group standings from football-data.org...');

  try {
    // 2000 is the ID for the FIFA World Cup in football-data.org
    // Adjust if you are targeting a different competition ID
    const apiResponse = await fetch('https://api.football-data.org/v4/competitions/2000/standings', {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY }
    });
    
    if (!apiResponse.ok) throw new Error(`API returned ${apiResponse.status}`);
    const apiData = await apiResponse.json();

    const formattedData = [];

    // Loop through the groups provided by the API
    for (const groupData of apiData.standings) {
      // The API sometimes returns HOME/AWAY splits, we only want the TOTAL standings
      if (groupData.type !== 'TOTAL') continue; 

      const groupLetter = groupData.group.replace('GROUP_', ''); // "GROUP_A" -> "A"

      // Loop through the teams within this specific group
      for (const row of groupData.table) {
        formattedData.push({
          group_letter: groupLetter,
          team_code: row.team.tla,         // 3-letter code (e.g., GER)
          played: row.playedGames,
          won: row.won,
          drawn: row.draw,                 // Note: API uses 'draw', we use 'drawn'
          lost: row.lost,
          goals_for: row.goalsFor,
          goals_against: row.goalsAgainst,
          goal_difference: row.goalDifference,
          points: row.points,
          updated_at: new Date().toISOString()
        });
      }
    }

    console.log(`Upserting ${formattedData.length} team records to Supabase...`);
    
    const { error } = await supabase
      .from('public_group_standings')
      .upsert(formattedData, { 
        onConflict: 'group_letter, team_code' 
      });

    if (error) throw error;

    console.log('✅ Group standings synced successfully!');

  } catch (error) {
    console.error('❌ Error syncing group standings:', error.message);
    process.exit(1);
  }
}

syncGroupStandings();