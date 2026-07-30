'use strict';

/**
 * ft_fetch.js
 *
 * Pulls structured job offers from the France Travail "Offres d'emploi v2" API
 * and stages them in listing_inbox with parse_status='structured' — no LLM
 * text-parsing needed, since the API already returns clean fields.
 *
 * Run order:
 *   1. node scripts/ft_fetch.js               (this script — raw ingestion)
 *   2. /job-scan-ft                            (scores + dedups the new rows,
 *                                                same as /job-email-inbox does
 *                                                for Gmail-sourced listings)
 *
 * Env vars (same convention as other inbox scripts):
 *   PG_MODULE  — path to pg module
 *   PG_CONN    — postgres connection string
 * (both are normally read straight from config.json, as below)
 *
 * Credentials: config.json → france_travail_api.client_id / client_secret.
 * Register at https://francetravail.io/inscription, create an app, subscribe
 * to "Offres d'emploi v2" (and "ROME Métiers" for scripts/ft_rome_lookup.js).
 */

const fs   = require('fs');
const path = require('path');

const cfg          = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf-8'));
const FT            = cfg.france_travail_api;
const { Client }    = require(cfg.pg_module_path);
const CONN          = cfg.supabase_connection_string;
const USER_PROFILE  = cfg.user.profile_id;

const PAGE_SIZE   = 50;   // results per request
const MAX_PAGES   = 4;    // per department — 200 results/dept ceiling
const CALL_DELAY  = 300;  // ms between API calls — safely under the 10 req/s limit

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getToken() {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: FT.client_id,
    client_secret: FT.client_secret,
    scope: FT.scope_offres,
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

async function searchOffers(token, departement, range) {
  const params = new URLSearchParams();
  if (FT.rome_codes.length) params.set('codeROME', FT.rome_codes.join(','));
  params.set('departement', departement);
  if (FT.contract_types.length) params.set('typeContrat', FT.contract_types.join(','));
  params.set('range', range);
  params.set('sort', '1'); // most recent first

  const url = `${FT.api_base_url}/offresdemploi/v2/offres/search?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });

  if (res.status === 204) return { offers: [], done: true };
  if (res.status === 200 || res.status === 206) {
    const json = await res.json();
    const offers = json.resultats || [];
    return { offers, done: offers.length < PAGE_SIZE };
  }
  throw new Error(`Search failed (dept ${departement}, range ${range}): ${res.status} ${await res.text()}`);
}

function mapOffer(offer, today) {
  return [
    today,                                                              // parse_date
    null,                                                                // gmail_thread_id
    null,                                                                // gmail_thread_url
    'France Travail',                                                   // source
    offer.romeLibelle || offer.romeCode || null,                        // alert_keyword
    offer.intitule || null,                                             // job_title
    (offer.entreprise && offer.entreprise.nom) || 'Not disclosed',      // company
    (offer.lieuTravail && offer.lieuTravail.libelle) || null,           // location
    (offer.salaire && offer.salaire.libelle) || null,                   // salary
    (offer.origineOffre && offer.origineOffre.urlOrigine)
      || `https://candidat.francetravail.fr/offres/recherche/detail/${offer.id}`, // job_url
    offer.typeContratLibelle || offer.typeContrat || null,               // contract_type
    'structured',                                                        // parse_status
    'France Travail API — structured, no LLM parse needed. English exposure not determined from structured fields — verify if borderline A.', // parse_notes
    false,                                                                // english
    (offer.description || '').slice(0, 200),                            // raw_snippet
    (offer.description || '').slice(0, 8000),                           // raw_body
    USER_PROFILE,                                                        // user_profile
  ];
}

async function run() {
  if (!FT || !FT.client_id || !FT.client_secret) {
    console.log('france_travail_api.client_id / client_secret not set in config.json.');
    console.log('Register at https://francetravail.io/inscription, create an app, subscribe to');
    console.log('"Offres d\'emploi v2", then paste the client ID/secret into config.json.');
    return;
  }
  if (!FT.rome_codes || FT.rome_codes.length === 0) {
    console.log('france_travail_api.rome_codes is empty. Run scripts/ft_rome_lookup.js first,');
    console.log('confirm the codes, and add them to config.json before fetching offers.');
    return;
  }

  console.log('Requesting OAuth2 token...');
  const token = await getToken();

  const today = new Date().toISOString().slice(0, 10);
  const allOffers = new Map(); // dedup by offer.id within this run
  const perDept = {};

  for (const dept of FT.departments) {
    perDept[dept] = 0;
    for (let page = 0; page < MAX_PAGES; page++) {
      const start = page * PAGE_SIZE;
      const range = `${start}-${start + PAGE_SIZE - 1}`;
      let result;
      try {
        result = await searchOffers(token, dept, range);
      } catch (e) {
        console.error(`  dept ${dept}: ${e.message}`);
        break;
      }
      for (const offer of result.offers) {
        if (!allOffers.has(offer.id)) allOffers.set(offer.id, offer);
      }
      perDept[dept] += result.offers.length;
      await sleep(CALL_DELAY);
      if (result.done) break;
    }
    console.log(`  dept ${dept}: ${perDept[dept]} offer(s)`);
  }

  console.log(`Total unique offers fetched: ${allOffers.size}`);
  if (allOffers.size === 0) return;

  const c = new Client({ connectionString: CONN });
  await c.connect();

  const { rows: existing } = await c.query(
    `SELECT job_url FROM listing_inbox WHERE user_profile = $1`,
    [USER_PROFILE]
  );
  const seenUrls = new Set(existing.map(r => r.job_url));

  let inserted = 0, deduped = 0;
  const errors = [];
  for (const offer of allOffers.values()) {
    const row = mapOffer(offer, today);
    const jobUrl = row[9];
    if (seenUrls.has(jobUrl)) { deduped++; continue; }
    try {
      await c.query(
        `INSERT INTO listing_inbox
           (parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
            job_title, company, location, salary, job_url, contract_type,
            parse_status, parse_notes, english, raw_snippet, raw_body, user_profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        row
      );
      inserted++;
      seenUrls.add(jobUrl);
    } catch (e) {
      errors.push(`${row[6]} | ${jobUrl}: ${e.message}`);
    }
  }

  await c.end();

  console.log(`inserted=${inserted}  url_deduped=${deduped}  errors=${errors.length}`);
  if (errors.length) errors.forEach(e => console.error('ERROR:', e));
  if (inserted > 0) console.log('\nNext step: run /job-scan-ft to score and route the new rows.');
}

run().catch(e => { console.error(e.message); process.exit(1); });
