// inbox_insert_jun05.js — parse_date 2026-06-05, user_profile zberlo
const {Client} = require(process.env.PG_MODULE);
const c = new Client({connectionString: process.env.PG_CONN});

const PARSE_DATE = '2026-06-05';
const USER = 'zberlo';
const turl = id => `https://mail.google.com/mail/u/0/#all/${id}`;

// rows: [threadId, source, alertKw, title, company, location, salary, url, contract, status, notes, english, snippet, body]
const rows = [
  // APEC
  ['19e97e727f02cb7a','APEC',null,null,null,null,null,'Not available',null,'manual_check','APEC: 19 offres — check apec.fr manually',false,
   'Voici une sélection d\'offres d\'emploi 7 offres correspondent à votre recherche :',
   '19 offres Apec du 05/06/2026 | Voici une sélection d\'offres d\'emploi 7 offres correspondent à votre recherche :'],

  // Cadremploi
  ['19e983a4aae13eef','Cadremploi','Directeur Financier OR DAF OR Finance Director',null,null,null,null,'Not available',null,'manual_check','Cadremploi HTML-only — open Gmail link to review and paste JD',false,
   'Ces entreprises recherchent encore des candidats ! Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable',
   'Votre profil intéresse ces entreprises ! | Ces entreprises recherchent encore des candidats ! Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR'],

  ['19e97541f01c5af5','Cadremploi','Financial Controller OR Finance Manager',null,null,null,null,'Not available',null,'manual_check','Cadremploi HTML-only — open Gmail link to review and paste JD',false,
   '3 offres d\'emploi trouvées. Aucune offre ne correspond à votre recherche. Financial Controller OR Finance Manager OR Accounting',
   'Et si vous modifiez vos critères de recherche ? | 3 offres d\'emploi trouvées. Financial Controller OR Finance Manager OR Accounting'],

  ['19e970c6ffea5559','Cadremploi','Responsable Supply Chain OR Supply Chain Manager OR Demand Planner','Supply Chain Manager France & Suisse','Not disclosed',null,null,'Not available',null,'manual_check','Cadremploi HTML-only — open Gmail link to review and paste JD',false,
   '1 offre à ne rater sous aucun prétexte Responsable Supply Chain OR Supply Chain Manager OR Demand Planner, Isère, CDI — Supply Chain Manager France & Suisse',
   '1 offre à ne rater sous aucun prétexte | Supply Chain Manager France & Suisse - Responsable Supply Chain OR Supply Chain Manager OR Demand Planner, Isère, CDI'],

  ['19e970c6ffea5559','Cadremploi','Responsable Administratif et Financier OR RAF',null,null,null,null,'Not available',null,'manual_check','Cadremploi HTML-only — open Gmail link to review and paste JD',false,
   '1 offre à ne rater sous aucun prétexte Responsable Administratif et Financier OR RAF OR Responsable Consolidation OR Responsable Trésorerie OR Responsable Finance',
   '1 offre à ne rater sous aucun prétexte | Responsable Administratif et Financier OR RAF OR Responsable Consolidation OR Responsable Trésorerie OR Responsable Finance'],

  // LinkedIn single-job (subject-parsed)
  ['19e98baaa60b63ac','LinkedIn','LinkedIn','Lead Controls & Finance Enablement (d/f/m)','Roche',null,null,'Not available',null,'pending','Subject-parsed (HTML-only body — verify location/salary)',true,
   'Roche Lead Controls & Finance Enablement (d/f/m): At Roche you can show up as yourself, embraced',
   'Lead Controls & Finance Enablement (d/f/m) at Roche | Roche Lead Controls & Finance Enablement (d/f/m): At Roche you can show up as yourself, embraced'],

  ['19e987c576702c76','LinkedIn','LinkedIn','Responsable projet de la chaine d\'approvisionnement (Project Supply Chain Manager) H/F','GE Vernova',null,null,'Not available',null,'pending','Subject-parsed (HTML-only body — verify location/salary)',false,
   'GE Vernova Responsable projet de la chaine d\'approvisionnement (Project Supply Chain Manager) H/F',
   'Responsable projet de la chaine d\'approvisionnement H/F at GE Vernova | GE Vernova - Project Supply Chain Manager H/F'],

  ['19e973281044c868','LinkedIn','LinkedIn','Finance Excellence Partner (d/f/m)','Roche',null,null,'Not available',null,'pending','Subject-parsed (HTML-only body — verify location/salary)',true,
   'Roche Finance Excellence Partner (d/f/m): At Roche you can show up as yourself, embraced',
   'Finance Excellence Partner (d/f/m) at Roche | Roche Finance Excellence Partner (d/f/m): At Roche you can show up as yourself, embraced'],

  ['19e97a0b8bd97b99','LinkedIn','LinkedIn','Responsable Comptabilité Clients F/H','COURIR',null,null,'Not available',null,'pending','Subject-parsed (HTML-only body — verify location/salary)',false,
   'COURIR Responsable Comptabilité Clients - F/H: Courir est le n°1 de la Sneaker en France!',
   'Responsable Comptabilité Clients - F/H at COURIR | COURIR Responsable Comptabilité Clients - F/H: Courir est le n°1 de la Sneaker en France!'],

  // LinkedIn alert — unique jobs (subject-parsed)
  ['19e98ea0350dcbc7','LinkedIn','Responsable Achats OR Acheteur','Acheteur Confirmé Industriel & Électronique H/F','LYNRED',null,null,'Not available',null,'pending','Subject-parsed (HTML-only body — verify location/salary)',false,
   'View jobs in Greater Grenoble Metropolitan Area',
   '"Responsable Achats OR Acheteur…": LYNRED - Acheteur Confirmé Industriel & Électronique (H/F) posted on 6/3/26 | View jobs in Greater Grenoble Metropolitan Area'],

  ['19e957b0aa620258','LinkedIn','Responsable Administratif et','Manager d\'Agence/Expert-Comptable ou Expert-comptable mémorialiste H/F','Vie De Comptable by HappyCab',null,null,'Not available',null,'pending','Subject-parsed (HTML-only body — verify location/salary)',false,
   'View jobs in Greater Grenoble Metropolitan Area',
   '"Responsable Administratif et…": Vie De Comptable by HappyCab - Manager d\'Agence/Expert-Comptable mémorialiste H/F posted on 6/2/26 | View jobs in Greater Grenoble Metropolitan Area'],

  // LinkedIn similar jobs (real URLs — url_dedup checked inline)
  ['19e95e8d1257652f','LinkedIn','Responsable Administratif et Financier','Responsable Administratif et Financier H/F','Adsearch','67100',null,'https://www.linkedin.com/jobs/view/4416516016/',null,'pending',null,false,
   'Responsable Administratif et Financier (H/F) - Adsearch - 67100',
   'New jobs similar to Responsable Administratif et Financier at Grenoble INP | Responsable Administratif et Financier (H/F) - Adsearch - 67100'],

  ['19e95e8d1257652f','LinkedIn','Responsable Administratif et Financier','Responsable Opérationnel Trésorerie','MMG Millet Mountain Group','Annecy',null,'https://www.linkedin.com/jobs/view/4422041368/',null,'pending',null,false,
   'Responsable Opérationnel Trésorerie - MMG | Millet Mountain Group - Annecy',
   'New jobs similar to Responsable Administratif et Financier at Grenoble INP | Responsable Opérationnel Trésorerie - MMG | Millet Mountain Group - Annecy'],

  ['19e95e8d1257652f','LinkedIn','Responsable Administratif et Financier','Responsable de trésorerie h/f','Sonepar France','Lyon',null,'https://www.linkedin.com/jobs/view/4419285326/',null,'pending',null,false,
   'Responsable de trésorerie h/f - Sonepar France - Lyon',
   'New jobs similar to Responsable Administratif et Financier at Grenoble INP | Responsable de trésorerie h/f - Sonepar France - Lyon'],

  // HelloWork (HTML-only, subject-parsed)
  ['19e982524f1ad3bf','Direct','Chef de Projet ERP','Chef de Projet ERP H/F','OPEN-PROD',null,null,'Not available',null,'pending','Subject-parsed (HTML-only body — verify location/salary)',false,
   'Hello Zachary ! 3 nouvelles offres correspondent à votre profil. Chef de Projet ERP H/F',
   'Zachary, OPEN-PROD recrute un Chef de Projet ERP H/F | Hello Zachary ! 3 nouvelles offres correspondent à votre profil. Chef de Projet ERP H/F'],

  ['19e972812b4c2ed2','Direct','Responsable Comptable','Responsable Comptable H/F','Hays',null,null,'Not available',null,'pending','Subject-parsed (HTML-only body — verify location/salary)',false,
   'Hello Zachary ! 6 nouvelles offres correspondent à votre profil. Responsable Comptable',
   'Zachary, Hays recrute un Responsable Comptable H/F | Hello Zachary ! 6 nouvelles offres correspondent à votre profil. Responsable Comptable'],

  // Indeed singles (subject-parsed, no URL)
  ['19e99d40608f6805','Indeed','Contrôleur de Gestion','Contrôleur de Gestion','VINCI Energies','Grenoble (38)',null,'Not available','CDI','pending',null,false,
   'VINCI Energies vous propose une offre d\'emploi !',
   '1 nouvel emploi Contrôleur de Gestion - Grenoble (38) | VINCI Energies vous propose une offre d\'emploi !'],

  ['19e99991bc329232','Indeed','Responsable Administratif Financier','Responsable Administratif Financier','VINCI Energies','Grenoble (38)',null,'Not available',null,'pending',null,false,
   'VINCI Energies vous propose une offre d\'emploi !',
   '1 nouvel emploi Responsable Administratif Financier - Grenoble (38) | VINCI Energies vous propose une offre d\'emploi !'],

  ['19e98f5271559d07','Indeed','Pilote Financier','Pilote Financier','Société Dauphinoise pour l\'Habitat','Grenoble (38)',null,'Not available',null,'pending',null,false,
   'Société Dauphinoise pour l\'Habitat vous propose une offre d\'emploi !',
   '1 nouvel emploi Pilote Financier - Grenoble (38) | Société Dauphinoise pour l\'Habitat vous propose une offre d\'emploi !'],

  ['19e951713c596212','Indeed','Contrôleur de Gestion','Contrôleur de Gestion','VMC Bois','Grenoble (38)',null,'Not available',null,'pending',null,false,
   'VMC Bois vous propose une offre d\'emploi !',
   '1 nouvel emploi Contrôleur de Gestion - Grenoble (38) | VMC Bois vous propose une offre d\'emploi !'],

  // Framatome Indeed thread (2 jobs from body)
  ['19e970de6a1ab0ef','Indeed','Framatome','Responsable Achat Projets d\'investissements F/H','Framatome','Le Creusot (71)','55000-75000','Not available',null,'pending',null,false,
   'Framatome vous propose une offre d\'emploi !',
   'Nouvelles offres d\'emploi chez Framatome | Framatome - Le Creusot (71) - 55 000-75 000/an - Responsable Achat Projets d\'investissements F/H'],

  ['19e970de6a1ab0ef','Indeed','Framatome','Data Governance Officer F/H','Framatome','Lyon (69)','50000-60000','Not available',null,'pending',null,true,
   'Framatome vous propose une offre d\'emploi !',
   'Nouvelles offres d\'emploi chez Framatome | Framatome - Lyon (69) - 50 000-60 000/an - Data Governance Officer F/H'],

  // Indeed multi 19e991edde656cc4 — 14 jobs
  ['19e991edde656cc4','Indeed','finance director','Responsable administratif et financier débutant F/H','VINCI Energies','Chambéry (73)',null,'https://fr.indeed.com/viewjob?jk=b258dab1ab5bbb',null,'pending','Multi-listing parse',false,
   'VINCI Energies - Chambéry (73) - Participer à l\'élaboration du budget et aux analyses financières.',
   'finance director Grenoble (38) | VINCI Energies - Chambéry (73) - RAF débutant F/H'],

  ['19e991edde656cc4','Indeed','finance director','Directeur administratif financier indépendant H/F','DAF-ACTIVE','Grenoble (38)','30000-110000','Not available',null,'pending','Multi-listing parse',false,
   'DAF-ACTIVE - Grenoble (38) - 30 000-110 000/an - Candidature simplifiée',
   'finance director Grenoble (38) | DAF-ACTIVE - Grenoble (38) - DAF indépendant H/F'],

  ['19e991edde656cc4','Indeed','finance director','Directeur des opérations indépendant H/F','PROD-ACTIVE','Grenoble (38)','30000-110000','Not available',null,'pending','Multi-listing parse',false,
   'PROD-ACTIVE - Grenoble (38) - 30 000-110 000/an',
   'finance director Grenoble (38) | PROD-ACTIVE - Grenoble (38) - Directeur des opérations indépendant H/F'],

  ['19e991edde656cc4','Indeed','finance director','DIRECTEUR DE MAGASIN F/H','Centrakor','Saint-Martin-d\'Hères (38)',null,'Not available',null,'pending','Multi-listing parse',false,
   'Centrakor - Saint-Martin-d\'Hères (38)',
   'finance director Grenoble (38) | Centrakor - Saint-Martin-d\'Hères (38) - DIRECTEUR DE MAGASIN F/H'],

  ['19e991edde656cc4','Indeed','finance director','Directeur commercial indépendant H/F','PROSPACTIVE','Grenoble (38)','30000-110000','Not available',null,'pending','Multi-listing parse',false,
   'PROSPACTIVE - Grenoble (38) - 30 000-110 000/an',
   'finance director Grenoble (38) | PROSPACTIVE - Grenoble (38) - Directeur commercial indépendant H/F'],

  ['19e991edde656cc4','Indeed','finance director','Directeur Commercial Adjoint H/F','CBA Assurance','Échirolles (38)','41000-42000','Not available',null,'pending','Multi-listing parse',false,
   'CBA Assurance - Échirolles (38) - 41 000-42 000/an',
   'finance director Grenoble (38) | CBA Assurance - Échirolles (38) - Directeur Commercial Adjoint H/F'],

  ['19e991edde656cc4','Indeed','finance director','Directeur des ressources humaines indépendant H/F','DRH-ACTIVE','Grenoble (38)','30000-110000','Not available',null,'pending','Multi-listing parse',false,
   'DRH-ACTIVE - Grenoble (38) - 30 000-110 000/an',
   'finance director Grenoble (38) | DRH-ACTIVE - Grenoble (38) - DRH indépendant H/F'],

  ['19e991edde656cc4','Indeed','finance director','Directeur d\'agence H/F','VITALIS MEDICAL','Voiron (38)',null,'Not available',null,'pending','Multi-listing parse',false,
   'VITALIS MEDICAL - Voiron (38)',
   'finance director Grenoble (38) | VITALIS MEDICAL - Voiron (38) - Directeur d\'agence H/F'],

  ['19e991edde656cc4','Indeed','finance director','Directeur d\'agence H/F','VITALIS MEDICAL','Grenoble (38)',null,'Not available',null,'pending','Multi-listing parse',false,
   'VITALIS MEDICAL - Grenoble (38)',
   'finance director Grenoble (38) | VITALIS MEDICAL - Grenoble (38) - Directeur d\'agence H/F'],

  ['19e991edde656cc4','Indeed','finance director','Directeur systèmes d\'information indépendant H/F','DSIACTIVE','Grenoble (38)','30000-110000','Not available',null,'pending','Multi-listing parse',false,
   'DSIACTIVE - Grenoble (38) - 30 000-110 000/an',
   'finance director Grenoble (38) | DSIACTIVE - Grenoble (38) - DSI indépendant H/F'],

  ['19e991edde656cc4','Indeed','finance director','Directeur d\'agence H/F','VITALIS MEDICAL','Tullins (38)',null,'Not available',null,'pending','Multi-listing parse',false,
   'VITALIS MEDICAL - Tullins (38)',
   'finance director Grenoble (38) | VITALIS MEDICAL - Tullins (38) - Directeur d\'agence H/F'],

  ['19e991edde656cc4','Indeed','finance director','Directeur d\'agence H/F','VITALIS MEDICAL','Chambéry (73)',null,'Not available',null,'pending','Multi-listing parse',false,
   'VITALIS MEDICAL - Chambéry (73)',
   'finance director Grenoble (38) | VITALIS MEDICAL - Chambéry (73) - Directeur d\'agence H/F'],

  ['19e991edde656cc4','Indeed','finance director','Directeur d\'agence d\'intérim et de recrutement indépendant H/F','Lynx RH','Chambéry (73)',null,'Not available',null,'pending','Multi-listing parse',false,
   'Lynx RH - Chambéry (73)',
   'finance director Grenoble (38) | Lynx RH - Chambéry (73) - Directeur d\'agence intérim H/F'],

  ['19e991edde656cc4','Indeed','finance director','Directrice/Directeur de Magasin Adjoint F/H','Courir','Grenoble (38)',null,'Not available',null,'pending','Multi-listing parse',false,
   'Courir - Grenoble (38)',
   'finance director Grenoble (38) | Courir - Grenoble (38) - Directrice/Directeur de Magasin Adjoint F/H'],
];

