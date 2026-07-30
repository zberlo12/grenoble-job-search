'use strict';

/**
 * ft_rome_lookup.js
 *
 * One-off helper: queries the France Travail ROME référentiel (metiers) API
 * for each target job title in config.json job_titles.french, and prints the
 * matching ROME codes for the user to review and confirm.
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

const CALL_DELAY = 300; // ms between API calls

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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

async function searchRome(token, query) {
  const url = `${FT.api_base_url}/rome-metiers/v1/metiers/metier?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (res.status === 204) return [];
  if (!res.ok) {
    console.error(`  "${query}": ${res.status} ${await res.text()}`);
    return [];
  }
  return res.json();
}

async function run() {
  if (!FT || !FT.client_id || !FT.client_secret) {
    console.log('france_travail_api.client_id / client_secret not set in config.json.');
    console.log('Register at https://francetravail.io/inscription, create an app, subscribe to');
    console.log('"ROME Métiers", then paste the client ID/secret into config.json.');
    return;
  }

  const titles = cfg.job_titles.french;
  console.log(`Looking up ROME codes for ${titles.length} title(s)...\n`);

  const token = await getToken();

  // code -> { libelle, matchedTitles: [] }
  const codes = new Map();

  for (const title of titles) {
    let matches;
    try {
      matches = await searchRome(token, title);
    } catch (e) {
      console.error(`  "${title}": ${e.message}`);
      continue;
    }
    if (!Array.isArray(matches) || matches.length === 0) {
      console.log(`  "${title}" → no match`);
    } else {
      const summary = matches.map(m => `${m.code} ${m.libelle}`).join(' | ');
      console.log(`  "${title}" → ${summary}`);
      for (const m of matches) {
        if (!codes.has(m.code)) codes.set(m.code, { libelle: m.libelle, matchedTitles: [] });
        codes.get(m.code).matchedTitles.push(title);
      }
    }
    await sleep(CALL_DELAY);
  }

  console.log('\n--- Candidate ROME codes (review before adding to config.json) ---');
  const sorted = [...codes.entries()].sort((a, b) => b[1].matchedTitles.length - a[1].matchedTitles.length);
  for (const [code, info] of sorted) {
    console.log(`${code}  ${info.libelle}`);
    console.log(`    matched: ${info.matchedTitles.join(', ')}`);
  }
  console.log(`\n${sorted.length} distinct code(s) found. Confirm which belong in`);
  console.log('france_travail_api.rome_codes before running scripts/ft_fetch.js.');
}

run().catch(e => { console.error(e.message); process.exit(1); });
