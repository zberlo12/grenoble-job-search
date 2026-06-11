'use strict';
// Reads UNREADABLE review_queue rows by navigating to Gmail URLs via Chrome.
// Run with Chrome CLOSED. Uses your existing Chrome profile — no OAuth setup needed.
// Usage: node read_unreadable.js [rq_id1 rq_id2 ...]  (no args = all UNREADABLE rows)

const puppeteer = require('C:/Users/zberl/OneDrive/Documents/Code/Grenoble-job-search/node_modules/puppeteer-core');
const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');

const CHROME_EXE  = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const CHROME_DATA = 'C:/Users/zberl/AppData/Local/Google/Chrome/User Data';
const PG_CONN     = 'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';
const USER        = 'zberlo';

async function readThread(page, gmailUrl) {
  await page.goto(gmailUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  // Wait for email body to render
  await page.waitForSelector('div[data-message-id], .ii.gt, .a3s', { timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  const text = await page.evaluate(() => {
    // Try main email body containers Gmail uses
    const selectors = ['.ii.gt div', '.a3s.aiL', '.a3s', '[data-message-id] .ii'];
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      if (els.length) {
        return Array.from(els).map(e => e.innerText).join('\n\n').trim();
      }
    }
    // Fallback: all visible text in thread
    const thread = document.querySelector('.AO') || document.body;
    return thread ? thread.innerText.trim() : '';
  });
  return text;
}

async function run() {
  const db = new Client({ connectionString: PG_CONN });
  await db.connect();

  const filterIds = process.argv.slice(2).map(Number).filter(Boolean);
  const where = filterIds.length
    ? `id = ANY(ARRAY[${filterIds.join(',')}])`
    : `notes LIKE '%UNREADABLE%' AND gmail_thread_url IS NOT NULL`;

  const { rows } = await db.query(
    `SELECT id, job_title, company, gmail_thread_url, notes FROM review_queue
     WHERE user_profile = $1 AND ${where} ORDER BY date_added ASC`, [USER]
  );

  if (!rows.length) { console.log('No UNREADABLE rows found.'); await db.end(); return; }
  console.log(`Processing ${rows.length} rows...\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_EXE,
    userDataDir: CHROME_DATA,
    headless: false,  // visible so you can handle any Google sign-in prompt
    args: ['--no-sandbox', '--profile-directory=Default']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const results = [];
  for (const row of rows) {
    console.log(`[rq=${row.id}] ${row.company || 'Unknown'} — ${row.job_title || 'Unknown'}`);
    try {
      const text = await readThread(page, row.gmail_thread_url);
      if (text && text.length > 200) {
        results.push({ id: row.id, text });
        // Store extracted body in notes field for Claude to process
        await db.query(
          `UPDATE review_queue SET notes = $1 WHERE id = $2 AND user_profile = $3`,
          [`EXTRACTED:\n${text.slice(0, 8000)}`, row.id, USER]
        );
        console.log(`  ✓ Extracted ${text.length} chars`);
      } else {
        console.log(`  ✗ Empty or too short — may need manual login`);
      }
    } catch (e) {
      console.log(`  ✗ Error: ${e.message}`);
    }
  }

  await browser.close();
  await db.end();

  console.log(`\nDone. ${results.length}/${rows.length} rows extracted.`);
  console.log('Now run /job-review in Claude to process the extracted content.');
}

run().catch(e => { console.error(e.message); process.exit(1); });
