const { LEAGUES, apiGet, sendJson, sendError } = require("./_lib");

const LIVE = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT", "SUSP"];
const FINISHED = ["FT", "AET", "PEN"];

module.exports = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const fixtures = await apiGet(`/fixtures?date=${encodeURIComponent(date)}`);

    const matches = fixtures
      .map(f => {
        const short = f.fixture.status.short;
        const top = Boolean(LEAGUES[f.league.id]);
        return {
          id: f.fixture.id,
          // top leagues keep their short name, others show "Country: League"
          league: top ? LEAGUES[f.league.id] : `${f.league.country}: ${f.league.name}`,
          top,
          home: f.teams.home.name,
          away: f.teams.away.name,
          hs: f.goals.home ?? 0,
          as: f.goals.away ?? 0,
          status: LIVE.includes(short) ? "LIVE" : FINISHED.includes(short) ? "FT" : "NS",
          short,
          minute: f.fixture.status.elapsed,
          kickoff: f.fixture.date,
        };
      })
      // big leagues first, then the rest A to Z, then by kickoff time
      .sort((a, b) =>
        (b.top - a.top) ||
        a.league.localeCompare(b.league) ||
        a.kickoff.localeCompare(b.kickoff));

    sendJson(res, matches, 60);
  } catch (err) {
    sendError(res, err);
  }
};
