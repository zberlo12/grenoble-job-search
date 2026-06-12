// Adds NOT NULL constraint + default to listing_inbox_id on job_applications and review_queue.
// Run AFTER backfill_listing_inbox_id.js has completed with 0 remaining nulls.
// Run with: node add_not_null_constraint.js

const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const { Client } = require(config.pg_module_path);
const c = new Client({ connectionString: config.supabase_connection_string });

async function main() {
  await c.connect();
  console.log('Connected.');

  // Verify no nulls remain before adding constraint
  const { rows: ja } = await c.query(
    `SELECT COUNT(*) as n FROM job_applications WHERE listing_inbox_id IS NULL AND user_profile = $1`,
    [config.user.profile_id]
  );
  const { rows: rq } = await c.query(
    `SELECT COUNT(*) as n FROM review_queue WHERE listing_inbox_id IS NULL AND user_profile = $1`,
    [config.user.profile_id]
  );

  if (parseInt(ja[0].n) > 0 || parseInt(rq[0].n) > 0) {
    console.error(`Cannot add constraint — nulls remain: job_applications=${ja[0].n}, review_queue=${rq[0].n}`);
    console.error('Run backfill_listing_inbox_id.js first.');
    process.exit(1);
  }

  // Get sentinel id (the legacy placeholder row)
  const { rows: sentinel } = await c.query(
    `SELECT id FROM listing_inbox WHERE source = 'legacy' AND user_profile = $1 ORDER BY id ASC LIMIT 1`,
    [config.user.profile_id]
  );
  const sentinelId = sentinel.length ? sentinel[0].id : null;
  if (!sentinelId) {
    console.error('No sentinel row found in listing_inbox. Run backfill_listing_inbox_id.js first.');
    process.exit(1);
  }
  console.log(`Using sentinel id=${sentinelId} as default.`);

  // Add NOT NULL + DEFAULT to job_applications
  await c.query(`ALTER TABLE job_applications ALTER COLUMN listing_inbox_id SET DEFAULT ${sentinelId}`);
  await c.query(`ALTER TABLE job_applications ALTER COLUMN listing_inbox_id SET NOT NULL`);
  console.log('job_applications.listing_inbox_id: NOT NULL + DEFAULT set.');

  // Add NOT NULL + DEFAULT to review_queue
  await c.query(`ALTER TABLE review_queue ALTER COLUMN listing_inbox_id SET DEFAULT ${sentinelId}`);
  await c.query(`ALTER TABLE review_queue ALTER COLUMN listing_inbox_id SET NOT NULL`);
  console.log('review_queue.listing_inbox_id: NOT NULL + DEFAULT set.');

  await c.end();
  console.log('Done. listing_inbox_id is now enforced on both tables.');
}

main().catch(e => { console.error(e.message); process.exit(1); });
