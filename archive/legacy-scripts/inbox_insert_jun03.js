'use strict';

const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const CONN = 'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';
const USER_PROFILE = 'zberlo';
const TU = 'https://mail.google.com/mail/u/0/#all/';

// New listings found in Gmail job alerts May 31 – Jun 3 2026
// Duplicates already excluded: Siemens Energy CPM, Korus CDG, Roche Inventory, Busch GPC, SAF Aerogroup CDG
const LISTINGS = [
  // --- LINKEDIN PARSED LISTINGS ---
  {
    tid: '19e8751c3faff741', src: 'LinkedIn', ak: 'Responsable Administratif Financier OR RAF',
    title: 'Cost Controller', co: 'PIMAN Group', loc: 'Grenoble (38)', sal: null,
    url: 'https://www.linkedin.com/jobs/view/4422829528/', ct: null,
    ps: 'pending', pn: null, en: false,
    rs: 'PIMAN Group — Grenoble (38) — Cost Controller',
    rb: null, parseDate: '2026-06-02',
  },
  {
    tid: '19e8751c3faff741', src: 'LinkedIn', ak: 'Responsable Administratif Financier OR RAF',
    title: 'Responsable comptable H/F', co: 'Not disclosed', loc: 'Tullins (38)', sal: null,
    url: 'https://www.linkedin.com/jobs/view/4421809155/', ct: null,
    ps: 'pending', pn: 'France Travail posting — verify employer + salary', en: false,
    rs: 'Not disclosed (France Travail) — Tullins (38) — Responsable comptable H/F',
    rb: null, parseDate: '2026-06-02',
  },
  {
    tid: '19e8751c3faff741', src: 'LinkedIn', ak: 'Responsable Administratif Financier OR RAF',
    title: 'Credit Manager (h/f)', co: 'Not disclosed', loc: 'Meylan (38)', sal: null,
    url: 'https://www.linkedin.com/jobs/view/4421688715/', ct: null,
    ps: 'pending', pn: 'France Travail posting — verify employer + salary', en: false,
    rs: 'Not disclosed (France Travail) — Meylan (38) — Credit Manager',
    rb: null, parseDate: '2026-06-02',
  },
  {
    tid: '19e87bf652b78ee3', src: 'LinkedIn', ak: 'Contrôleur de Gestion OR CDG Industriel',
    title: 'Contrôleur.euse de gestion', co: 'Soitec', loc: 'Bernin (38)', sal: null,
    url: 'https://www.linkedin.com/jobs/view/4418776241/', ct: null,
    ps: 'pending', pn: null, en: false,
    rs: 'Soitec — Bernin (38) — Contrôleur de gestion',
    rb: null, parseDate: '2026-06-02',
  },
  {
    tid: '19e8d53d0e59e5f1', src: 'LinkedIn', ak: 'Responsable Administratif et Financier',
    title: 'Responsable administratif et financier H/F', co: 'Not disclosed', loc: 'Saint-Ondras (38)', sal: null,
    url: 'https://www.linkedin.com/jobs/view/4422451799/', ct: null,
    ps: 'pending', pn: 'France Travail posting — verify employer + salary', en: false,
    rs: 'Not disclosed (France Travail) — Saint-Ondras (38) — RAF H/F',
    rb: null, parseDate: '2026-06-03',
  },
  {
    tid: '19e830733c5dfeed', src: 'LinkedIn', ak: 'Finance Manager OR Financial Controller',
    title: 'Strategic Finance Manager', co: 'Jobgether', loc: 'France (remote)', sal: null,
    url: 'https://www.linkedin.com/jobs/view/4419056671/', ct: null,
    ps: 'pending', pn: 'Job board aggregator — verify actual employer, scope, salary', en: true,
    rs: 'Jobgether — France remote — Strategic Finance Manager',
    rb: null, parseDate: '2026-06-01',
  },
  {
    tid: '19e87bf652b78ee3', src: 'LinkedIn', ak: 'Contrôleur de Gestion OR CDG Industriel',
    title: 'Contrôleur de Gestion Industriel F/H', co: 'Sarah Moraschetti - Conseil', loc: 'Saint-Étienne', sal: '60000-65000',
    url: 'https://www.linkedin.com/jobs/view/4423227285/', ct: null,
    ps: 'pending', pn: null, en: false,
    rs: 'Sarah Moraschetti - Conseil — Saint-Étienne — CDG Industriel €60-65K',
    rb: null, parseDate: '2026-06-02',
  },
  // --- CADREMPLOI / APEC MANUAL CHECK ---
  {
    tid: '19e8178b6bc0c0c9', src: 'APEC', ak: 'Finance / RAF / DAF',
    title: 'Various Finance roles', co: 'Not disclosed', loc: null, sal: null,
    url: null, ct: null,
    ps: 'manual_check', pn: '2 offres Apec du 01/06/2026 — open Gmail to review listings', en: false,
    rs: 'APEC digest — 2 offres du 01/06/2026',
    rb: null, parseDate: '2026-06-01',
  },
  {
    tid: '19e877cb6e646964', src: 'APEC', ak: 'Finance / RAF / DAF',
    title: 'Various Finance roles', co: 'Not disclosed', loc: null, sal: null,
    url: null, ct: null,
    ps: 'manual_check', pn: '8 offres Apec du 02/06/2026 — open Gmail to review listings', en: false,
    rs: 'APEC digest — 8 offres du 02/06/2026',
    rb: null, parseDate: '2026-06-02',
  },
  {
    tid: '19e82aa401984c7c', src: 'Cadremploi', ak: 'Responsable Administratif et Financier OR RAF',
    title: 'Responsable Administratif et Financier', co: 'Not disclosed', loc: null, sal: null,
    url: null, ct: null,
    ps: 'manual_check', pn: 'Cadremploi 1 offre RAF — 01/06/2026 — HTML-only, open Gmail to review', en: false,
    rs: 'Cadremploi — 1 offre RAF 01/06/2026',
    rb: null, parseDate: '2026-06-01',
  },
  {
    tid: '19e87deb9138871d', src: 'Cadremploi', ak: 'CDG OR RAF OR Credit Manager OR Achats',
    title: 'Various Finance/Gestion roles', co: 'Not disclosed', loc: null, sal: null,
    url: null, ct: null,
    ps: 'manual_check', pn: 'Cadremploi multi-alert 02/06/2026 (CDG, RAF, Credit, Achats) — HTML-only, open Gmail', en: false,
    rs: 'Cadremploi — multi-alert 02/06/2026',
    rb: null, parseDate: '2026-06-02',
  },
  {
    tid: '19e8e4eaa0d9256a', src: 'Cadremploi', ak: 'Responsable Administratif et Financier OR RAF',
    title: 'Responsable Administratif et Financier', co: 'Not disclosed', loc: null, sal: null,
    url: null, ct: null,
    ps: 'manual_check', pn: 'Cadremploi 1 offre RAF — 03/06/2026 — HTML-only, open Gmail to review', en: false,
    rs: 'Cadremploi — 1 offre RAF 03/06/2026',
    rb: null, parseDate: '2026-06-03',
  },
  {
    tid: '19e8d06cfd3f306e', src: 'Cadremploi', ak: 'Financial Controller OR Finance Manager',
    title: 'Financial Controller / Finance Manager', co: 'Not disclosed', loc: null, sal: null,
    url: null, ct: null,
    ps: 'manual_check', pn: 'Cadremploi 3 offres FC/Finance Manager — 03/06/2026 — HTML-only, open Gmail', en: true,
    rs: 'Cadremploi Financial Controller alert 03/06/2026',
    rb: null, parseDate: '2026-06-03',
  },
];

