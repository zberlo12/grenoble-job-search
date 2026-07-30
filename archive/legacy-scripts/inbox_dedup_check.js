const {Client}=require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const c=new Client({connectionString:'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'});
const ids=['19f38968b8aecedb','19f388f287e47226','19f38802d0d62546','19f382129fd400e4','19f37d3fb53be97e','19f37b4635ac046a','19f376d35bf0b8f9','19f374572cb78633','19f36f9e0206f8a4','19f36f78ccc21720','19f36d78f513dbef','19f3683fcf9be19e','19f3683cf93da9cd','19f3669b7615eeee','19f35cd061a01f4e','19f35c98aeaf7a78'];
c.connect()
  .then(()=>c.query(`SELECT gmail_thread_id FROM listing_inbox WHERE gmail_thread_id=ANY($1) AND parse_date='2026-07-06' AND user_profile='zberlo'`,[ids]))
  .then(r=>{console.log(JSON.stringify(r.rows.map(x=>x.gmail_thread_id)));return c.end();})
  .catch(e=>{console.error(e.message);process.exit(1);});
