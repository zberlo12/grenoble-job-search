/**
 * One-time migration: Notion → Supabase
 * Migrates all rows from all Notion databases into Supabase tables.
 * Run: node migrate_notion.js
 */

const https = require('https');
const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');

const cfg = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'config.json'), 'utf8'));
const NOTION_TOKEN = cfg.notion_api_token;
const PG_CONN = cfg.supabase_connection_string;

const DB_IDS = {
  job_applications:   '09b29be7bb764b16b173321f469b01e2',
  review_queue:       '14f85319b99341ec842e597c6d73da5e',
  target_companies:   '108a671739474a83a1b53f1eb8d54de4',
  open_todos:         'e04c0c16b774448b86b0c309a684190b',
  france_travail_log: '950a9f1b488e47b09ef7cd7f9024fcf7',
};

// --- Notion API helpers ---

function notionRequest(path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.notion.com',
      path,
      method: body ? 'POST' : 'GET',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
    };
    const req = https.request(options, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve(JSON.parse(raw)));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function fetchAllPages(dbId) {
  const rows = [];
  let cursor = undefined;
  while (true) {
    const body = cursor ? { start_cursor: cursor } : {};
    const resp = await notionRequest(`/v1/databases/${dbId}/query`, body);
    if (resp.object === 'error') throw new Error(`Notion error: ${resp.message}`);
    rows.push(...resp.results);
    if (!resp.has_more) break;
    cursor = resp.next_cursor;
  }
  return rows;
}

// --- Property extractors ---

const txt  = (p, k) => p[k]?.rich_text?.[0]?.plain_text ?? p[k]?.title?.[0]?.plain_text ?? null;
const sel  = (p, k) => p[k]?.select?.name ?? null;
const msel = (p, k) => JSON.stringify((p[k]?.multi_select ?? []).map(o => o.name));
const dt   = (p, k) => p[k]?.date?.start?.split('T')[0] ?? null;
const url  = (p, k) => p[k]?.url ?? null;
const chk  = (p, k) => p[k]?.checkbox ?? false;
const num  = (p, k) => p[k]?.number ?? null;

// --- Table-specific transformers ---

function toJobApplication(page) {
  const p = page.properties;
  return {
    job_title:          txt(p, 'Job Title'),
    company:            txt(p, 'Company') || 'Not disclosed',
    source:             sel(p, 'Source'),
    location:           txt(p, 'Location'),
    salary:             txt(p, 'Salary'),
    priority:           sel(p, 'Priority'),
    cv_approach:        sel(p, 'CV Approach'),
    status:             sel(p, 'Status') || 'To Assess',
    date_added:         dt(p,  'Date Added') || new Date().toISOString().split('T')[0],
    date_applied:       dt(p,  'Date Applied'),
    date_response:      dt(p,  'Date Response'),
    job_url:            url(p, 'Job URL'),
    docs_url:           url(p, 'Docs URL'),
    gmail_thread_url:   url(p, 'Gmail Thread URL'),
    red_flags:          msel(p,'Red Flags'),
    missing_info:       msel(p,'Missing Info'),
    alert_keyword:      txt(p, 'Alert Keyword'),
    notes:              txt(p, 'Notes'),
    english:            chk(p, 'English'),
    application_method: sel(p, 'Application Method'),
    rejection_reason:   sel(p, 'Rejection Reason'),
    doc_language:       sel(p, 'Doc Language'),
    job_description:    txt(p, 'Job Description'),
  };
}

function toReviewQueue(page) {
  const p = page.properties;
  return {
    job_title:        txt(p, 'Job Title'),
    company:          txt(p, 'Company') || 'Not disclosed',
    source:           sel(p, 'Source'),
    location:         txt(p, 'Location'),
    salary:           txt(p, 'Salary'),
    priority:         sel(p, 'Priority'),
    status:           sel(p, 'Status') || 'Needs Info',
    date_added:       dt(p,  'Date Added'),
    job_url:          url(p, 'Job URL'),
    gmail_thread_url: url(p, 'Gmail Thread URL'),
    red_flags:        msel(p,'Red Flags'),
    missing_info:     msel(p,'Missing Info'),
    alert_keyword:    txt(p, 'Alert Keyword'),
    notes:            txt(p, 'Notes'),
    english:          chk(p, 'English'),
    job_description:  txt(p, 'Job Description'),
  };
}

