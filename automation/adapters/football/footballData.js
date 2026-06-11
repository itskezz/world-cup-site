// automation/adapters/football/footballData.js
import { requireEnv } from "../../lib/env.js";

const API_BASE_URL = "https://api.football-data.org/v4";

function mapStatus(status) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "IN_PLAY") return "live";
  if (normalized === "PAUSED") return "halftime";
  if (normalized === "FINISHED") return "finished";
  if (normalized === "POSTPONED") return "postponed";
  if (normalized === "CANCELLED") return "cancelled";

  return "scheduled";
}

function mapMatch(match) {
  return {
    id: String(match.id),
    home_team: match.homeTeam?.name || "TBD",
    away_team: match.awayTeam?.name || "TBD",
    kickoff_at: match.utcDate,
    status: mapStatus(match.status),
    home_score: match.score?.fullTime?.home ?? match.score?.regularTime?.home ?? null,
    away_score: match.score?.fullTime?.away ?? match.score?.regularTime?.away ?? null,
    minute: null,
    venue: match.venue || null,
    competition: match.competition?.name || "World Cup 2026",
    raw: match
  };
}

export async function fetchWorldCupMatches() {
  const token = requireEnv("FOOTBALL_DATA_API_KEY");
  const response = await fetch(`${API_BASE_URL}/competitions/WC/matches`, {
    headers: {
      "X-Auth-Token": token
    }
  });

  if (!response.ok) {
    throw new Error(`football-data.org request failed: ${response.status}`);
  }

  const payload = await response.json();
  return (payload.matches || []).map(mapMatch);
}

