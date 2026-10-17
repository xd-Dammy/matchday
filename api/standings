// GET /api/standings?league=39 -> table rows: [team, played, won, drawn, lost, points]
const { LEAGUES, apiGet, sendJson, sendError } = require("./_lib");

// Football seasons start around July. Oct 2026 belongs to the "2026" season.
// If your API plan only allows older seasons, set SEASON in Vercel's environment variables.
function currentSeason() {
  if (process.env.SEASON) return process.env.SEASON;
  const now = new Date();
  return now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

module.exports = async (req, res) => {
  try {
    const league = parseInt(req.query.league, 10) || 39;
    if (!LEAGUES[league]) return res.status(400).json({ error: "Unknown league" });

    const data = await apiGet(`/standings?league=${league}&season=${currentSeason()}`);
    const table = data.length ? data[0].league.standings[0] : [];

    const rows = table.map(r => [
      r.team.name, r.all.played, r.all.win, r.all.draw, r.all.lose, r.points,
    ]);

    sendJson(res, rows, 600);   // tables change slowly: cache for 10 minutes
  } catch (err) {
    sendError(res, err);
  }
};
