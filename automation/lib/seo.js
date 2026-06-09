// automation/lib/seo.js
export function buildSeoTitle(match) {
  return `${match.home_team} vs ${match.away_team} Prediction`;
}

export function buildSeoDescription(match) {
  return `AI-powered ${match.home_team} vs ${match.away_team} match preview with prediction, key factors, and tournament context.`;
}