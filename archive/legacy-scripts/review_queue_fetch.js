'use strict';
const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const db = new Client({ connectionString: cfg.supabase_connection_string });
const USER = cfg.user.profile_id;

async function main() {
  await db.connect();

  const pp = await db.query(
    `SELECT COUNT(*) as n FROM listing_inbox WHERE parse_status='puppeteer_pending' AND user_profile=$1`, [USER]
  );
  console.log('PP_PENDING:' + pp.rows[0].n);

  const rq = await db.query(
    `SELECT id, job_title, company, source, location, salary, priority, status,
            date_added, job_url, gmail_thread_url, red_flags, missing_info,
            alert_keyword, notes, english
     FROM review_queue
     WHERE user_profile=$1
     ORDER BY CASE status WHEN 'Needs Info' THEN 1 ELSE 2 END, date_added ASC`,
    [USER]
  );
  console.log('RQ_COUNT:' + rq.rows.length);
  for (const r of rq.rows) {
    const d = r.date_added ? r.date_added.toISOString().slice(0,10) : '?';
    console.log(`RQ|${r.id}|${r.status}|${r.priority}|${d}|${r.source}|${r.job_title}|${r.company}|${r.location}|${r.salary}|${r.job_url}|${r.gmail_thread_url}|${JSON.stringify(r.red_flags)}|${JSON.stringify(r.missing_info)}|${r.notes}|${r.english}`);
  }

  const pa = await db.query(
    `SELECT id, job_title, company, location, salary, priority, red_flags, notes,
            job_url, gmail_thread_url, date_added,
            CASE WHEN job_description IS NULL OR job_description='' THEN false ELSE true END as has_jd
     FROM job_applications
     WHERE status='Potentially Apply' AND user_profile=$1
     ORDER BY CASE priority WHEN 'A' THEN 1 WHEN 'B' THEN 2 ELSE 3 END, date_added ASC`,
    [USER]
  );
  console.log('PA_COUNT:' + pa.rows.length);
  for (const r of pa.rows) {
    const d = r.date_added ? r.date_added.toISOString().slice(0,10) : '?';
    console.log(`PA|${r.id}|${r.priority}|${d}|${r.job_title}|${r.company}|${r.location}|${r.salary}|${r.job_url}|${r.gmail_thread_url}|${JSON.stringify(r.red_flags)}|${r.notes}|${r.has_jd}`);
  }

  await db.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
