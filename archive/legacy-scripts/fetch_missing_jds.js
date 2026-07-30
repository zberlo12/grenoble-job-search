'use strict';
// One-off script: fetch real JDs for To Apply rows that only have email digest content.
// Opens Gmail thread in Edge, extracts the "Voir l'offre" href for the target company/title,
// follows it, grabs the full page text, saves to job_applications.job_description.
//
// Usage: node fetch_missing_jds.js

const puppeteer = require('C:/Users/zberl/OneDrive/Documents/Code/Grenoble-job-search/node_modules/puppeteer-core');
const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const fs = require('fs');

const cfg      = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const PG_CONN  = cfg.supabase_connection_string;
const EDGE_EXE = cfg.puppeteer.edge_exe;
const EDGE_DATA = cfg.puppeteer.edge_data;

// Jobs to enrich: { id, gmail_thread_url, match_texts (substrings to identify the right link) }
const TARGETS = [
  {
    id: 690,
    title: 'Responsable Comptable et Trésorerie H/F',
    company: 'Michael Page',
    gmail_thread_url: 'https://mail.google.com/mail/u/0/#all/19ea6e27387a19d4',
    match_texts: ['Michael Page', 'Responsable Comptable', 'Tresorerie', 'Trésorerie'],
  },
  {
    id: 688,
    title: 'Contrôleur de Gestion Opérationnelle H/F',
    company: 'STEF',
    gmail_thread_url: 'https://mail.google.com/mail/u/0/#all/19eab95551345d3a',
    match_texts: ['STEF', 'Gestion Op'],
  },
];

async function extractJobLinkFromGmail(page, gmailUrl, matchTexts) {
  await page.goto(gmailUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('.ii.gt, .a3s', { timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));

  const jobLinks = await page.evaluate((texts) => {
    const emailBody = document.querySelector('.ii.gt') || document.querySelector('.a3s') || document.body;
    const emailText = emailBody.innerText;

    const matchPositions = texts
      .map(t => emailText.toLowerCase().indexOf(t.toLowerCase()))
      .filter(p => p >= 0);

    if (matchPositions.length === 0) return [];

    const targetPos = Math.min(...matchPositions);

    const anchors = Array.from(emailBody.querySelectorAll('a[href]'));
    const candidates = [];
    for (const a of anchors) {
      const href = a.href;
      if (!href || href.startsWith('mailto:') || href.includes('unsubscribe') ||
          href.includes('desabonner') || href.includes('manage') || href.includes('privacy') ||
          href.includes('gestion-alertes') || href.includes('onelink.me')) continue;

      const anchorText = a.innerText.trim();
      const anchorPos = emailText.indexOf(anchorText);
      const distance = Math.abs(anchorPos - targetPos);
      candidates.push({ href, text: anchorText, distance });
    }

    candidates.sort((a, b) => a.distance - b.distance);
    return candidates.slice(0, 5);
  }, matchTexts);

  console.log('  Candidate links:');
  jobLinks.forEach(l => console.log(`    [dist=${l.distance}] "${l.text}" → ${l.href.slice(0, 80)}`));

  const jobLink = jobLinks.find(l =>
    !l.href.includes('indeed.com/jobs?') &&
    !l.href.includes('subscriptions.indeed') &&
    !l.href.includes('hellowork.com/espace') &&
    l.href.length > 30
  );

  return jobLink ? jobLink.href : null;
}

async function fetchJD(page, url) {
  console.log(`  Fetching: ${url.slice(0, 100)}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  return page.evaluate(() => {
    const selectors = [
      '.job-description', '.jobDescription', '.offer-description',
      '[class*="description"]', '[class*="job-detail"]',
      '.content', 'article', 'main',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim().length > 300) return el.innerText.trim();
    }
    return document.body.innerText.trim();
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

  let ok = 0, fail = 0;

  for (const target of TARGETS) {
    console.log(`\n[ja=${target.id}] ${target.company} — ${target.title}`);
    try {
      const jobUrl = await extractJobLinkFromGmail(page, target.gmail_thread_url, target.match_texts);

      if (!jobUrl) {
        console.log('  ✗ No job link found in email — manual paste needed');
        fail++;
        continue;
      }

      const jdText = await fetchJD(page, jobUrl);

      if (jdText && jdText.length > 300) {
        await db.query(
          `UPDATE job_applications
           SET job_description = $1,
               job_url = CASE WHEN job_url = 'Not available' OR job_url IS NULL THEN $2 ELSE job_url END
           WHERE id = $3`,
          [jdText.slice(0, 8000), jobUrl, target.id]
        );
        console.log(`  ✓ Saved ${jdText.length} chars, url: ${jobUrl.slice(0, 60)}`);
        ok++;
      } else {
        console.log('  ✗ Page text too short — likely blocked');
        fail++;
      }
    } catch (e) {
      console.log(`  ✗ Error: ${e.message}`);
      fail++;
    }
  }

  console.log(`\nDone: ${ok} JDs fetched, ${fail} failed`);
  await browser.close();
  await db.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
