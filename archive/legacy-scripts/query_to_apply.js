const {Client}=require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const c=new Client({connectionString:'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'});
const sql=`SELECT id, job_title, company, location, salary, priority, cv_approach,
       red_flags, notes, job_url, gmail_thread_url, date_added, job_description
FROM job_applications
WHERE status = 'To Apply' AND user_profile = 'zberlo'
ORDER BY CASE priority WHEN 'A' THEN 1 WHEN 'B' THEN 2 ELSE 3 END, date_added ASC`;
c.connect()
  .then(()=>c.query(sql))
  .then(r=>{console.log(JSON.stringify(r.rows,null,2));return c.end();})
  .catch(e=>{console.error(e.message);process.exit(1);});
