const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const { Client } = require(config.pg_module_path);
const USER_PROFILE = 'zberlo';

function gmailUrl(threadId) { return `https://mail.google.com/mail/u/0/#all/${threadId}`; }

// ---- Real listings (parse_status='pending') ----
const listings = [
  { date:'2026-07-22', thread:'19f8b91a7e0d8506', source:'Indeed', alert:'Pilote Financier', title:"Directeur administratif de l'OSUG (f/h)", company:'Université Grenoble Alpes', location:"Saint-Martin-d'Hères (38)", salary:'À partir de 1 944 € par mois', contract:'CDD', url:'https://fr.indeed.com/viewjob?jk=8cee34785db194', notes:'Indeed multi-listing digest anchor (7 total, rest not finance-relevant, not extracted)' },
  { date:'2026-07-22', thread:'19f88cfb0d2f4072', source:'LinkedIn', alert:'Contrôleur de Gestion OR Pilote…', title:'Contrôleur de gestion', company:'Groupe BBM', location:null, salary:null, contract:null, url:'Not available', notes:'Subject-parsed from LinkedIn saved-search notice' },
  { date:'2026-07-22', thread:'19f8a1920290cf95', source:'LinkedIn', alert:'Contrôleur de Gestion', title:'Controleur de gestion (F/H)', company:'Grenoble INP - UGA Recrutement', location:'Grenoble', salary:null, contract:null, url:'Not available', notes:'Subject-parsed' },
  { date:'2026-07-23', thread:'19f903484dc9af6d', source:'Indeed', alert:'finance director', title:'RESPONSABLE COMPTABILITE ET FINANCE', company:'Telio Management GmbH', location:'Villard-Bonnot (38)', salary:'De 65 000 € à 85 000 € par an', contract:null, url:'https://fr.indeed.com/viewjob?jk=i11f73e89299b31', notes:'Indeed multi-listing digest anchor (12 total, strong match; also seen via LinkedIn same posting, not duplicated)' },
  { date:'2026-07-23', thread:'19f8feb939f30064', source:'LinkedIn', alert:'FP&A', title:'Senior FP&A Analytics & Automation Engineer', company:'BD', location:null, salary:null, contract:null, url:'Not available', notes:'Subject-parsed' },
  { date:'2026-07-24', thread:'19f960a7051e1ae0', source:'Indeed', alert:'Contrôleur de Gestion', title:'Enseignant en comptabilité – contrôle de gestion', company:'Université Grenoble Alpes', location:'Grenoble (IUT2 GEA)', salary:null, contract:'CDD (01/10/2026-31/08/2027, 50%)', url:'Not available', notes:'Also seen Jul25 - same posting, inserted once' },
  { date:'2026-07-24', thread:'19f931c34d383225', source:'LinkedIn', alert:'Contrôleur de Gestion OR Pilote…', title:'Contrôleur de gestion H/F', company:'Air Liquide', location:'Grenoble', salary:null, contract:null, url:'Not available', notes:'Also seen Jul25 - same posting, inserted once' },
  { date:'2026-07-24', thread:'19f94d3a37b43055', source:'LinkedIn', alert:'Responsable Administratif et…', title:'Responsable administratif et financier (H/F)', company:'Le Grésivaudan - Communauté de communes', location:null, salary:null, contract:null, url:'Not available', notes:'Subject-parsed' },
  { date:'2026-07-25', thread:'19f9a8fed93eac4f', source:'Indeed', alert:'Pilote Financier', title:'Directeur H/F', company:'CIAS Résidence Béatrice', location:'Les Échelles (73)', salary:'De 1 982,60 € à 4 228,15 € par mois', contract:null, url:'https://fr.indeed.com/viewjob?jk=af177a513ed3b9', notes:'Indeed multi-listing digest anchor (6 total, rest not finance-relevant, not extracted). Recurs Jul24/26 same posting.' },
  { date:'2026-07-25', thread:'19f9a67e55f8fb47', source:'LinkedIn', alert:'Responsable Administratif et…', title:'DIRECTEUR /DIRECTRICE ADMINISTRATIF ET FINANCIER', company:'Bras Droit des Dirigeants', location:null, salary:null, contract:null, url:'Not available', notes:'Subject-parsed' },
  { date:'2026-07-25', thread:'19f99fa08f135160', source:'LinkedIn', alert:'Responsable Administratif et…', title:'Lead Controls & Finance Enablement (d/f/m)', company:'Roche', location:null, salary:null, contract:null, url:'Not available', notes:'Subject-parsed' },
  { date:'2026-07-25', thread:'19f9a3844609de0e', source:'LinkedIn', alert:'Responsable Supply Chain OR Supply…', title:'Responsable Projet ERP & Intégration Groupe', company:'MasterGrid', location:null, salary:null, contract:null, url:'Not available', notes:'Subject-parsed; marginal fit (ERP/IT, not core finance)' },
  { date:'2026-07-25', thread:'19f991e4cafe9ffc', source:'LinkedIn', alert:'Contrôleur de Gestion OR Pilote…', title:'Business controller', company:'TAVENGINEERING', location:null, salary:null, contract:null, url:'Not available', notes:'Subject-parsed - NOTE: Zack already submitted an application to this role (confirmation email Jul24) - verify not a true duplicate before treating as new' },
  { date:'2026-07-25', thread:'19f9935236e99d48_manual', source:'LinkedIn', alert:'Responsable Supply Chain OR Supply…', title:'Manager Inventory & Planning (d/f/m)', company:'Roche', location:null, salary:null, contract:null, url:'Not available', notes:'Subject-parsed; also seen Jul26 same posting, inserted once' },
  { date:'2026-07-26', thread:'19f9f2062f9ba690', source:'LinkedIn', alert:'Responsable Administratif et…', title:'COMPTABLE CONFIRMÉE/GESTIONNAIRE SAS GRENOBLE H/F', company:'CEA', location:'Grenoble', salary:null, contract:null, url:'Not available', notes:'Subject-parsed' },
  { date:'2026-07-27', thread:'19fa4c7ee222165b', source:'Indeed', alert:'finance director', title:'Secrétaire Générale H/F Fédération des transports - Directeur (trice) GEIQ des Transports ALPINS', company:'CPTR des SAVOIE DAUPHINE - GEIQ des Transports ALPINS', location:'La Motte-Servolex (73)', salary:'De 42 000 € à 46 000 € par an', contract:null, url:'Not available', notes:'Indeed multi-listing digest anchor (recurring since Jul22, sponsored/pagead link with no extractable job ID)' },
  { date:'2026-07-27', thread:'19fa2fd2219b71de', source:'LinkedIn', alert:'Responsable Supply Chain OR Supply…', title:'Responsable Logisticiens projets F/H', company:'Framatome', location:null, salary:null, contract:null, url:'Not available', notes:'Subject-parsed' },
  { date:'2026-07-28', thread:'19faa2bb5c16fbe8', source:'Indeed', alert:'finance director', title:'Responsable poste de contrôle autoroutier F/H', company:'APRR', location:'Nances (73)', salary:'De 45 000 € à 50 000 € par an', contract:null, url:'https://fr.indeed.com/viewjob?jk=6a3deb91025536', notes:'Indeed multi-listing digest anchor (4 more, not finance-relevant, not extracted)' },
  { date:'2026-07-28', thread:'19faa26fae2e6de1', source:'Indeed', alert:'Pilote Financier', title:'CHEF DE PROJET AMO / PROGRAMMISTE F/H', company:'Cicad', location:'Meylan (38)', salary:null, contract:null, url:'Not available', notes:'From 2-listing Indeed digest' },
  { date:'2026-07-28', thread:'19faa26fae2e6de1', source:'Indeed', alert:'Pilote Financier', title:'CHEF AGENCE (H/F)', company:'DERICHEBOURG PROPRETE', location:'Chignin (73)', salary:null, contract:null, url:'Not available', notes:'From 2-listing Indeed digest' },
  { date:'2026-07-28', thread:'19fa89162bc1b985', source:'LinkedIn', alert:'Responsable Administratif et…', title:'directeur.trice administratif.ve', company:"Observatoire des Sciences de l'Univers de Grenoble", location:null, salary:null, contract:null, url:'Not available', notes:'Subject-parsed' },
  { date:'2026-07-28', thread:'19fa8ff36df55203', source:'LinkedIn', alert:'Directeur Financier OR DAF OR…', title:'Chief Financial Officer', company:'TiHive', location:null, salary:null, contract:null, url:'Not available', notes:'Subject-parsed - strong title match' },
  { date:'2026-07-28', thread:'19fa9dafae81ad6d', source:'LinkedIn', alert:'Responsable Supply Chain OR Supply…', title:'Responsable de production', company:'Randstad', location:null, salary:null, contract:null, url:'Not available', notes:'Subject-parsed' },
  { date:'2026-07-28', thread:'19fa96d1a5f6848e', source:'LinkedIn', alert:'Contrôleur de Gestion OR Pilote…', title:'UN-E CHARGE-E DE GESTION DES BUDGETS (poste vacant)', company:'COMMUNE D ECHIROLLES', location:null, salary:null, contract:null, url:'Not available', notes:'Subject-parsed' },
];

