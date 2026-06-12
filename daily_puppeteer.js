'use strict';
// Unified Puppeteer pipeline for the daily job search run.
// Pass 1: Extract email bodies from Gmail for listing_inbox puppeteer_pending rows.
// Pass 2: Fetch JDs from job listing URLs for job_applications To Apply rows missing JD.
//
// Usage:
//   node daily_puppeteer.js              — run both passes
//   node daily_puppeteer.js --pass1-only — email extraction only (run after job-email-inbox)
//   node daily_puppeteer.js --pass2-only — JD fetch only (run before /job-apply)

const puppeteer = require('C:/Users/zberl/OneDrive/Documents/Code/Grenoble-job-search/node_modules/puppeteer-core');
const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const fs = require('fs');

const cfg       = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const EDGE_EXE  = cfg.puppeteer.edge_exe;
const EDGE_DATA = cfg.puppeteer.edge_data;
const PG_CONN   = cfg.supabase_connection_string;
const USER      = cfg.user.profile_id;

const args      = process.argv.slice(2);
const pass1Only = args.includes('--pass1-only');
const pass2Only = args.includes('--pass2-only');
const runPass1  = !pass2Only;
const runPass2  = !pass1Only;

async function extractGmail(page, url) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('div[data-message-id], .ii.gt, .a3s', { timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
  return page.evaluate(() => {
    const selectors = ['.ii.gt div', '.a3s.aiL', '.a3s', '[data-message-id] .ii'];
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      if (els.length) return Array.from(els).map(e => e.innerText).join('\n\n').trim();
    }
    const thread = document.querySelector('.AO') || document.body;
    return thread ? thread.innerText.trim() : '';
  });
}

async function extractLinkedIn(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.jobs-description, .job-view-layout, [class*="description"]', { timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));
  return page.evaluate(() => {
    const sel = [
      '.jobs-description__content',
      '.jobs-description',
      '[class*="job-description"]',
      '.description__text',
    ];
    for (const s of sel) {
      const el = document.querySelector(s);
      if (el && el.innerText.trim().length > 100) return el.innerText.trim();
    }
    return document.body.innerText.trim();
  });
}

async function extractUrl(page, url) {
  if (url.includes('linkedin.com')) return extractLinkedIn(page, url);
  if (url.includes('mail.google.com')) return extractGmail(page, url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  return page.evaluate(() => document.body.innerText.trim());
}

async function run() {
  const db = new Client({ connectionString: PG_CONN });
  await db.connect();

  const browser = await puppeteer.launch({
    executablePath: EDGE_EXE,
    userDataDir: EDGE_DATA,
    headless: false,
    args: ['--no-sandbox', '--profile-directory=Default'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // ── PASS 1: Email body extraction ─────────────────────────────────────────
  if (runPass1) {
    const { rows } = await db.query(
      `SELECT id, gmail_thread_url, source, alert_keyword
       FROM listing_inbox
       WHERE parse_status = 'puppeteer_pending'
         AND gmail_thread_url IS NOT NULL
         AND user_profile = $1
       ORDER BY created_at ASC`,
      [USER]
    );

    if (rows.length === 0) {
      console.log('Pass 1: 0 puppeteer_pending rows — nothing to extract.');
    } else {
      console.log(`Pass 1: extracting ${rows.length} HTML-only email(s)...\n`);
      let ok = 0, fail = 0;
      for (const row of rows) {
        console.log(`[li=${row.id}] ${row.source || 'Unknown'} — ${row.alert_keyword || ''}`);
        try {
          const text = await extractGmail(page, row.gmail_thread_url);
          if (text && text.length > 200) {
            await db.query(
              `UPDATE listing_inbox
               SET raw_body = $1, parse_status = 'pending',
                   parse_notes = 'Puppeteer extracted — ready for Claude parse'
               WHERE id = $2 AND user_profile = $3`,
              [text.slice(0, 8000), row.id, USER]
            );
            console.log(`  ✓ ${text.length} chars extracted`);
            ok++;
          } else {
            await db.query(
              `UPDATE listing_inbox
               SET parse_status = 'manual_check',
                   parse_notes = 'Puppeteer extraction failed — open Gmail link manually'
               WHERE id = $2 AND user_profile = $3`,
              [row.id, USER]
            );
            console.log('  ✗ Too short or empty — reverted to manual_check');
            fail++;
          }
        } catch (e) {
          await db.query(
            `UPDATE listing_inbox
             SET parse_status = 'manual_check',
                 parse_notes = $1
             WHERE id = $2 AND user_profile = $3`,
            [`Puppeteer error: ${e.message.slice(0, 200)}`, row.id, USER]
          );
          console.log(`  ✗ Error: ${e.message}`);
          fail++;
        }
      }
      console.log(`\nPass 1 done: ${ok} extracted, ${fail} failed → manual_check`);
    }
  }

  // ── PASS 2: JD extraction for To Apply rows ───────────────────────────────
  if (runPass2) {
    const { rows } = await db.query(
      `SELECT id, job_title, company, job_url, gmail_thread_url
       FROM job_applications
       WHERE status = 'To Apply'
         AND (job_description IS NULL OR job_description = '')
         AND user_profile = $1
         AND (
           (job_url IS NOT NULL AND job_url != 'Not available')
           OR gmail_thread_url IS NOT NULL
         )
       ORDER BY CASE priority WHEN 'A' THEN 1 WHEN 'B' THEN 2 ELSE 3 END, date_added ASC`,
      [USER]
    );

    if (rows.length === 0) {
      console.log('\nPass 2: all To Apply rows already have JDs — nothing to fetch.');
    } else {
      console.log(`\nPass 2: fetching JDs for ${rows.length} To Apply row(s)...\n`);
      let ok = 0, fail = 0;
      for (const row of rows) {
        const url = (row.job_url && row.job_url !== 'Not available') ? row.job_url : row.gmail_thread_url;
        console.log(`[ja=${row.id}] ${row.company} — ${row.job_title}`);
        console.log(`  URL: ${url}`);
        try {
          const text = await extractUrl(page, url);
          if (text && text.length > 200) {
            await db.query(
              'UPDATE job_applications SET job_description=$1 WHERE id=$2 AND user_profile=$3',
              [text.slice(0, 8000), row.id, USER]
            );
            console.log(`  ✓ ${text.length} chars saved`);
            ok++;
          } else {
            console.log('  ✗ Too short or empty');
            fail++;
          }
        } catch (e) {
          console.log(`  ✗ Error: ${e.message}`);
          fail++;
        }
      }
      console.log(`\nPass 2 done: ${ok} JDs saved, ${fail} failed`);
    }
  }

  await browser.close();
  await db.end();
  console.log('\nDone.');
}

run().catch(e => { console.error(e.message); process.exit(1); });
