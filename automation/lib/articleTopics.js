export function buildArticleTopics(match) {
  const base = `${match.home_team} vs ${match.away_team}`;

  return [
    {
      type: "prediction",
      primaryKeyword: `${base} prediction`,
      slugSuffix: "prediction",
      searchIntent: "User wants a clear pre-match prediction, score lean, confidence level, and matchup risks.",
      requiredSections: [
        "Quick prediction",
        "Match context",
        `Why ${match.home_team} can win`,
        `Why ${match.away_team} can win`,
        "Key matchup",
        "Score prediction",
        "What could change the pick"
      ]
    },
    {
      type: "live-updates",
      primaryKeyword: `${base} live score updates`,
      slugSuffix: "live-score-updates",
      searchIntent: "User wants live score context, kickoff time, match status, and where to follow updates.",
      requiredSections: [
        "Live score hub",
        "Kickoff time",
        "Match status explained",
        "Where the game can swing",
        "What to watch live",
        "Post-match update plan"
      ]
    },
    {
      type: "schedule",
      primaryKeyword: `${base} schedule kickoff time`,
      slugSuffix: "schedule-kickoff-time",
      searchIntent: "User wants fixture timing, venue, date, and schedule context.",
      requiredSections: [
        "Match schedule",
        "Kickoff time",
        "Venue information",
        "Group or tournament context",
        "Why this fixture matters",
        "How to follow updates"
      ]
    },
    {
      type: "how-to-watch",
      primaryKeyword: `how to watch ${base}`,
      slugSuffix: "how-to-watch",
      searchIntent: "User wants TV, streaming, and live online viewing guidance without fake broadcaster claims.",
      requiredSections: [
        "How to watch",
        "Streaming note",
        "TV coverage note",
        "Geo restrictions",
        "Live score alternatives",
        "Match preview"
      ]
    },
    {
      type: "team-news",
      primaryKeyword: `${base} team news`,
      slugSuffix: "team-news",
      searchIntent: "User wants squad context and team news without invented injuries or lineups.",
      requiredSections: [
        "Team news overview",
        "Squad context",
        "Selection questions",
        "Tactical setup",
        "What to check before kickoff",
        "Prediction impact"
      ]
    },
    {
      type: "highlights",
      primaryKeyword: `${base} highlights`,
      slugSuffix: "highlights",
      searchIntent: "User wants match highlights, recap context, key moments, and post-match summary.",
      requiredSections: [
        "Highlights hub",
        "Key moments to watch",
        "First-half story",
        "Second-half story",
        "Player impact",
        "Post-match recap note"
      ]
    },
    {
      type: "stadiums",
      primaryKeyword: `${base} stadium venue`,
      slugSuffix: "stadium-venue",
      searchIntent: "User wants stadium, city, venue context, and matchday information.",
      requiredSections: [
        "Stadium and venue",
        "Host city context",
        "Matchday atmosphere",
        "Travel note",
        "Fixture importance",
        "Fan guide"
      ]
    },
    {
      type: "betting-tips",
      primaryKeyword: `${base} odds and betting tips`,
      slugSuffix: "odds-betting-tips",
      searchIntent: "User wants cautious betting angles, odds context, risks, and responsible gambling information.",
      requiredSections: [
        "Odds angle",
        "Market considerations",
        "Risk factors",
        "What could change before kickoff",
        "Prediction lean",
        "Responsible gambling note"
      ]
    }
  ];
}

export function buildEvergreenTopics() {
  return [
    {
      type: "schedule",
      primaryKeyword: "World Cup 2026 schedule",
      slugSuffix: "world-cup-2026-schedule",
      searchIntent: "User wants fixtures, dates, kickoff times, and tournament schedule structure.",
      titleSeed: "World Cup 2026 Schedule Guide",
      requiredSections: [
        "World Cup 2026 schedule overview",
        "Key dates",
        "How fixtures are organized",
        "Kickoff time tips",
        "How to track live changes",
        "Schedule FAQ"
      ]
    },
    {
      type: "tickets",
      primaryKeyword: "World Cup 2026 tickets",
      slugSuffix: "world-cup-2026-tickets",
      searchIntent: "User wants ticket availability, official buying guidance, pricing caution, and scam avoidance.",
      titleSeed: "World Cup 2026 Tickets Guide",
      requiredSections: [
        "Ticket overview",
        "Official ticket sources",
        "Availability reminders",
        "Scam warning signs",
        "Travel planning",
        "Ticket FAQ"
      ]
    },
    {
      type: "stadiums",
      primaryKeyword: "World Cup 2026 stadium locations",
      slugSuffix: "world-cup-2026-stadium-locations",
      searchIntent: "User wants host cities, stadium locations, travel context, and venue guide.",
      titleSeed: "World Cup 2026 Stadium Locations",
      requiredSections: [
        "Host stadium overview",
        "Host city context",
        "Travel planning",
        "Matchday logistics",
        "Venue experience",
        "Stadium FAQ"
      ]
    },
    {
      type: "how-to-watch",
      primaryKeyword: "how to watch World Cup 2026 live online",
      slugSuffix: "how-to-watch-world-cup-2026-live-online",
      searchIntent: "User wants streaming, TV, live online, and geo-restriction guidance.",
      titleSeed: "How to Watch World Cup 2026 Live Online",
      requiredSections: [
        "How to watch live",
        "TV and streaming note",
        "Geo restrictions",
        "Live score alternatives",
        "Highlights and replays",
        "Viewing FAQ"
      ]
    },
    {
      type: "live-updates",
      primaryKeyword: "World Cup live scores",
      slugSuffix: "world-cup-live-scores",
      searchIntent: "User wants live scores, real-time results, match status, and update frequency.",
      titleSeed: "World Cup Live Scores and Updates",
      requiredSections: [
        "Live score overview",
        "How live updates work",
        "Match status explained",
        "Fixtures to watch",
        "Results and recaps",
        "Live scores FAQ"
      ]
    },
    {
      type: "travel",
      primaryKeyword: "World Cup 2026 travel packages hotels near stadiums",
      slugSuffix: "world-cup-2026-travel-hotels-stadiums",
      searchIntent: "User wants travel planning, hotels, stadium access, and package caution.",
      titleSeed: "World Cup 2026 Travel and Hotels Guide",
      requiredSections: [
        "Travel planning overview",
        "Hotels near stadiums",
        "Transport planning",
        "Package cautions",
        "Budget tips",
        "Travel FAQ"
      ]
    }
  ];
}