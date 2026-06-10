const inputs = {
  homeAttack: document.querySelector('[data-model-input="homeAttack"]'),
  homeDefense: document.querySelector('[data-model-input="homeDefense"]'),
  awayAttack: document.querySelector('[data-model-input="awayAttack"]'),
  awayDefense: document.querySelector('[data-model-input="awayDefense"]')
};

const outputs = {
  homeAttack: document.querySelector('[data-model-output="homeAttack"]'),
  homeDefense: document.querySelector('[data-model-output="homeDefense"]'),
  awayAttack: document.querySelector('[data-model-output="awayAttack"]'),
  awayDefense: document.querySelector('[data-model-output="awayDefense"]')
};

const scoreTarget = document.querySelector("[data-playground-score]");
const confidenceTarget = document.querySelector("[data-playground-confidence]");
const volatilityLabel = document.querySelector("[data-playground-volatility-label]");
const jsonPreview = document.querySelector("[data-json-preview]");

const probTargets = {
  home: document.querySelector("[data-prob-home]"),
  draw: document.querySelector("[data-prob-draw]"),
  away: document.querySelector("[data-prob-away]"),
  homeBar: document.querySelector("[data-prob-home-bar]"),
  drawBar: document.querySelector("[data-prob-draw-bar]"),
  awayBar: document.querySelector("[data-prob-away-bar]")
};

let volatility = "Medium";

function getValue(key) {
  return Number(inputs[key]?.value || 50);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function poissonGoals(attack, opposingDefense) {
  const attackFactor = attack / 50;
  const defenseFactor = (101 - opposingDefense) / 50;
  return clamp(1.25 * attackFactor * defenseFactor, 0.2, 4.2);
}

function volatilityMultiplier() {
  if (volatility === "Low") return 0.84;
  if (volatility === "High") return 1.24;
  return 1;
}

function normalizeProbabilities(homeLambda, awayLambda) {
  const strengthDelta = homeLambda - awayLambda;
  const vol = volatilityMultiplier();

  let home = 42 + strengthDelta * 15;
  let away = 42 - strengthDelta * 15;
  let draw = 24 - Math.abs(strengthDelta) * 3;

  draw = clamp(draw / vol, 14, 34);
  home = clamp(home, 8, 78);
  away = clamp(away, 8, 78);

  const total = home + draw + away;

  home = Math.round((home / total) * 100);
  draw = Math.round((draw / total) * 100);
  away = 100 - home - draw;

  return { home, draw, away };
}

function projectedScore(homeLambda, awayLambda) {
  return {
    home: clamp(Math.round(homeLambda), 0, 6),
    away: clamp(Math.round(awayLambda), 0, 6)
  };
}

function confidenceFromProbabilities(probabilities) {
  const top = Math.max(probabilities.home, probabilities.draw, probabilities.away);
  const volPenalty = volatility === "High" ? 8 : volatility === "Low" ? -4 : 0;

  return clamp(Math.round(top - 12 - volPenalty), 18, 86);
}

function winnerFromProbabilities(probabilities) {
  if (probabilities.home >= probabilities.draw && probabilities.home >= probabilities.away) return "Home Team";
  if (probabilities.away >= probabilities.home && probabilities.away >= probabilities.draw) return "Away Team";
  return "Draw";
}

function updateBars(probabilities) {
  probTargets.home.textContent = `${probabilities.home}%`;
  probTargets.draw.textContent = `${probabilities.draw}%`;
  probTargets.away.textContent = `${probabilities.away}%`;

  probTargets.homeBar.style.width = `${probabilities.home}%`;
  probTargets.drawBar.style.width = `${probabilities.draw}%`;
  probTargets.awayBar.style.width = `${probabilities.away}%`;
}

function buildJson(score, probabilities, confidence) {
  return {
    predicted_winner: winnerFromProbabilities(probabilities),
    confidence,
    reasoning: "The model leans toward the side with the stronger attack-to-defense profile, adjusted by volatility and draw risk.",
    probabilistic_distribution: {
      home_win_pct: probabilities.home,
      draw_pct: probabilities.draw,
      away_win_pct: probabilities.away
    },
    prediction_metadata: {
      volatility_index: volatility,
      projected_score: `${score.home}-${score.away}`,
      simulated_outcome: "Playground estimate based on attack, defense, and volatility sliders."
    },
    expected_game_state: {
      first_half_dynamic: volatility === "High"
        ? "Open early phases with higher transition risk."
        : "Controlled opening phase with gradual pressure building.",
      projected_total_goals: score.home + score.away >= 3
        ? "Over 2.5 goals profile"
        : "Under 2.5 goals profile"
    },
    tactical_mismatch_exploit: {
      target_zone: "Stronger attack channel against weaker defensive side",
      impact_rating: `${clamp(Math.round(Math.abs(getValue("homeAttack") - getValue("awayDefense")) / 10 + 5), 1, 10)}/10`
    },
    market_angle: {
      cautious_metric: "Informational model output only. Not financial or betting advice."
    }
  };
}

function render() {
  for (const key of Object.keys(inputs)) {
    if (outputs[key]) outputs[key].textContent = inputs[key].value;
  }

  const homeLambda = poissonGoals(getValue("homeAttack"), getValue("awayDefense"));
  const awayLambda = poissonGoals(getValue("awayAttack"), getValue("homeDefense"));
  const score = projectedScore(homeLambda, awayLambda);
  const probabilities = normalizeProbabilities(homeLambda, awayLambda);
  const confidence = confidenceFromProbabilities(probabilities);
  const json = buildJson(score, probabilities, confidence);

  scoreTarget.textContent = `${score.home} - ${score.away}`;
  confidenceTarget.textContent = `${confidence}%`;
  volatilityLabel.textContent = volatility;

  updateBars(probabilities);
  jsonPreview.textContent = JSON.stringify(json, null, 2);
}

for (const input of Object.values(inputs)) {
  input?.addEventListener("input", render);
}

document.querySelectorAll("[data-volatility]").forEach((button) => {
  button.addEventListener("click", () => {
    volatility = button.dataset.volatility;
    document.querySelectorAll("[data-volatility]").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    render();
  });
});

render();