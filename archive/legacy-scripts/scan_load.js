const {Client}=require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const c=new Client({connectionString:'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'});
c.connect()
  .then(()=>Promise.all([
    c.query('SELECT COUNT(*) as n FROM listing_inbox WHERE parse_status=\'puppeteer_pending\' AND user_profile=\'zberlo\''),
    c.query('SELECT * FROM listing_inbox WHERE parse_status=\'pending\' AND user_profile=\'zberlo\' ORDER BY created_at ASC'),
    c.query('SELECT company FROM target_companies WHERE user_profile=\'zberlo\'')
  ]))
  .then(([pp,rows,tc])=>{
    console.log('PP:'+pp.rows[0].n);
    console.log('ROWS:'+JSON.stringify(rows.rows));
    console.log('TC:'+JSON.stringify(tc.rows.map(r=>r.company)));
    return c.end();
  })
  .catch(e=>{console.error(e.message);process.exit(1);});