// Analysis for pending rows
const ANALYSIS = {
  'https://www.linkedin.com/jobs/view/4422829528/': {
    dest: 'review_queue', status: 'Needs Info', priority: 'B',
    missing: ['Salary', 'Hybrid policy'],
    notes: 'QUEUED: Cost Controller, Grenoble (Green zone). Missing salary and hybrid info.',
    rf: [],
  },
  'https://www.linkedin.com/jobs/view/4421809155/': {
    dest: 'review_queue', status: 'Needs Info', priority: 'B',
    missing: ['Company name', 'Salary', 'Hybrid policy'],
    notes: 'QUEUED: Responsable comptable, Tullins (Yellow ~30km). France Travail posting — employer and salary unknown.',
    rf: [],
  },
  'https://www.linkedin.com/jobs/view/4421688715/': {
    dest: 'review_queue', status: 'Needs Info', priority: 'B',
    missing: ['Company name', 'Salary'],
    notes: 'QUEUED: Credit Manager, Meylan (Green zone). France Travail posting — employer and salary unknown.',
    rf: [],
  },
  'https://www.linkedin.com/jobs/view/4418776241/': {
    dest: 'review_queue', status: 'Needs Info', priority: 'B',
    missing: ['Salary'],
    notes: 'QUEUED: CDG at Soitec, Bernin (Green zone ~15km). Major semiconductor employer. Missing salary.',
    rf: [],
  },
  'https://www.linkedin.com/jobs/view/4422451799/': {
    dest: 'review_queue', status: 'Needs Info', priority: 'B',
    missing: ['Company name', 'Salary', 'Hybrid policy'],
    notes: 'QUEUED: RAF H/F, Saint-Ondras (38 ~40km, Yellow zone). France Travail posting — employer, salary, hybrid unknown.',
    rf: [],
  },
  'https://www.linkedin.com/jobs/view/4419056671/': {
    dest: 'review_queue', status: 'Needs Info', priority: 'B',
    missing: ['Company name', 'Salary', 'Scope'],
    notes: 'QUEUED: Strategic Finance Manager, remote France. Jobgether aggregator — actual employer and scope unknown.',
    rf: [],
  },
  'https://www.linkedin.com/jobs/view/4423227285/': {
    dest: 'job_applications', status: 'Dismissed', priority: 'C',
    missing: [],
    notes: 'Auto-dismissed: Far location (Saint-Étienne, ~1h45 from Grenoble)',
    rf: ['Far location'],
    cv_approach: null,
  },
};

