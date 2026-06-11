// automation/adapters/football/index.js
import { fetchWorldCupMatches } from "./footballData.js";

export async function fetchMatches() {
  return fetchWorldCupMatches();
}


export async function fetchGroupStandings() {
  // Assuming 2000 is the World Cup competition ID. 
  const url = 'https://api.football-data.org/v4/competitions/2000/standings';
  
  const response = await fetch(url, {
    headers: {
      'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`Football API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}