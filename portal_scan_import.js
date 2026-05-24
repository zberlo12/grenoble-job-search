'use strict';

/**
 * portal_scan_import.js
 *
 * Reads career-ops-analysis/data/pipeline.md, imports unchecked job items
 * into the Grenoble listing_inbox table, then marks them as processed.
 *
 * Run order each day:
 *   1. cd career-ops-analysis && node scan.mjs
 *   2. cd Grenoble-job-search  && node portal_scan_import.js
 *   3. /job-search-daily-scan  (processes listing_inbox as normal)
 *
 * Env vars (same as other inbox scripts):
 *   PG_MODULE  — path to pg module (e.g. /absolute/path/to/node_modules/pg)
 *   PG_CONN    — postgres connection string
 */

const fs   = require('fs');
const path = require('path');

const cfg          = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));
const { Client }   = require(cfg.pg_module_path);
const CONN         = cfg.supabase_connection_string;
const USER_PROFILE = cfg.user.profile_id;
const CAREER_OPS   = path.resolve(__dirname, '../career-ops-analysis');
const PIPELINE     = path.join(CAREER_OPS, 'data/pipeline.md');
const SCAN_HIST    = path.join(CAREER_OPS, 'data/scan-history.tsv');

async function run() {
  // ── 1. Sanity check ───────────────────────────────────────────────────────
  if (!fs.existsSync(PIPELINE)) {
    console.log('pipeline.md not found — run: cd career-ops-analysis && node scan.mjs');
    return;
  }

  // ── 2. Build URL→metadata from scan-history.tsv (has location field) ──────
  // TSV header: url  first_seen  portal  title  company  status  location
  const meta = new Map();
  if (fs.existsSync(SCAN_HIST)) {
    const lines = fs.readFileSync(SCAN_HIST, 'utf-8').split('\n').slice(1);
    for (const line of lines) {
      if (!line.trim()) continue;
      const cols = line.split('\t');
      const [url, , portal, title, company, , location] = cols;
      if (url) meta.set(url.trim(), {
        title:    (title    || '').trim(),
        company:  (company  || '').trim(),
        location: (location || '').trim() || null,
        portal:   (portal   || 'portal-scan').trim(),
      });
    }
  }

  // ── 3. Parse unchecked items from pipeline.md ─────────────────────────────
  // Format written by scan.mjs: - [ ] {url} | {company} | {title}
  const pipelineText = fs.readFileSync(PIPELINE, 'utf-8');
  const RE = /^- \[ \] (https?:\/\/\S+) \| ([^|]+) \| (.+)$/gm;
  const jobs = [];
  let m;
  while ((m = RE.exec(pipelineText)) !== null) {
    const [, url, pipelineCompany, pipelineTitle] = m;
    const hist = meta.get(url.trim()) || {};
    jobs.push({
      url:      url.trim(),
      title:    pipelineTitle.trim() || hist.title || '',
      company:  pipelineCompany.trim() || hist.company || 'Not disclosed',
      location: hist.location || null,
      portal:   hist.portal   || 'portal-scan',
    });
  }

  if (jobs.length === 0) {
    console.log('No unchecked items in pipeline.md — nothing to import.');
    return;
  }
  console.log(`Found ${jobs.length} unchecked job(s) in pipeline.md`);

  // ── 4. Connect and dedup ──────────────────────────────────────────────────
  const c = new Client({ connectionString: CONN });
  await c.connect();

  const { rows: existing } = await c.query(
    `SELECT job_url FROM listing_inbox WHERE user_profile = $1`,
    [USER_PROFILE]
  );
  const seenUrls = new Set(existing.map(r => r.job_url));

  // ── 5. INSERT new jobs ────────────────────────────────────────────────────
  const today   = new Date().toISOString().slice(0, 10);
  let inserted  = 0;
  let duped     = 0;
  const errors  = [];

  for (const job of jobs) {
    if (seenUrls.has(job.url)) { duped++; continue; }
    try {
      await c.query(
        `INSERT INTO listing_inbox
           (parse_date, source, job_title, company, location, job_url,
            parse_status, english, raw_snippet, user_profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          today,
          job.portal,
          job.title,
          job.company,
          job.location,
          job.url,
          'pending',
          false,
          `${job.company} — ${job.location || 'N/A'} — ${job.title}`.substring(0, 200),
          USER_PROFILE,
        ]
      );
      inserted++;
      seenUrls.add(job.url);
    } catch (e) {
      errors.push(`${job.company} | ${job.url}: ${e.message}`);
    }
  }

  await c.end();

  // ── 6. Mark all processed items [x] in pipeline.md ───────────────────────
  // Mark every job we attempted (inserted OR duped) so they don't re-import
  const processedUrls = new Set(jobs.map(j => j.url));
  const updated = pipelineText.replace(
    /^- \[ \] (https?:\/\/\S+)( \|.*)$/gm,
    (line, url) => processedUrls.has(url) ? line.replace('- [ ]', '- [x]') : line
  );
  fs.writeFileSync(PIPELINE, updated, 'utf-8');

  // ── 7. Summary ────────────────────────────────────────────────────────────
  console.log(`inserted=${inserted}  deduped=${duped}  errors=${errors.length}`);
  if (errors.length) errors.forEach(e => console.error('ERROR:', e));
  if (inserted > 0) {
    console.log(`\nNext step: run /job-search-daily-scan to process the new listings.`);
  }
}

run().catch(e => { console.error(e.message); process.exit(1); });
