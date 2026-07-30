'use strict';
const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const db = new Client({ connectionString: cfg.supabase_connection_string });
const U = cfg.user.profile_id;

const rows = [
  // APEC manual_check
  ['2026-06-23','19ef34df231b35a8','APEC',null,null,null,null,null,null,null,'manual_check','APEC: 1 offre — check apec.fr manually','1 offre Apec du 23/06/2026','1 offre Apec du 23/06/2026 | Decouvrez votre selection d offres.',false],
  ['2026-06-20','19ee3ebafa773cf5','APEC',null,null,null,null,null,null,null,'manual_check','APEC: 21 offres (7 match criteria) — check apec.fr manually','21 offres Apec du 20/06/2026','21 offres Apec du 20/06/2026 | 7 offres correspondent a votre recherche',false],
  ['2026-06-19','19edeecc56f5da92','APEC',null,null,null,null,null,null,null,'manual_check','APEC: 7 offres (2 match criteria) — check apec.fr manually','7 offres Apec du 19/06/2026','7 offres Apec du 19/06/2026 | 2 offres correspondent a votre recherche',false],
  // Cadremploi puppeteer_pending
  ['2026-06-23','19ef40a43b5a6746','Cadremploi','Financial Controller OR Finance Manager',null,null,null,null,null,null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction','Financial Controller/Finance Manager — Cadremploi Jun 23','Et si vous modifiez vos criteres? | 3 offres Financial Controller OR Finance Manager — Cadremploi Jun 23',false],
  ['2026-06-23','19ef3e383ae18563','Cadremploi','Responsable Administratif et Financier OR RAF',null,null,null,null,null,null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction','RAF 2 offres — Cadremploi Jun 23','2 offres a ne rater! RAF OR Responsable Consolidation — Cadremploi Jun 23',false],
  ['2026-06-22','19eee619cd407b8d','Cadremploi','Responsable Administratif et Financier OR RAF',null,null,null,null,null,null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction','RAF 2 offres — Cadremploi Jun 22','2 offres a ne rater! RAF — Cadremploi Jun 22',false],
  ['2026-06-22','19eed861ac2b1b3c','Cadremploi','Responsable Administratif et Financier OR RAF',null,null,null,null,null,null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction','RAF DAF 2 nouvelles offres — Cadremploi Jun 22','2 nouvelles offres RAF OR DAF publiees semaine derniere — Cadremploi Jun 22',false],
  ['2026-06-21','19ee93b3bc9306da','Cadremploi','Controleur de Gestion OR DAF OR RAF',null,null,null,null,null,null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction','CdG DAF RAF offres — Cadremploi Jun 21','1 offre CdG + 1 offre DAF + 1 offre RAF — Cadremploi Jun 21',false],
  // HelloWork puppeteer_pending
  ['2026-06-23','19ef4d3ded2314a8','Direct','Controleur de Gestion','Controleur de Gestion Industriel Senior H/F','RESEAU TALENTS',null,null,null,null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction','Controleur de Gestion Industriel Senior H/F — RESEAU TALENTS','RESEAU TALENTS recrute un Controleur de Gestion Industriel Senior H/F — HelloWork Jun 23',false],
  ['2026-06-21','19ee9381cba48c45','Direct','Controleur de Gestion','Controleur de Gestion Groupe H/F','CDI Flex',null,null,null,null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction','Controleur de Gestion Groupe H/F — CDI Flex','CDI Flex recrute un Controleur de Gestion Groupe H/F — HelloWork Jun 21',false],
  // Howmet Aerospace direct
  ['2026-06-23','19ef4d1c6c157532','Direct','Controleur de Gestion','CONTROLEUR DE GESTION','Howmet Aerospace',null,null,null,null,'puppeteer_pending','Direct employer email HTML-only — queued for Puppeteer','CONTROLEUR DE GESTION — Howmet Aerospace Jun 23','Howmet Aerospace — nouvelles offres: CONTROLEUR DE GESTION — Jun 23',false],
  // LinkedIn pending (snippet-parsed)
  ['2026-06-23','19ef52e7ac1e42f3','LinkedIn','Controleur de Gestion','Controleur de Gestion H/F/X','SAF Aerogroup',null,null,null,null,'pending','Subject-parsed LinkedIn alert — verify location/salary','SAF Aerogroup — Controleur de Gestion H/F/X — LinkedIn Jun 23','SAF Aerogroup is hiring a Controleur de Gestion (H/F/X) | Posted 6/21/2026',false],
  ['2026-06-22','19eeebea9f828958','LinkedIn','Controleur de Gestion OR Pilote Financier','Project Administrative and Financial Manager (CPM)','Siemens Energy',null,null,null,null,'pending','Subject-parsed LinkedIn alert — verify location/salary','Siemens Energy — Project Admin Financial Manager CPM — LinkedIn Jun 22','Siemens Energy - Project Administrative and Financial Manager (CPM) posted 6/20/26',false],
  ['2026-06-21','19eec9936ecacee7','LinkedIn','Responsable Administratif et Financier','Responsable administratif et financier H/F','France Travail',null,'Grenoble area',null,null,'pending','Subject-parsed LinkedIn alert — verify location/salary','France Travail RAF H/F — LinkedIn Jun 21','France Travail - RAF H/F posted 6/19/26',false],
  ['2026-06-21','19eeb4fa1180282d','LinkedIn','Controleur de Gestion OR Pilote Financier','Directeur administratif et financier H/F','CDG Conseil',null,'Grenoble (38)',null,null,'pending','Subject-parsed LinkedIn alert — verify salary','CDG Conseil DAF — LinkedIn Jun 21','CDG Conseil - Directeur administratif et financier posted 6/20/26',false],
  // Indeed subject-parsed single jobs
  ['2026-06-23','19ef1d1fef043302','Indeed','Responsable Administratif Financier','Responsable Administratif et Financier F/H','Actual Talent',null,'Grenoble (38)',null,'CDI','pending','Subject-parsed Indeed single-job alert — verify salary/employer','RAF Grenoble — Actual Talent — Indeed Jun 23','1 nouvel emploi Responsable Administratif Financier Grenoble (38) — Actual Talent',false],
  ['2026-06-21','19eebd3615422041','Indeed','Responsable Administratif Financier','Responsable Administratif et Financier F/H','Actual Talent',null,'Grenoble (38)',null,'CDI','pending','Subject-parsed Indeed single-job alert — verify salary/employer','RAF Grenoble — Actual Talent — Indeed Jun 21','1 nouvel emploi Responsable Administratif Financier Grenoble (38) — Actual Talent',false],
];

async function main() {
  await db.connect();

  // Check Teledyne application statuses
  const tel = await db.query('SELECT id,job_title,company,status FROM job_applications WHERE id IN (86,3)');
  console.log('TELEDYNE_STATUSES:', JSON.stringify(tel.rows));

  let inserted = 0, skipped = 0, errors = [];
  for (const r of rows) {
    const [parse_date, gmail_thread_id, source, alert_keyword, job_title, company, salary, location, job_url, contract_type, parse_status, parse_notes, raw_snippet, raw_body, english] = r;
    const gmail_thread_url = `https://mail.google.com/mail/u/0/#all/${gmail_thread_id}`;
    try {
      const res = await db.query(
        `INSERT INTO listing_inbox
         (parse_date,gmail_thread_id,gmail_thread_url,source,alert_keyword,job_title,company,salary,location,job_url,contract_type,parse_status,parse_notes,raw_snippet,raw_body,english,user_profile)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         ON CONFLICT DO NOTHING RETURNING id`,
        [parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword, job_title, company, salary, location, job_url, contract_type, parse_status, parse_notes, raw_snippet, raw_body, english, U]
      );
      if (res.rowCount > 0) inserted++; else skipped++;
    } catch (e) {
      errors.push(`${gmail_thread_id}: ${e.message}`);
    }
  }

  console.log(`INSERTED: ${inserted}, SKIPPED: ${skipped}`);
  if (errors.length) console.log('ERRORS:', errors);
  await db.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
