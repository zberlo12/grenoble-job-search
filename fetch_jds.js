'use strict';
// Fetches job descriptions for To Apply entries that have LinkedIn or Gmail URLs.
// Uses Edge with existing session (logged into LinkedIn + Gmail).
// Usage: node fetch_jds.js

const puppeteer = require('C:/Users/zberl/OneDrive/Documents/Code/Grenoble-job-search/node_modules/puppeteer-core');
const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');

const EDGE_EXE  = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const EDGE_DATA = 'C:/Users/zberl/AppData/Local/Microsoft/Edge/User Data';
const PG_CONN   = 'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';
const USER      = 'zberlo';

// ja_id → URL to scrape
const TARGETS = [
  { id: 675, url: 'https://www.linkedin.com/jobs/view/4422829528/', type: 'linkedin', label: 'PIMAN Cost Controller' },
  { id: 690, url: 'https://mail.google.com/mail/u/0/#all/19ea6e27387a19d4', type: 'gmail', label: 'Michael Page Resp. Comptable & Trésorerie' },
  { id: 688, url: 'https://mail.google.com/mail/u/0/#all/19eab95551345d3a', type: 'gmail', label: 'STEF CDG Opérationnel' },
];

async function extractLinkedIn(page, url) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('.jobs-description, .job-view-layout, [class*="description"]', { timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
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

  for (const t of TARGETS) {
    console.log(`\n[ja=${t.id}] ${t.label}`);
    try {
      const text = t.type === 'linkedin'
        ? await extractLinkedIn(page, t.url)
        : await extractGmail(page, t.url);

      if (text && text.length > 200) {
        const snippet = text.slice(0, 8000);
        await db.query(
          'UPDATE job_applications SET job_description=$1 WHERE id=$2 AND user_profile=$3',
          [snippet, t.id, USER]
        );
        console.log(`  ✓ Saved ${text.length} chars`);
      } else {
        console.log(`  ✗ Too short or empty`);
      }
    } catch (e) {
      console.log(`  ✗ Error: ${e.message}`);
    }
  }

  await browser.close();
  await db.end();
  console.log('\nDone. Roche URLs still need manual fetch — check roche.com/careers.');
}

run().catch(e => { console.error(e.message); process.exit(1); });
