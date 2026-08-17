'use strict';

/**
 * adzuna_fetch.js
 *
 * Pulls structured job listings from the Adzuna Job Search API (api.adzuna.com)
 * and stages them in listing_inbox with parse_status='structured' — same pattern
 * as ft_fetch.js: no LLM text-parsing needed, the API already returns clean fields.
 *
 * Run order:
 *   1. node scripts/adzuna_fetch.js            (this script — raw ingestion)
 *   2. /job-scan-adzuna                         (dedups the new rows against the
 *                                                 pipeline, same as /job-scan-ft
 *                                                 does for France Travail)
 *
 * Credentials: config.json → adzuna_api.app_id / app_key.
 * Register for free at https://developer.adzuna.com — no approval wait, key is
 * issued instantly.
 *
 * Adzuna is a job-board aggregator (it already ingests HelloWork, Adzuna's own
 * network, etc.), so expect meaningful overlap with existing sources — that's
 * expected, not a bug. See job-scan-adzuna.md's dedup step.
 */

const fs   = require('fs');
const path = require('path');

const cfg          = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf-8'));
const AZ            = cfg.adzuna_api;
const { Client }    = require(cfg.pg_module_path);
const CONN          = cfg.supabase_connection_string;
const USER_PROFILE  = cfg.user.profile_id;

const RESULTS_PER_PAGE = 50;
const MAX_PAGES        = 2;    // per title — 100 results/title ceiling
const CALL_DELAY       = 300;  // ms between API calls, polite pacing

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function searchTitle(title, page) {
  const params = new URLSearchParams({
    app_id: AZ.app_id,
    app_key: AZ.app_key,
    results_per_page: String(RESULTS_PER_PAGE),
    what: title,
    where: AZ.where || 'Grenoble',
    distance: String(AZ.distance_km || 60),
    'content-type': 'application/json',
  });
  const url = `https://api.adzuna.com/v1/api/jobs/${AZ.country || 'fr'}/search/${page}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Search failed ("${title}", page ${page}): ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.results || [];
}

function formatSalary(offer) {
  if (!offer.salary_min && !offer.salary_max) return null;
  if (offer.salary_min && offer.salary_max && offer.salary_min !== offer.salary_max) {
    return `${Math.round(offer.salary_min)}-${Math.round(offer.salary_max)} EUR`;
  }
  return `${Math.round(offer.salary_min || offer.salary_max)} EUR`;
}

function mapContractType(offer) {
  if (offer.contract_type === 'permanent') return 'CDI';
  if (offer.contract_type === 'contract') return 'CDD';
  return offer.contract_time || null;
}

function mapOffer(offer, title, today) {
  return [
    today,                                                              // parse_date
    null,                                                                // gmail_thread_id
    null,                                                                // gmail_thread_url
    'Adzuna',                                                            // source
    title,                                                               // alert_keyword (title searched)
    offer.title || null,                                                 // job_title
    (offer.company && offer.company.display_name) || 'Not disclosed',   // company
    (offer.location && offer.location.display_name) || null,            // location
    formatSalary(offer),                                                 // salary
    offer.redirect_url || null,                                          // job_url
    mapContractType(offer),                                              // contract_type
    'structured',                                                        // parse_status
    'Adzuna API — structured, no LLM parse needed. English exposure not determined from structured fields — verify if borderline A.', // parse_notes
    false,                                                                // english
    (offer.description || '').slice(0, 200),                            // raw_snippet
    (offer.description || '').slice(0, 8000),                           // raw_body
    USER_PROFILE,                                                        // user_profile
  ];
}

async function run() {
  if (!AZ || !AZ.app_id || !AZ.app_key) {
    console.log('adzuna_api.app_id / app_key not set in config.json.');
    console.log('Register for free at https://developer.adzuna.com, then paste the');
    console.log('Application ID and Application Key into config.json under adzuna_api.');
    return;
  }

  const titles = (AZ.search_titles && AZ.search_titles.length)
    ? AZ.search_titles
    : cfg.job_titles.french;

  const today = new Date().toISOString().slice(0, 10);
  const allOffers = new Map(); // dedup by offer.id within this run
  const perTitle = {};

  for (const title of titles) {
    perTitle[title] = 0;
    for (let page = 1; page <= MAX_PAGES; page++) {
      let results;
      try {
        results = await searchTitle(title, page);
      } catch (e) {
        console.error(`  "${title}": ${e.message}`);
        break;
      }
      for (const offer of results) {
        if (!allOffers.has(offer.id)) allOffers.set(offer.id, { offer, title });
      }
      perTitle[title] += results.length;
      await sleep(CALL_DELAY);
      if (results.length < RESULTS_PER_PAGE) break;
    }
    console.log(`  "${title}": ${perTitle[title]} result(s)`);
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
  for (const { offer, title } of allOffers.values()) {
    const row = mapOffer(offer, title, today);
    const jobUrl = row[9];
    if (!jobUrl || seenUrls.has(jobUrl)) { deduped++; continue; }
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
  if (inserted > 0) console.log('\nNext step: run /job-scan-adzuna to dedup against the pipeline and stage for scoring.');
}

run().catch(e => { console.error(e.message); process.exit(1); });
