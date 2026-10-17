// GET /api/match?id=123456 -> events (goals, cards, subs) and stats for one match
const { apiGet, sendJson, sendError } = require("./_lib");

// Turns API-Football's stat names into the labels we show.
const STAT_MAP = {
  "Ball Possession": "Possession",
  "Total Shots": "Shots",
  "Shots on Goal": "Shots on target",
  "Corner Kicks": "Corners",
};

const toNumber = v => parseInt(v, 10) || 0;   // "58%" -> 58, null -> 0

module.exports = async (req, res) => {
  try {
    const id = parseInt(req.query.id, 10);
    if (!id) return res.status(400).json({ error: "Missing or invalid id" });

    // Two API calls at the same time
    const [rawEvents, rawStats] = await Promise.all([
      apiGet(`/fixtures/events?fixture=${id}`),
      apiGet(`/fixtures/statistics?fixture=${id}`),
    ]);

    const events = rawEvents.map(e => {
      let type = "sub";
      let player = e.player && e.player.name;
      if (e.type === "Goal") type = "goal";
      else if (e.type === "Card") type = /red/i.test(e.detail) ? "red" : "yellow";
      else if (e.type === "subst" && e.assist) player = `${e.assist.name} on, ${e.player.name} off`;
      return { min: e.time.elapsed, type, team: e.team.name, player };
    });

    // rawStats is [homeTeamStats, awayTeamStats], or empty before kick-off.
    let stats = null;
    if (rawStats.length === 2) {
      stats = {};
      for (const [apiName, label] of Object.entries(STAT_MAP)) {
        const find = t => t.statistics.find(s => s.type === apiName);
        const h = find(rawStats[0]);
        const a = find(rawStats[1]);
        if (h && a) stats[label] = [toNumber(h.value), toNumber(a.value)];
      }
    }

    sendJson(res, { events, stats }, 30);
  } catch (err) {
    sendError(res, err);
  }
};