async function run() {
  const client = new Client({ connectionString: CONN });
  await client.connect();

  const counters = { pending_inserted: 0, manual_inserted: 0, needs_info: 0, to_assess: 0, dismissed: 0, new_companies: [] };

  const { rows: existingCos } = await client.query(
    'SELECT LOWER(company) as co FROM target_companies WHERE user_profile=$1', [USER_PROFILE]
  );
  const existingSet = new Set(existingCos.map(r => r.co));

  for (const row of LISTINGS) {
    const { rows: [li] } = await client.query(`
      INSERT INTO listing_inbox
        (parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
         job_title, company, location, salary, job_url, parse_status, parse_notes,
         english, raw_snippet, raw_body, user_profile)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING id
    `, [
      row.parseDate, row.tid, TU + row.tid, row.src, row.ak,
      row.title, row.co, row.loc, row.sal, row.url, row.ps, row.pn,
      row.en, row.rs, row.rb, USER_PROFILE
    ]);

    row.ps === 'manual_check' ? counters.manual_inserted++ : counters.pending_inserted++;

    const analysis = row.url ? ANALYSIS[row.url] : null;

    if (row.ps === 'manual_check') {
      await client.query(`
        INSERT INTO review_queue
          (job_title, company, source, location, salary, priority, status, date_added,
           job_url, gmail_thread_url, red_flags, missing_info, alert_keyword, notes,
           english, listing_inbox_id, user_profile)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      `, [
        row.title, row.co, row.src, row.loc, null, 'B', 'Needs Info', row.parseDate,
        row.url, TU + row.tid, JSON.stringify([]), JSON.stringify(['Full JD']),
        row.ak, 'UNREADABLE: ' + (row.pn || row.src) + ' — open Gmail link to review and paste JD',
        row.en, li.id, USER_PROFILE
      ]);
      counters.needs_info++;
    } else if (analysis) {
      if (analysis.dest === 'review_queue') {
        await client.query(`
          INSERT INTO review_queue
            (job_title, company, source, location, salary, priority, status, date_added,
             job_url, gmail_thread_url, red_flags, missing_info, alert_keyword, notes,
             english, listing_inbox_id, user_profile)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        `, [
          row.title, row.co, row.src, row.loc, row.sal, analysis.priority,
          analysis.status, row.parseDate, row.url, TU + row.tid,
          JSON.stringify(analysis.rf), JSON.stringify(analysis.missing),
          row.ak, analysis.notes, row.en, li.id, USER_PROFILE
        ]);
        analysis.status === 'Needs Info' ? counters.needs_info++ : counters.to_assess++;
      } else {
        await client.query(`
          INSERT INTO job_applications
            (job_title, company, source, location, salary, priority, cv_approach, status, date_added,
             job_url, gmail_thread_url, red_flags, missing_info, alert_keyword, notes,
             english, listing_inbox_id, user_profile)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        `, [
          row.title, row.co, row.src, row.loc, row.sal, analysis.priority,
          analysis.cv_approach || null, analysis.status, row.parseDate,
          row.url, TU + row.tid, JSON.stringify(analysis.rf), JSON.stringify(analysis.missing),
          row.ak, analysis.notes, row.en, li.id, USER_PROFILE
        ]);
        counters.dismissed++;
      }
    }

    await client.query(
      'UPDATE listing_inbox SET parse_status=$1 WHERE id=$2 AND user_profile=$3',
      ['processed', li.id, USER_PROFILE]
    );

    // New company tracking (non-agency, non-dismissed, not already known)
    if (analysis && analysis.dest !== 'job_applications' &&
        row.co && row.co !== 'Not disclosed' && !row.co.toLowerCase().includes('jobgether') &&
        !row.co.toLowerCase().includes('france travail') &&
        !existingSet.has(row.co.toLowerCase())) {
      existingSet.add(row.co.toLowerCase());
      counters.new_companies.push(row.co);
      await client.query(
        'INSERT INTO target_companies (company, tier, location, notes, user_profile) VALUES ($1,$2,$3,$4,$5)',
        [row.co, 'C', row.loc || null, 'Auto-added from Jun 3 catchup scan', USER_PROFILE]
      );
    }
  }

  const total = counters.pending_inserted + counters.manual_inserted;
  const pursued = counters.needs_info + counters.to_assess;

  const digestLines = [
    `Job Scan Digest — 2026-06-03 (catchup May 31–Jun 3)`,
    `════════════════════════════════════════════════════`,
    ``,
    `${total} new listings · ${pursued} pursued · ${counters.dismissed} dismissed`,
    `(+7 duplicates skipped: Siemens Energy CPM, Korus CDG, Roche Inventory, Busch GPC x2, SAF Aerogroup x2)`,
    ``,
    `career-ops (Ashby): 1 pre-imported (Alan Financial Controller — already queued)`,
    ``,
    `By Priority`,
    `  A → To Apply:      0`,
    `  B/C → To Assess:   0`,
    `  Needs Info:        ${counters.needs_info}`,
    `  Dismissed:         ${counters.dismissed}  reason: Far location (Saint-Étienne)`,
    ``,
    `Sources: LinkedIn 7 · APEC 2 · Cadremploi 4`,
    ``,
    `Needs Info Queue (added this catchup)`,
    `  • Cost Controller @ PIMAN Group — Grenoble (Green) — missing: Salary, Hybrid`,
    `    (Gmail: ${TU}19e8751c3faff741)`,
    `  • Responsable comptable H/F @ Not disclosed — Tullins (Yellow ~30km) — missing: Company, Salary, Hybrid`,
    `    (Gmail: ${TU}19e8751c3faff741)`,
    `  • Credit Manager (h/f) @ Not disclosed — Meylan (Green) — missing: Company, Salary`,
    `    (Gmail: ${TU}19e8751c3faff741)`,
    `  • Contrôleur.euse de gestion @ Soitec — Bernin (Green ~15km) — missing: Salary`,
    `    (Gmail: ${TU}19e87bf652b78ee3)`,
    `  • RAF H/F @ Not disclosed — Saint-Ondras (38, Yellow ~40km) — missing: Company, Salary, Hybrid`,
    `    (Gmail: ${TU}19e8d53d0e59e5f1)`,
    `  • Strategic Finance Manager @ Jobgether — Remote France — missing: Company, Salary, Scope`,
    `    (Gmail: ${TU}19e830733c5dfeed)`,
    `  — UNREADABLE (open Gmail → paste JD into /job-review):`,
    `  • APEC 2 offres du 01/06/2026  (Gmail: ${TU}19e8178b6bc0c0c9)`,
    `  • APEC 8 offres du 02/06/2026  (Gmail: ${TU}19e877cb6e646964)`,
    `  • Cadremploi 1 offre RAF 01/06  (Gmail: ${TU}19e82aa401984c7c)`,
    `  • Cadremploi multi CDG/RAF/Credit/Achats 02/06  (Gmail: ${TU}19e87deb9138871d)`,
    `  • Cadremploi 1 offre RAF 03/06  (Gmail: ${TU}19e8e4eaa0d9256a)`,
    `  • Cadremploi Financial Controller 03/06  (Gmail: ${TU}19e8d06cfd3f306e)`,
    ``,
    counters.new_companies.length > 0
      ? `New companies → target list: ${counters.new_companies.length}  (${counters.new_companies.join(', ')})`
      : `New companies → target list: 0`,
    ``,
    `scan_archive: written ✅`,
  ].join('\n');

  await client.query(`
    INSERT INTO scan_archive
      (scan_date, digest_text, total_found, potentially_apply, needs_info, to_assess, dismissed, user_profile)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (scan_date, user_profile) DO UPDATE SET
      digest_text=EXCLUDED.digest_text, total_found=EXCLUDED.total_found,
      potentially_apply=EXCLUDED.potentially_apply, needs_info=EXCLUDED.needs_info,
      to_assess=EXCLUDED.to_assess, dismissed=EXCLUDED.dismissed
  `, ['2026-06-03', digestLines, total, 0, counters.needs_info, counters.to_assess, counters.dismissed, USER_PROFILE]);

  await client.end();
  console.log(digestLines);
  console.log('\nINSERT counters:', JSON.stringify(counters, null, 2));
}

run().catch(e => { console.error(e.message); process.exit(1); });
