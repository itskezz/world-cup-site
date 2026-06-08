// automation/adapters/football/index.js
import { fetchWorldCupMatches } from "./footballData.js";

export async function fetchMatches() {
  return fetchWorldCupMatches();
}