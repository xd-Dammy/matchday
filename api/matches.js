// GET /api/matches            -> today's matches
// GET /api/matches?date=2026-10-17 -> matches for that date
const { LEAGUES, apiGet, sendJson, sendError } = require("./_lib");

// API-Football status codes grouped into 3 simple states for our frontend.
const LIVE = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT", "SUSP"];
const FINISHED = ["FT", "AET", "PEN"];

module.exports = async (req, res) => {
  try {
    const date = (req.query.date || new Date().toISOString().slice(0, 10));
    const fixtures = await apiGet(`/fixtures?date=${encodeURIComponent(date)}`);

    const matches = fixtures
      .filter(f => LEAGUES[f.league.id])              // keep only our leagues
      .map(f => {
        const short = f.fixture.status.short;
        return {
          id: f.fixture.id,
          league: LEAGUES[f.league.id],
          home: f.teams.home.name,
          away: f.teams.away.name,
          hs: f.goals.home ?? 0,
          as: f.goals.away ?? 0,
          status: LIVE.includes(short) ? "LIVE" : FINISHED.includes(short) ? "FT" : "NS",
          short,                                       // e.g. "HT"
          minute: f.fixture.status.elapsed,
          kickoff: f.fixture.date,                     // ISO time, browser shows local time
        };
      })
      // live first, then by kickoff time
      .sort((a, b) => (b.status === "LIVE") - (a.status === "LIVE") || a.kickoff.localeCompare(b.kickoff));

    sendJson(res, matches, 60);
  } catch (err) {
    sendError(res, err);
  }
};