const SQL = `
  INSERT INTO listing_inbox
    (parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
     job_title, company, location, salary, job_url, contract_type,
     parse_status, parse_notes, english, raw_snippet, raw_body, user_profile)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
`;

const DEDUP_SQL = `SELECT id FROM listing_inbox WHERE job_url=$1 AND parse_date >= CURRENT_DATE - 7 AND user_profile=$2 LIMIT 1`;

async function run() {
  await c.connect();
  let inserted = 0, urlDedup = 0, errors = [];

  for (const r of rows) {
    const [threadId, source, alertKw, title, company, location, salary, url,
           contract, status, notes, english, snippet, body] = r;

    if (url && url !== 'Not available') {
      const dd = await c.query(DEDUP_SQL, [url, USER]);
      if (dd.rows.length > 0) { urlDedup++; continue; }
    }

    try {
      await c.query(SQL, [
        PARSE_DATE, threadId, turl(threadId), source, alertKw,
        title, company, location, salary, url, contract,
        status, notes, english,
        snippet ? snippet.substring(0,200) : null,
        body ? body.substring(0,8000) : null,
        USER
      ]);
      inserted++;
    } catch(e) {
      errors.push(`${threadId} (${title||'null'}): ${e.message}`);
    }
  }

  await c.end();
  console.log(JSON.stringify({inserted, urlDedup, errors}));
}

run().catch(e => { console.error(e.message); process.exit(1); });