function toTargetCompany(page) {
  const p = page.properties;
  return {
    company:      txt(p, 'Company'),
    tier:         sel(p, 'Tier'),
    sector:       txt(p, 'Sector'),
    location:     txt(p, 'Location'),
    careers_url:  url(p, 'Careers URL'),
    last_checked: dt(p,  'Last Checked'),
    notes:        txt(p, 'Notes'),
  };
}

function toOpenTodo(page) {
  const p = page.properties;
  return {
    task:     txt(p, 'Task'),
    category: sel(p, 'Category'),
    priority: sel(p, 'Priority'),
    due_date: dt(p,  'Due Date'),
    done:     chk(p, 'Done'),
    notes:    txt(p, 'Notes'),
  };
}

function toFranceTravailLog(page) {
  const p = page.properties;
  return {
    action:             txt(p, 'Action'),
    date:               dt(p,  'Date') || new Date().toISOString().split('T')[0],
    categorie:          sel(p, 'Catégorie') || sel(p, 'Categorie'),
    priorite:           sel(p, 'Priorité') || sel(p, 'Priorite'),
    entreprise:         txt(p, 'Entreprise'),
    poste_sujet:        txt(p, 'Poste / Sujet'),
    mode:               sel(p, 'Mode'),
    source:             txt(p, 'Source'),
    statut_declaration: sel(p, 'Statut déclaration') || sel(p, 'Statut declaration') || 'À déclarer',
    notes:              txt(p, 'Notes'),
  };
}

// --- Generic bulk insert ---

async function bulkInsert(client, table, rows) {
  if (rows.length === 0) { console.log(`  ${table}: 0 rows (skipped)`); return; }
  const cols = Object.keys(rows[0]);
  let inserted = 0;
  for (const row of rows) {
    const vals = cols.map(c => row[c]);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
    try {
      await client.query(query, vals);
      inserted++;
    } catch (e) {
      console.error(`  ${table}: insert error — ${e.message.split('\n')[0]}`);
      console.error('  Row:', JSON.stringify(row).slice(0, 200));
    }
  }
  console.log(`  ${table}: ${inserted}/${rows.length} rows inserted`);
}

// --- Main ---

async function main() {
  const pg = new Client({ connectionString: PG_CONN });
  await pg.connect();
  console.log('PostgreSQL connected.\n');

  try {
    // 1. job_applications
    console.log('Fetching job_applications from Notion...');
    const jaPages = await fetchAllPages(DB_IDS.job_applications);
    console.log(`  Found ${jaPages.length} pages`);
    const jaRows = jaPages.map(toJobApplication).filter(r => r.job_title);
    await bulkInsert(pg, 'job_applications', jaRows);

    // 2. review_queue
    console.log('\nFetching review_queue from Notion...');
    const rqPages = await fetchAllPages(DB_IDS.review_queue);
    console.log(`  Found ${rqPages.length} pages`);
    const rqRows = rqPages.map(toReviewQueue).filter(r => r.job_title);
    await bulkInsert(pg, 'review_queue', rqRows);

    // 3. target_companies
    console.log('\nFetching target_companies from Notion...');
    const tcPages = await fetchAllPages(DB_IDS.target_companies);
    console.log(`  Found ${tcPages.length} pages`);
    const tcRows = tcPages.map(toTargetCompany).filter(r => r.company);
    await bulkInsert(pg, 'target_companies', tcRows);

    // 4. open_todos
    console.log('\nFetching open_todos from Notion...');
    const todoPages = await fetchAllPages(DB_IDS.open_todos);
    console.log(`  Found ${todoPages.length} pages`);
    const todoRows = todoPages.map(toOpenTodo).filter(r => r.task);
    await bulkInsert(pg, 'open_todos', todoRows);

    // 5. france_travail_log
    console.log('\nFetching france_travail_log from Notion...');
    const ftPages = await fetchAllPages(DB_IDS.france_travail_log);
    console.log(`  Found ${ftPages.length} pages`);
    const ftRows = ftPages.map(toFranceTravailLog).filter(r => r.action);
    await bulkInsert(pg, 'france_travail_log', ftRows);

    // Summary counts
    console.log('\n--- Final counts ---');
    for (const t of ['job_applications','review_queue','target_companies','open_todos','france_travail_log']) {
      const r = await pg.query(`SELECT COUNT(*) FROM ${t}`);
      console.log(`  ${t}: ${r.rows[0].count} rows`);
    }

  } finally {
    await pg.end();
    console.log('\nDone.');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