// ---- Known HTML-only sources -> puppeteer_pending ----
// One row per distinct Cadremploi alert-keyword message + one per HelloWork thread, per day.
const cadremploiMsgs = [
  // date, threadId, messageId (for url), alert keyword extracted from snippet, subject
  ['2026-07-22','19f8a69c49030d1b','19f8a69c49030d1b','Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR…','Votre profil intéresse ces entreprises !'],
  ['2026-07-22','19f8966b99b92e45','19f8966b89cf8736','Credit Manager OR Responsable Recouvrement OR…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-22','19f8966b99b92e45','19f8966b99b92e45','Responsable Supply Chain OR Supply Chain Manager OR…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-22','19f8966b99b92e45','19f8966b9c6f9a33','Responsable Administratif Financier OR RAF OR…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-22','19f8966b99b92e45','19f896918f408b7b','Responsable Achats OR Acheteur Senior OR Responsable…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-23','19f8f6b748b2afe1','19f8f6b748b2afe1','Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR…','Votre profil intéresse ces entreprises !'],
  ['2026-07-23','19f8e8b60f078fd7','19f8e8b60f078fd7','Financial Controller OR Finance Manager OR Accounting…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-23','19f8e8b60f078fd7','19f8e8b6361d2427','Contrôleur de Gestion OR Responsable Contrôle de…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-23','19f8e8b60f078fd7','19f8e8daca132c2c','Contrôleur de Gestion OR Pilote Financier OR…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-23','19f8e8b60f078fd7','19f8e8db147f26a3','Responsable Administratif et Financier OR RAF OR…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-24','19f948526a00a808','19f948526a00a808','Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR…','Votre profil intéresse ces entreprises !'],
  ['2026-07-24','19f93b1127e70f23','19f93b1127e70f23','Responsable Supply Chain OR Supply Chain Manager OR…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-24','19f93b1127e70f23','19f93b1962001c1b','Responsable Administratif Financier OR RAF OR…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-24','19f93b1127e70f23','19f93b3c954b33b2','Responsable Achats OR Acheteur Senior OR Responsable…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-24','19f93b1127e70f23','19f93b456712d679','Credit Manager OR Responsable Recouvrement OR…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-25','19f99abbd636cb8a','19f99abbd636cb8a','Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR…','Votre profil intéresse ces entreprises !'],
  ['2026-07-25','19f98d0a9ba6feef','19f98d0a9ba6feef','Contrôleur de Gestion OR Responsable Contrôle de…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-25','19f98d0a9ba6feef','19f98d0abea338f0','Financial Controller OR Finance Manager OR Accounting…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-25','19f98d0a9ba6feef','19f98d2f961aa771','Contrôleur de Gestion OR Pilote Financier OR…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-25','19f98d0a9ba6feef','19f98d2ff81fcb35','Responsable Administratif et Financier OR RAF OR…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-26','19f9ed22552bd555','19f9ed22552bd555','Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR…','Votre profil intéresse ces entreprises !'],
  ['2026-07-26','19f9df96b5ad3fe8','19f9df96b5ad3fe8','Responsable Supply Chain OR Supply Chain Manager OR…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-26','19f9df96b5ad3fe8','19f9df96c8131853','Credit Manager OR Responsable Recouvrement OR…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-26','19f9df96b5ad3fe8','19f9df970f1d563a','Credit Manager OR Responsable Recouvrement OR…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-26','19f9df96b5ad3fe8','19f9dfbd8f48856a','Responsable Achats OR Acheteur Senior OR Responsable…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-27','19fa472bda0ea6bb','19fa472bda0ea6bb','Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR…','Votre profil intéresse ces entreprises !'],
  ['2026-07-27','19fa31cd956518d3','19fa31cd956518d3','Financial Controller OR Finance Manager OR Accounting…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-27','19fa31cd956518d3','19fa31cde38c5f39','Contrôleur de Gestion OR Responsable Contrôle de…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-27','19fa31cd956518d3','19fa31f1e03b7ca0','Contrôleur de Gestion OR Pilote Financier OR…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-27','19fa31cd956518d3','19fa31f1f394b5e0','Responsable Administratif et Financier OR RAF OR…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-28','19fa9348f7f2374f','19fa9348f7f2374f','Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR…','Votre profil intéresse ces entreprises !'],
  ['2026-07-28','19fa843db962c95a','19fa843db962c95a','Responsable Administratif Financier OR RAF OR…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-28','19fa843db962c95a','19fa843dc428cace','Responsable Supply Chain OR Supply Chain Manager OR…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-28','19fa843db962c95a','19fa843df98b6705','Credit Manager OR Responsable Recouvrement OR…','Et si vous modifiez vos critères de recherche ?'],
  ['2026-07-28','19fa843db962c95a','19fa8462c46b4992','Responsable Achats OR Acheteur Senior OR Responsable…','Et si vous modifiez vos critères de recherche ?'],
];

