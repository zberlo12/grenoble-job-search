'use strict';
const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const db = new Client({ connectionString: cfg.supabase_connection_string });
db.connect().then(async () => {
  const res = await db.query(
    `UPDATE listing_inbox
     SET parse_status = 'puppeteer_pending',
         parse_notes  = 'Reset for retry after browser crash'
     WHERE id BETWEEN 998 AND 1024
       AND user_profile = $1
       AND parse_status = 'manual_check'
     RETURNING id`,
    [cfg.user.profile_id]
  );
  console.log('Reset', res.rowCount, 'rows back to puppeteer_pending');
  await db.end();
}).catch(e => { console.error(e); process.exit(1); });
