// site/assets/js/groups.js
import { config } from "./config.js";
import { getTeamMeta } from "./teamMeta.js";

const dataPanel = document.querySelector("[data-groups-panel]");
const status = document.querySelector("[data-groups-status]");
const refreshButton = document.querySelector("[data-refresh-groups]");

function setStatus(message) {
    if (status) status.textContent = message;
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;"
    })[char]);
}

// Reusing your team badge logic from live.js, adapted for table rows
function getTeamCell(teamCode) {
    const meta = getTeamMeta(teamCode);
    return `
    <div class="team-flag" style="--team-a:${meta.colors[0]};--team-b:${meta.colors[1]}">
      ${escapeHtml(meta.code)}
    </div>
    ${escapeHtml(meta.name)}
  `;
}

async function fetchGroupStandings() {
    if (!config.supabaseUrl.includes("supabase.co")) return [];

    // Assuming your Supabase view/table is called 'public_group_standings'
    // Adjust this endpoint if your table is named differently.
    const url = new URL("/rest/v1/public_group_standings", config.supabaseUrl);
    url.searchParams.set("select", "*");
    url.searchParams.set("order", "group_letter.asc,points.desc,goal_difference.desc");

    const response = await fetch(url, {
        headers: {
            apikey: config.supabaseAnonKey,
            Authorization: `Bearer ${config.supabaseAnonKey}`
        }
    });

    if (!response.ok) {
        throw new Error(`Supabase read failed: ${response.status}`);
    }

    return response.json();
}

function renderGroups(standingsRow) {
    if (!dataPanel) return;

    if (!standingsRow.length) {
        dataPanel.innerHTML = `<article class="empty-state">Standings data pending.</article>`;
        return;
    }

    // 1. Group the flat Supabase rows by 'group_letter'
    const groups = standingsRow.reduce((acc, row) => {
        if (!acc[row.group_letter]) acc[row.group_letter] = [];
        acc[row.group_letter].push(row);
        return acc;
    }, {});

    // 2. Change container to grid layout
    dataPanel.className = 'groups-grid';

    // 3. Build the HTML for each group
    const html = Object.keys(groups).map(letter => {
        const teams = groups[letter];

        const rowsHTML = teams.map((team, index) => {
            // Top 2 qualify
            const isQualifier = index < 2 ? 'qualifier' : '';


            // Change this part in your rowsHTML map:
        return `
  <tr class="${isQualifier}">
    <td>${index + 1}</td>
    <td class="team-cell">
      ${getTeamCell(team.team_code)}
    </td>
    <td>${escapeHtml(String(team.played))}</td>
    <td>${escapeHtml(String(team.won))}</td>
    <td>${escapeHtml(String(team.drawn))}</td>
    <td>${escapeHtml(String(team.lost))}</td>
    <td class="stat-gd">${team.goal_difference > 0 ? '+' : ''}${escapeHtml(String(team.goal_difference))}</td>
    <td class="stat-pts">${escapeHtml(String(team.points))}</td>
  </tr>
`;
        }).join('');

        return `
      <article class="group-card">
        <div class="group-header">
          <h2>Group ${escapeHtml(letter)}</h2>
          <span>Standings</span>
        </div>
        <table class="group-table">
          <thead>
            <tr>
              <th width="30">#</th>
              <th>Team</th>
              <th title="Played" width="30">P</th>
              <th title="Won" width="30">W</th>
              <th title="Drawn" width="30">D</th>
              <th title="Lost" width="30">L</th>
              <th title="Goal Difference" width="40">GD</th>
              <th title="Points" width="40">Pts</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>
      </article>
    `;
    }).join("");

    dataPanel.innerHTML = html;
}

async function loadGroups() {
    try {
        setStatus("Refreshing...");
        const standings = await fetchGroupStandings();
        renderGroups(standings);
        setStatus(`Updated ${new Date().toLocaleTimeString()}`);
    } catch (error) {
        console.error("Groups fetch error:", error);
        setStatus("Data unavailable");
        if (!dataPanel.innerHTML.includes("group-card")) {
            dataPanel.innerHTML = `<article class="empty-state">Standings currently unavailable.</article>`;
        }
    }
}

refreshButton?.addEventListener("click", loadGroups);

// Initial Load
loadGroups();

// Optional: Auto-refresh standings every X ms (Comment out if standings only update daily)
// window.setInterval(loadGroups, config.pollingMs);