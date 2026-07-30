'use strict';

/**
 * ft_rome_lookup.js
 *
 * One-off helper: fetches the full France Travail ROME référentiel (metiers)
 * catalog — the endpoint ignores q/motsCles/libelle query params and always
 * returns all ~1,911 entries regardless — then filters client-side by keyword
 * against config.json job_titles.french, and prints the matching ROME codes
 * for the user to review and confirm.
 *
 * The endpoint is also rate-limited to 1 request/second (burst capacity 1),
 * far stricter than the 10/s job-offers API. Since the full catalog comes
 * back in a single call, that limit only matters if this script is ever
 * changed to paginate or retry.
 *
 * Do NOT auto-write results into config.json — per the Phase 4 plan, ROME
 * codes must be confirmed by the user before being wired into
 * france_travail_api.rome_codes (a wrong code silently narrows every future
 * search with no error).
 *
 * Usage: node scripts/ft_rome_lookup.js
 */

const fs   = require('fs');
const path = require('path');

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf-8'));
const FT  = cfg.france_travail_api;

async function getToken() {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: FT.client_id,
    client_secret: FT.client_secret,
    scope: FT.scope_rome,
  });
  const res = await fetch(FT.token_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(`OAuth token request failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.access_token;
}

async function fetchAllMetiers(token) {
  const url = `${FT.api_base_url}/rome-metiers/v1/metiers/metier`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`ROME catalog fetch failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// Strips accents/case so keyword matching works against both accented and
// plain-ASCII title variants (e.g. "contrôleur" vs "controleur").
function normalize(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function wordsOf(str) {
  return normalize(str).match(/[a-z0-9]+/g) || [];
}

async function run() {
  if (!FT || !FT.client_id || !FT.client_secret) {
    console.log('france_travail_api.client_id / client_secret not set in config.json.');
    console.log('Register at https://francetravail.io/inscription, create an app, subscribe to');
    console.log('"ROME Métiers", then paste the client ID/secret into config.json.');
    return;
  }

  const titles = cfg.job_titles.french;
  console.log(`Fetching full ROME catalog and filtering against ${titles.length} title(s)...\n`);

  const token = await getToken();
  const start = Date.now();
  const catalog = await fetchAllMetiers(token);
  console.log(`Fetched ${catalog.length} ROME entries in ${Date.now() - start}ms.\n`);

  // Build a keyword list from each config title's significant words (drop
  // short connector words like "de", "et", "du"), matched as whole word
  // tokens against the libelle — not substrings — so "RAF" never matches
  // inside "trafic" and short acronyms don't silently drop out.
  // Titles that reduce to a single generic word (e.g. "Responsable FP&A" →
  // just "responsable") are skipped entirely: one common word alone floods
  // the results with unrelated professions and isn't a real signal.
  const STOPWORDS = new Set(['de', 'du', 'des', 'et', 'la', 'le', 'les', 'a', 'en', 'aux']);
  const titleKeywords = titles.map(title => {
    const isBareAcronym = /^[A-Za-zÀ-ÿ]{2,5}$/.test(title.trim()) && title.trim() === title.trim().toUpperCase();
    const words = wordsOf(title).filter(w => !STOPWORDS.has(w) && w.length >= (isBareAcronym ? 2 : 4));
    return { title, words, isBareAcronym };
  });

  // code -> { libelle, matchedTitles: [] }
  const codes = new Map();

  for (const entry of catalog) {
    const libWords = new Set(wordsOf(entry.libelle));
    for (const { title, words, isBareAcronym } of titleKeywords) {
      const minWords = isBareAcronym ? 1 : 2;
      if (words.length >= minWords && words.every(w => libWords.has(w))) {
        if (!codes.has(entry.code)) codes.set(entry.code, { libelle: entry.libelle, matchedTitles: [] });
        codes.get(entry.code).matchedTitles.push(title);
      }
    }
  }

  console.log('--- Candidate ROME codes (review before adding to config.json) ---');
  const sorted = [...codes.entries()].sort((a, b) => b[1].matchedTitles.length - a[1].matchedTitles.length);
  for (const [code, info] of sorted) {
    console.log(`${code}  ${info.libelle}`);
    console.log(`    matched: ${info.matchedTitles.join(', ')}`);
  }
  console.log(`\n${sorted.length} distinct code(s) found. Confirm which belong in`);
  console.log('france_travail_api.rome_codes before running scripts/ft_fetch.js.');
}

run().catch(e => { console.error(e.message); process.exit(1); });
