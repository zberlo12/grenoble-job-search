const {Client}=require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const c=new Client({connectionString:'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'});
c.connect()
  .then(()=>c.query(`SELECT id, job_title, company, status, priority, date_added, date_applied, job_url, notes FROM job_applications WHERE user_profile='zberlo' AND (company ILIKE '%selescope%' OR job_title ILIKE '%CFO%' OR job_title ILIKE '%LBO%') ORDER BY date_added DESC`))
  .then(r=>{console.log(JSON.stringify(r.rows,null,2));return c.end();})
  .catch(e=>{console.error(e.message);process.exit(1);});
