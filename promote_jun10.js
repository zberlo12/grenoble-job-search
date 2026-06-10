const { Client } = require(process.env.PG_MODULE);
const c = new Client({ connectionString: process.env.PG_CONN });

async function run() {
  await c.connect();

  let r = await c.query(
    "INSERT INTO job_applications (job_title,company,source,location,salary,priority,cv_approach,status,date_added,job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,listing_inbox_id,user_profile) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id",
    ['Controleur de Gestion Operationnelle H/F','STEF','Direct','Vaulx-Milieu (38)',null,'B','costcontrol-fr','To Apply','2026-06-08','Not available','https://mail.google.com/mail/u/0/#all/19eab95551345d3a',JSON.stringify([]),JSON.stringify([]),'Contrôleur de Gestion','STEF logistics/food distribution, Vaulx-Milieu (Green zone, ~15km east Grenoble). Operational CDG role. Salary unknown — clarify at first contact.',false,439,'zberlo']
  );
  console.log('STEF id:' + r.rows[0].id);

  r = await c.query(
    "INSERT INTO job_applications (job_title,company,source,location,salary,priority,cv_approach,status,date_added,job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,listing_inbox_id,user_profile) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id",
    ['Responsable Comptable H/F','Brun Invest','Direct','Eybens (38)','50000-60000','B','costcontrol-fr','To Apply','2026-06-08','Not available','https://mail.google.com/mail/u/0/#all/19ea6e27387a19d4',JSON.stringify(['Low salary']),JSON.stringify([]),'Responsable Comptable','Brun Invest Responsable Comptable, Eybens (Green zone). CDI €50-60K — below €65K target, user approved. Apply and negotiate salary.',false,438,'zberlo']
  );
  console.log('BRUN_INVEST id:' + r.rows[0].id);

  r = await c.query(
    "INSERT INTO job_applications (job_title,company,source,location,salary,priority,cv_approach,status,date_added,job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,user_profile) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id",
    ['Responsable Comptable et Trésorerie H/F','Confidentiel (via Michael Page)','Direct','Meylan (38)','65000-85000','A','costcontrol-fr','To Apply','2026-06-10','Not available','https://mail.google.com/mail/u/0/#all/19ea6e27387a19d4',JSON.stringify([]),JSON.stringify([]),'Responsable Comptable','Responsable Comptable & Trésorerie via Michael Page, Meylan (Green zone). CDI. €65-85K — strong salary match. Treasury + accounting management scope.',false,'zberlo']
  );
  console.log('MICHAEL_PAGE id:' + r.rows[0].id);

  r = await c.query(
    "INSERT INTO job_applications (job_title,company,source,location,salary,priority,cv_approach,status,date_added,job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,listing_inbox_id,user_profile) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id",
    ['Directeur administratif et financier/Directrice administrative et financière','Les Phénix','LinkedIn','Nyons',null,'B','raf-fr','To Apply','2026-06-06','https://www.linkedin.com/jobs/view/4418801874/','https://mail.google.com/mail/u/0/#all/19ea2c984b136415',JSON.stringify([]),JSON.stringify(['Salary','Hybrid policy']),'LinkedIn','Les Phénix DAF, Nyons (Drôme, ~1h30). On-site per LinkedIn. No salary — apply and clarify hybrid + compensation.',false,435,'zberlo']
  );
  console.log('LES_PHENIX id:' + r.rows[0].id);

  await c.query("UPDATE review_queue SET status='Potentially Apply', notes=notes||' — PROMOTED Jun 10' WHERE id=ANY($1) AND user_profile='zberlo'", [[435,438,439]]);
  console.log('DONE');
  await c.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
