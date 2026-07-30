const {Client}=require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const c=new Client({connectionString:'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'});
const sql=`SELECT id, job_title, company, source, location, salary, priority, status, date_added, job_url, gmail_thread_url, red_flags, missing_info, alert_keyword, notes, english FROM review_queue WHERE user_profile = $1 ORDER BY CASE status WHEN 'Needs Info' THEN 1 ELSE 2 END, date_added ASC`;
c.connect()
  .then(()=>c.query(sql,['zberlo']))
  .then(r=>{console.log(JSON.stringify(r.rows,null,2));return c.end();})
  .catch(e=>{console.error(e.message);process.exit(1);});
