// automation/lib/articleTopics.js
export function buildArticleTopics(match) {
  const base = `${match.home_team} vs ${match.away_team}`;

  return [
    {
      type: "prediction",
      primaryKeyword: `${base} prediction`,
      slugSuffix: "prediction",
      searchIntent: "User wants a clear pre-match pick, confidence level, likely match script, and score prediction.",
      requiredSections: [
        "Quick prediction",
        `Why ${match.home_team} can win`,
        `Why ${match.away_team} can win`,
        "Key matchup",
        "Score prediction",
        "Responsible betting note"
      ]
    },
    {
      type: "betting-tips",
      primaryKeyword: `${base} betting tips`,
      slugSuffix: "betting-tips",
      searchIntent: "User wants cautious betting angles, risk factors, and what to watch before placing any bet.",
      requiredSections: [
        "Best angle to watch",
        "Safer market considerations",
        "Risk factors",
        "What could change before kickoff",
        "Responsible betting note"
      ]
    },
    {
      type: "upset-watch",
      primaryKeyword: `${match.away_team} upset chances vs ${match.home_team}`,
      slugSuffix: "upset-watch",
      searchIntent: "User wants to know whether the underdog has a realistic upset path.",
      requiredSections: [
        "Upset chance summary",
        "Underdog path to victory",
        "Favorite warning signs",
        "Game state that changes everything",
        "Prediction"
      ]
    },
    {
      type: "group-impact",
      primaryKeyword: `${base} group standings impact`,
      slugSuffix: "group-standings-impact",
      searchIntent: "User wants to understand how the result could affect qualification and group standings.",
      requiredSections: [
        "Why this match matters",
        "What a home-team win changes",
        "What an away-team win changes",
        "What a draw changes",
        "Qualification picture"
      ]
    }
  ];
}