const helloworkThreads = [
  ['2026-07-22','19f8a86ef4c357c5_x','Zachary, Lynx RH recrute un Responsable Comptable H/F'], // placeholder removed below
];
// Real HelloWork "nouvelles offres" threads (corrected list):
const hellowork = [
  ['2026-07-22','19f89e8eb28061f6','Zachary, Lynx RH recrute un Responsable Comptable H/F'],
  ['2026-07-22','19f893f56fa7ee03','Zachary, mc-conseil recrute un Responsable Pôle Comptable Frais Géneraux H/F'],
  ['2026-07-23','19f8ec177a81926f','Zachary, Groupe GIF recrute un Directeur Administratif et Financier H/F'],
  ['2026-07-23','19f8e19462eadcbc','Zachary, LIP Tertiaire recrute un Responsable Comptable et Financier H/F'],
  ['2026-07-24','19f93826d613baab','Zachary, BBM et Associés recrute un Manager Comptable H/F'],
  ['2026-07-25','19f9806d98e116a2','Zachary, OPEN-PROD recrute un Chef de Projet ERP H/F'],
  ['2026-07-26','19f9d3d9d6bc0d68','Zachary, mc-conseil recrute un Responsable Pôle Comptable Frais Géneraux H/F'],
  ['2026-07-27','19fa3e63f96147a1','Zachary, Work 2000 Chatte recrute un Gestionnaire de Flux Responsable des Flux H/F'],
  ['2026-07-28','19fa75fbfc56c52a','Zachary, Lynx RH recrute un Responsable Comptable H/F'],
];

