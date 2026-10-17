// Shared helpers for all backend functions.
// Files starting with "_" are NOT exposed as URLs by Vercel, they are just helpers.

const BASE = "https://v3.football.api-sports.io";

// The leagues the site shows. Add more by adding their API-Football league id.
const LEAGUES = {
  39: "Premier League",
  140: "La Liga",
  135: "Serie A",
  78: "Bundesliga",
  2: "Champions League",
};

// Calls API-Football. The secret key is read from an environment variable,
// so it never appears in the browser or in the code.
async function apiGet(path) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("Missing API_FOOTBALL_KEY environment variable");

  const r = await fetch(BASE + path, { headers: { "x-apisports-key": key } });
  if (!r.ok) throw new Error("API-Football error " + r.status);

  const data = await r.json();
  // API-Football reports problems (bad key, plan limits) inside the JSON.
  if (data.errors && Object.keys(data.errors).length) {
    throw new Error(JSON.stringify(data.errors));
  }
  return data.response;
}

// Sends JSON and tells Vercel's CDN to cache it, so many visitors share ONE API call.
// This is how we protect the API request limit.
function sendJson(res, body, cacheSeconds) {
  res.setHeader("Cache-Control", `s-maxage=${cacheSeconds}, stale-while-revalidate`);
  res.status(200).json(body);
}

function sendError(res, err) {
  console.error(err);
  res.status(502).json({ error: String(err.message || err) });
}

module.exports = { LEAGUES, apiGet, sendJson, sendError };
