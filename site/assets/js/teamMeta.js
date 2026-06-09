// site/assets/js/teamMeta.js
const teamMeta = {
  Qatar: { code: "QA", colors: ["#8a1538", "#ffffff"] },
  Switzerland: { code: "CH", colors: ["#e30613", "#ffffff"] },
  France: { code: "FR", colors: ["#002654", "#ed2939"] },
  Morocco: { code: "MA", colors: ["#c1272d", "#006233"] },
  Germany: { code: "DE", colors: ["#000000", "#dd0000"] },
  Japan: { code: "JP", colors: ["#ffffff", "#bc002d"] },
  Brazil: { code: "BR", colors: ["#009b3a", "#ffdf00"] },
  Argentina: { code: "AR", colors: ["#74acdf", "#ffffff"] },
  England: { code: "GB-ENG", colors: ["#ffffff", "#cf081f"] },
  Spain: { code: "ES", colors: ["#aa151b", "#f1bf00"] },
  Portugal: { code: "PT", colors: ["#006600", "#ff0000"] },
  Netherlands: { code: "NL", colors: ["#ae1c28", "#21468b"] },
  Mexico: { code: "MX", colors: ["#006847", "#ce1126"] },
  "United States": { code: "US", colors: ["#3c3b6e", "#b22234"] },
  Canada: { code: "CA", colors: ["#ff0000", "#ffffff"] }
};

export function getTeamMeta(teamName) {
  return teamMeta[teamName] || {
    code: String(teamName || "TBD").slice(0, 3).toUpperCase(),
    colors: ["#0f766e", "#f59e0b"]
  };
}