'use strict';
const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const db = new Client({ connectionString: cfg.supabase_connection_string });

async function run() {
  await db.connect();
  await db.query(
    `INSERT INTO job_applications
     (job_title,company,source,location,salary,priority,cv_approach,status,date_added,
      job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,
      job_description,listing_inbox_id,user_profile)
     VALUES ($1,$2,$3,$4,$5,'B','Standard','Potentially Apply',$6,$7,$8,'[]','[]',$9,$10,$11,null,$12,$13)`,
    [
      'Chargé d\'affaires mobilières et patrimoniales H/F', 'Inria', 'LinkedIn',
      'Grenoble', null, '2026-06-14',
      'Not available',
      'https://mail.google.com/mail/u/0/#all/19ed231a5c6b799a',
      'LinkedIn JYMBII',
      'Asset/property management role at Inria Grenoble (public research institute) — may carry accounting/financial scope; JD unavailable (LinkedIn blocked); verify before applying',
      false, 1013, 'zberlo'
    ]
  );
  await db.query('DELETE FROM review_queue WHERE id=469 AND user_profile=$1', ['zberlo']);
  console.log('Potentially Apply [B] rq=469: Inria Chargé d\'affaires mobilières');
  await db.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
