'use strict';
const {Client} = require(process.env.PG_MODULE);

const TABLES = [
  'listing_inbox',
  'job_applications',
  'review_queue',
  'target_companies',
  'scan_archive',
  'open_todos',
  'networking_contacts',
  'france_travail_log',
];

async function run() {
  const c = new Client({connectionString: process.env.PG_CONN});
  await c.connect();

  for (const table of TABLES) {
    try {
      await c.query(
        `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS user_profile TEXT NOT NULL DEFAULT 'zberlo'`
      );
      const {rows} = await c.query(`SELECT count(*) FROM ${table}`);
      console.log(`${table}: OK (${rows[0].count} rows set to 'zberlo')`);
    } catch (e) {
      console.error(`${table}: FAILED — ${e.message}`);
    }
  }

  const {rows} = await c.query(
    "SELECT table_name, column_name, column_default FROM information_schema.columns WHERE column_name='user_profile' AND table_schema='public' ORDER BY table_name"
  );
  console.log('\nVerification:');
  rows.forEach(r => console.log(`  ${r.table_name}.user_profile default='${r.column_default}'`));

  await c.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
