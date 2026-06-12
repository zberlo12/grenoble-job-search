// Backfills listing_inbox_id on job_applications rows where it is null.
// Run with: node backfill_listing_inbox_id.js
// Reads credentials from config.json in the same directory.

const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const { Client } = require(config.pg_module_path);
const c = new Client({ connectionString: config.supabase_connection_string });

async function main() {
  await c.connect();
  console.log('Connected.');

  // Step 1: Get all null rows
  const { rows: nullRows } = await c.query(
    `SELECT id, job_title, company, gmail_thread_url, job_url, date_added
     FROM job_applications
     WHERE listing_inbox_id IS NULL AND user_profile = $1
     ORDER BY id ASC`,
    [config.user.profile_id]
  );
  console.log(`Found ${nullRows.length} rows with null listing_inbox_id.`);

  let rung1 = 0, rung2 = 0, rung3 = 0, sentinel = 0;
  const updates = [];

  for (const row of nullRows) {
    let found = null;

    // Rung 1: gmail_thread_url exact match
    if (row.gmail_thread_url) {
      const r = await c.query(
        `SELECT id FROM listing_inbox
         WHERE gmail_thread_url = $1 AND user_profile = $2
         ORDER BY id DESC LIMIT 1`,
        [row.gmail_thread_url, config.user.profile_id]
      );
      if (r.rows.length) { found = { id: r.rows[0].id, rung: 1 }; }
    }

    // Rung 2: job_url match
    if (!found && row.job_url && row.job_url !== 'Not available') {
      const r = await c.query(
        `SELECT id FROM listing_inbox
         WHERE (job_url = $1 OR raw_body ILIKE $2) AND user_profile = $3
         ORDER BY id DESC LIMIT 1`,
        [row.job_url, '%' + row.job_url + '%', config.user.profile_id]
      );
      if (r.rows.length) { found = { id: r.rows[0].id, rung: 2 }; }
    }

    // Rung 3: company name + date proximity (within 3 days)
    if (!found && row.company && row.company !== 'Not disclosed') {
      const r = await c.query(
        `SELECT id FROM listing_inbox
         WHERE (raw_body ILIKE $1 OR raw_snippet ILIKE $1)
           AND parse_date BETWEEN $2::date - interval '3 days' AND $2::date + interval '1 day'
           AND user_profile = $3
         ORDER BY ABS(EXTRACT(EPOCH FROM (parse_date - $2::timestamptz))) ASC
         LIMIT 1`,
        ['%' + row.company + '%', row.date_added, config.user.profile_id]
      );
      if (r.rows.length) { found = { id: r.rows[0].id, rung: 3 }; }
    }

    if (found) {
      updates.push({ id: row.id, inbox_id: found.id, rung: found.rung });
      if (found.rung === 1) rung1++;
      else if (found.rung === 2) rung2++;
      else rung3++;
    } else {
      updates.push({ id: row.id, inbox_id: null, rung: 0 });
      sentinel++;
    }
  }

  console.log(`Recovery: Rung1=${rung1}  Rung2=${rung2}  Rung3=${rung3}  Unresolvable=${sentinel}`);

  // Step 2: Insert one sentinel row for all unresolvable cases
  let sentinelId = null;
  if (sentinel > 0) {
    const r = await c.query(
      `INSERT INTO listing_inbox (parse_date, source, parse_status, parse_notes, raw_snippet, user_profile)
       VALUES ('2026-01-01', 'legacy', 'processed', 'LEGACY: pre-inbox-tracking — source email unresolvable', 'Legacy placeholder for pre-migration rows', $1)
       RETURNING id`,
      [config.user.profile_id]
    );
    sentinelId = r.rows[0].id;
    console.log(`Sentinel row inserted: listing_inbox.id = ${sentinelId}`);
  }

  // Step 3: Apply all updates
  for (const u of updates) {
    const inboxId = u.inbox_id !== null ? u.inbox_id : sentinelId;
    await c.query(
      `UPDATE job_applications SET listing_inbox_id = $1 WHERE id = $2 AND user_profile = $3`,
      [inboxId, u.id, config.user.profile_id]
    );
  }
  console.log(`Updated ${updates.length} rows.`);

  // Step 4: Verify
  const { rows: check } = await c.query(
    `SELECT COUNT(*) as n FROM job_applications WHERE listing_inbox_id IS NULL AND user_profile = $1`,
    [config.user.profile_id]
  );
  console.log(`Remaining nulls in job_applications: ${check[0].n}`);

  await c.end();
  console.log('Done. Now run: node add_not_null_constraint.js');
}

main().catch(e => { console.error(e.message); process.exit(1); });