const apec = [
  ['2026-07-22','19f889e178f207a8','6 offres Apec du 22/07/2026', '6 offres'],
  ['2026-07-24','19f92fea51a1a94a','2 offres Apec du 24/07/2026', '2 offres'],
  ['2026-07-28','19fa782b924689af','8 offres Apec du 28/07/2026', '8 offres'],
];

async function main() {
  const client = new Client({ connectionString: config.supabase_connection_string });
  await client.connect();

  let written = { pending: 0, puppeteer_pending: 0, manual_check: 0 };
  let skippedDup = 0;
  let errors = [];

  async function alreadyExists(threadId, date) {
    const r = await client.query(
      `SELECT id FROM listing_inbox WHERE gmail_thread_id=$1 AND parse_date=$2 AND user_profile=$3 LIMIT 1`,
      [threadId, date, USER_PROFILE]
    );
    return r.rows.length > 0;
  }
  async function urlDup(url) {
    if (!url || url === 'Not available') return false;
    const r = await client.query(
      `SELECT id FROM (
         SELECT id FROM listing_inbox WHERE job_url=$1 AND parse_date >= CURRENT_DATE - 7 AND user_profile=$2
         UNION ALL
         SELECT id FROM job_applications WHERE job_url=$1 AND user_profile=$2
       ) t LIMIT 1`,
      [url, USER_PROFILE]
    );
    return r.rows.length > 0;
  }
  async function companyTitleDup(company, titleLike) {
    const r = await client.query(
      `SELECT id FROM job_applications WHERE user_profile=$1 AND company ILIKE $2 AND job_title ILIKE $3 LIMIT 1`,
      [USER_PROFILE, `%${company}%`, `%${titleLike}%`]
    );
    return r.rows.length > 0;
  }

  // Manual already-applied dedup for known cases
  const alreadyAppliedChecks = [
    { company: 'elydan', title: 'Controleur de Gestion Industriel' },
    { company: 'Grenoble-Alpes Métropole', title: 'finances' },
    { company: 'TAVENGINEERING', title: 'Business controller' },
  ];
  const appliedSkip = new Set();
  for (const c of alreadyAppliedChecks) {
    try {
      if (await companyTitleDup(c.company, c.title)) appliedSkip.add(c.company.toLowerCase());
    } catch (e) { /* ignore, treat as not found */ }
  }

  for (const l of listings) {
    try {
      if (appliedSkip.has(l.company.toLowerCase())) { skippedDup++; continue; }
      if (await alreadyExists(l.thread, l.date)) { skippedDup++; continue; }
      if (await urlDup(l.url)) { skippedDup++; continue; }
      const raw = `${l.title} | ${l.company} | ${l.location||''} | ${l.salary||''}`.slice(0,500);
      await client.query(
        `INSERT INTO listing_inbox
         (parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
          job_title, company, location, salary, job_url, contract_type,
          parse_status, parse_notes, english, raw_snippet, raw_body, user_profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [l.date, l.thread.replace('_manual',''), gmailUrl(l.thread.replace('_manual','')), l.source, l.alert,
         l.title, l.company, l.location, l.salary, l.url, l.contract,
         'pending', l.notes, false, raw.slice(0,200), raw, USER_PROFILE]
      );
      written.pending++;
    } catch (e) { errors.push(`${l.title} (${l.company}): ${e.message}`); }
  }

  for (const [date, threadId, msgId, alertKw, subject] of cadremploiMsgs) {
    try {
      if (await alreadyExists(msgId, date)) { skippedDup++; continue; }
      const raw = `${subject} | ${alertKw}`.slice(0,500);
      await client.query(
        `INSERT INTO listing_inbox
         (parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
          job_title, company, location, salary, job_url, contract_type,
          parse_status, parse_notes, english, raw_snippet, raw_body, user_profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [date, msgId, gmailUrl(threadId), 'Cadremploi', alertKw,
         null, null, null, null, 'Not available', null,
         'puppeteer_pending', 'Known HTML-only source — queued for Puppeteer extraction', false, raw.slice(0,200), raw, USER_PROFILE]
      );
      written.puppeteer_pending++;
    } catch (e) { errors.push(`Cadremploi ${date} ${alertKw}: ${e.message}`); }
  }

  for (const [date, threadId, subject] of hellowork) {
    try {
      if (await alreadyExists(threadId, date)) { skippedDup++; continue; }
      const raw = subject.slice(0,500);
      await client.query(
        `INSERT INTO listing_inbox
         (parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
          job_title, company, location, salary, job_url, contract_type,
          parse_status, parse_notes, english, raw_snippet, raw_body, user_profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [date, threadId, gmailUrl(threadId), 'Direct', 'HelloWork',
         null, null, null, null, 'Not available', null,
         'puppeteer_pending', 'Known HTML-only source — queued for Puppeteer extraction', false, raw.slice(0,200), raw, USER_PROFILE]
      );
      written.puppeteer_pending++;
    } catch (e) { errors.push(`HelloWork ${date}: ${e.message}`); }
  }

  for (const [date, threadId, subject, count] of apec) {
    try {
      if (await alreadyExists(threadId, date)) { skippedDup++; continue; }
      const raw = subject.slice(0,500);
      await client.query(
        `INSERT INTO listing_inbox
         (parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
          job_title, company, location, salary, job_url, contract_type,
          parse_status, parse_notes, english, raw_snippet, raw_body, user_profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [date, threadId, gmailUrl(threadId), 'APEC', 'APEC',
         null, null, null, null, 'Not available', null,
         'manual_check', `APEC: ${count} — HTML-only — check apec.fr manually`, false, raw.slice(0,200), raw, USER_PROFILE]
      );
      written.manual_check++;
    } catch (e) { errors.push(`APEC ${date}: ${e.message}`); }
  }

  console.log(JSON.stringify({ written, skippedDup, errors }, null, 2));
  await client.end();
}

main().catch(e => { console.error('FATAL', e.message); process.exit(1); });
