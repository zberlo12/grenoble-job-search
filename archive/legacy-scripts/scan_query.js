'use strict';
const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const db = new Client({ connectionString: cfg.supabase_connection_string });
const USER = cfg.user.profile_id;

async function main() {
  await db.connect();

  const days = await db.query(
    `SELECT to_char(parse_date, 'YYYY-MM-DD') as d, COUNT(*) as n FROM listing_inbox
     WHERE user_profile=$1 AND parse_date >= CURRENT_DATE - 9
     GROUP BY parse_date ORDER BY parse_date ASC`,
    [USER]
  );
  console.log('DAYS_WITH_ROWS:');
  for (const r of days.rows) {
    console.log(`${r.d}: ${r.n} rows`);
  }

  await db.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
