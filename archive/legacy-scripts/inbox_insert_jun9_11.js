const { Client } = require(process.env.PG_MODULE);
const c = new Client({ connectionString: process.env.PG_CONN });
const U = 'zberlo';
const SQL = `INSERT INTO listing_inbox
(parse_date,gmail_thread_id,gmail_thread_url,source,alert_keyword,
 job_title,company,location,salary,job_url,contract_type,
 parse_status,parse_notes,english,raw_snippet,raw_body,user_profile)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
ON CONFLICT DO NOTHING`;

const rows = [
  // --- June 9 ---
  ['2026-06-09','19eab56f8cdd6804','https://mail.google.com/mail/u/0/#all/19eab56f8cdd6804',
   'APEC','Alert Emploi',null,null,null,null,'Not available',null,
   'manual_check','APEC: 8 offres — Alert Emploi — HTML-only — check apec.fr manually',
   false,'8 offres Apec du 09/06/2026','8 offres Apec du 09/06/2026 | 1 offre correspond a votre recherche'],

  ['2026-06-09','19eabed04081ff42','https://mail.google.com/mail/u/0/#all/19eabed04081ff42',
   'Cadremploi','Financial Controller',null,null,null,null,'Not available',null,
   'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction',
   false,'3 offres Financial Controller OR Finance Manager OR Accounting',
   'Et si vous modifiez vos criteres ? | 3 offres Financial Controller OR Finance Manager OR Accounting'],

  ['2026-06-09','19eacef3321fbf20','https://mail.google.com/mail/u/0/#all/19eacef3321fbf20',
   'Cadremploi','Directeur Financier',null,null,null,null,'Not available',null,
   'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction',
   false,'Ces entreprises recherchent des candidats Directeur Financier OR DAF',
   'Votre profil interesse ces entreprises | Directeur Financier OR DAF OR Finance Director OR Head of Finance'],

  ['2026-06-09','19eab95551345d3a','https://mail.google.com/mail/u/0/#all/19eab95551345d3a',
   'Direct','Controleur de Gestion','Controleur de Gestion Operationelle H/F','STEF',
   null,null,'Not available',null,
   'pending','Subject-parsed (HTML-only body - verify location/salary) - HelloWork notification, 3 offers',
   false,'STEF recrute un Controleur de Gestion Operationelle H/F - 3 nouvelles offres',
   'Zachary, STEF recrute un Controleur de Gestion Operationelle H/F | 3 nouvelles offres correspondent a votre profil'],

  ['2026-06-09','19eab5e07b8fc48a','https://mail.google.com/mail/u/0/#all/19eab5e07b8fc48a',
   'LinkedIn','Business controller','Business Controller','TAVENGINEERING',
   null,null,'Not available',null,
   'pending','Subject-parsed from LinkedIn job alert - verify location/salary/scope',
   false,'TAVENGINEERING Business controller: Nous sommes une entreprise dynamique',
   'Business controller at TAVENGINEERING | Nous sommes une entreprise dynamique et passionnee'],

  ['2026-06-09','19eae34b9c5feca9','https://mail.google.com/mail/u/0/#all/19eae34b9c5feca9',
   'Indeed','Pilote Financier',null,null,'Grenoble (38)',null,'Not available',null,
   'manual_check','multi-listing: featured role off-target (jeunesse); +3 Pilote Financier roles not parsed - open Gmail to review',
   false,'Ville Saint-Egreve RESPONSABLE SERVICE JEUNESSE + 3 Pilote Financier Grenoble',
   'Ville de Saint-Egreve RESPONSABLE DU SERVICE JEUNESSE H/F + 3 nouvelles offres de Pilote Financier a Grenoble (38)'],

  ['2026-06-09','19ead7b136adaa71','https://mail.google.com/mail/u/0/#all/19ead7b136adaa71',
   'Indeed','finance director',null,null,'Grenoble (38)',null,'Not available',null,
   'manual_check','multi-listing: Grenoble-INP Directeur Operationnel + 12 nouvelles offres finance director - email too large, open Gmail to review',
   false,'Grenoble-INP Directeur Operationnel DFP + 12 nouvelles offres finance director Grenoble',
   'Grenoble-INP Directeur Operationnel DFP (F/H) + 12 nouvelles offres finance director a Grenoble (38)'],

  // --- June 10 ---
  ['2026-06-10','19eb045518297e7f','https://mail.google.com/mail/u/0/#all/19eb045518297e7f',
   'APEC','Alert Emploi',null,null,null,null,'Not available',null,
   'manual_check','APEC: 7 offres — HTML-only — check apec.fr manually',
   false,'7 offres Apec du 10/06/2026','7 offres Apec du 10/06/2026 | 2 offres correspondent a votre recherche'],

  ['2026-06-10','19eb112d22c40e88','https://mail.google.com/mail/u/0/#all/19eb112d22c40e88',
   'Cadremploi','Controleur de Gestion',null,null,null,null,'Not available',null,
   'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction (multi-alert thread, 5 messages)',
   false,'Cadremploi multi-alert: CDG/RAF/Controller/Credit Manager - 3 offres found',
   'Et si vous modifiez vos criteres ? | Multi-alert thread: CDG, RAF, Controller, Credit Manager keywords'],

  ['2026-06-10','19eb1fa4a3d871bd','https://mail.google.com/mail/u/0/#all/19eb1fa4a3d871bd',
   'Cadremploi','Directeur Financier',null,null,null,null,'Not available',null,
   'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction',
   false,'Ces entreprises recherchent des candidats Directeur Financier OR DAF',
   'Votre profil interesse ces entreprises | Directeur Financier OR DAF OR Finance Director OR Head of Finance'],

  ['2026-06-10','19eb34ddb489a3fc','https://mail.google.com/mail/u/0/#all/19eb34ddb489a3fc',
   'Indeed','Responsable Administratif Financier',
   'Responsable Administratif et Financier H/F','TRIALP','Chambery (73)',
   'De 45 000 EUR a 55 000 EUR par an','https://fr.indeed.com/viewjob?jk=d92e66264ed65f',null,
   'pending','Salary 45-55K below 65K apply floor. Yellow zone Chambery (73). Waste/recycling company.',
   false,'TRIALP RAF H/F Chambery (73) De 45 000 EUR a 55 000 EUR par an',
   'TRIALP Responsable Administratif et Financier H/F - Chambery (73) - De 45 000 EUR a 55 000 EUR par an'],

  ['2026-06-10','19eb28ab9b164100','https://mail.google.com/mail/u/0/#all/19eb28ab9b164100',
   'Indeed','finance director',null,null,'Grenoble (38)',null,'Not available',null,
   'manual_check','multi-listing: TRIALP RAF featured + 8 nouvelles offres finance director - open Gmail to review',
   false,'TRIALP RAF H/F + 8 nouvelles offres finance director Grenoble',
   'TRIALP Responsable Administratif et Financier H/F + 8 nouvelles offres finance director a Grenoble (38)'],

  // --- June 11 ---
  ['2026-06-11','19eb592c9dbb87f3','https://mail.google.com/mail/u/0/#all/19eb592c9dbb87f3',
   'APEC','Alert Emploi',null,null,null,null,'Not available',null,
   'manual_check','APEC: 5 offres — HTML-only — check apec.fr manually',
   false,'5 offres Apec du 11/06/2026','5 offres Apec du 11/06/2026 | 1 offre correspond a votre recherche'],

  ['2026-06-11','19eb6388781e7332','https://mail.google.com/mail/u/0/#all/19eb6388781e7332',
   'Cadremploi','Financial Controller',null,null,null,null,'Not available',null,
   'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction',
   false,'3 offres Financial Controller OR Finance Manager OR Accounting',
   'Et si vous modifiez vos criteres ? | Financial Controller OR Finance Manager OR Accounting'],

  ['2026-06-11','19eb6455c1a39ea0','https://mail.google.com/mail/u/0/#all/19eb6455c1a39ea0',
   'Cadremploi','Controleur de Gestion',null,null,null,null,'Not available',null,
   'puppeteer_pending','STRONG MATCH flagged - Known HTML-only source - queued for Puppeteer extraction. Cadremploi: 1 offre a ne rater.',
   false,'1 offre a ne rater Controleur de Gestion OR Responsable Controle de Gestion',
   '1 offre a ne rater sous aucun pretexte - Cadremploi | Controleur de Gestion OR Responsable Controle de Gestion'],

  ['2026-06-11','19eb77c202c62ac1','https://mail.google.com/mail/u/0/#all/19eb77c202c62ac1',
   'Cadremploi','Directeur Financier',null,null,null,null,'Not available',null,
   'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction (2-message thread)',
   false,'Ces entreprises recherchent des candidats Directeur Financier OR DAF',
   'Votre profil interesse ces entreprises | Directeur Financier OR DAF OR Finance Director (2 messages)'],

  ['2026-06-11','19eb6f9c5fde624d','https://mail.google.com/mail/u/0/#all/19eb6f9c5fde624d',
   'LinkedIn','Business Analyst','Business Analyst - Commercial Operations','embecta',
   null,null,'Not available',null,
   'pending','Subject-parsed from LinkedIn - embecta medtech diabetes care, likely Pont-de-Claix (Green zone) - verify location/salary',
   true,'embecta Business Analyst - Commercial Operations: embecta is a global diabetes care company',
   'Business Analyst - Commercial Operations at embecta | embecta is a global diabetes care company spun off from BD'],

  ['2026-06-11','19eb81b84b420531','https://mail.google.com/mail/u/0/#all/19eb81b84b420531',
   'Indeed','Pilote Financier',null,null,'Grenoble (38)',null,'Not available',null,
   'manual_check','multi-listing: Framatome featured (Manager production, off-target) + 3 Pilote Financier roles - open Gmail to review',
   false,'Framatome Manager production + 3 nouvelles offres Pilote Financier Grenoble',
   'Framatome Manager de production + 3 nouvelles offres Pilote Financier a Grenoble (38)'],
];

c.connect()
  .then(() => Promise.all(rows.map(r => c.query(SQL, [...r, U]))))
  .then(results => {
    const inserted = results.filter(r => r.rowCount > 0).length;
    const skipped  = results.filter(r => r.rowCount === 0).length;
    console.log('Inserted: ' + inserted + '  Skipped (already exists): ' + skipped);
    return c.end();
  })
  .catch(e => { console.error(e.message); process.exit(1); });
