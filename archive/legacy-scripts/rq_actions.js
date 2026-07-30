'use strict';
const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const db = new Client({ connectionString: cfg.supabase_connection_string });
const USER = 'zberlo';

async function dismissRQ(rqId, title, company, src, loc, sal, dt, url, gurl, kw, notes, en, liid) {
  await db.query(
    `INSERT INTO job_applications
     (job_title,company,source,location,salary,priority,cv_approach,status,date_added,
      job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,
      job_description,listing_inbox_id,user_profile)
     VALUES ($1,$2,$3,$4,$5,'C','Standard','Dismissed',$6,$7,$8,'[]','[]',$9,$10,$11,null,$12,$13)`,
    [title,company,src,loc,sal,dt,url,gurl,kw,notes,en,liid,USER]
  );
  await db.query(`DELETE FROM review_queue WHERE id=$1 AND user_profile=$2`, [rqId, USER]);
  console.log(`DISMISSED rq=${rqId}: ${title} @ ${company}`);
}

async function insertPA(rqId, title, company, src, loc, sal, dt, url, gurl, rf, kw, notes, en, jd, liid) {
  await db.query(
    `INSERT INTO job_applications
     (job_title,company,source,location,salary,priority,cv_approach,status,date_added,
      job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,
      job_description,listing_inbox_id,user_profile)
     VALUES ($1,$2,$3,$4,$5,'B','Cost Control Focus','Potentially Apply',$6,$7,$8,$9,'[]',$10,$11,$12,$13,$14,$15)`,
    [title,company,src,loc,sal,dt,url,gurl,JSON.stringify(rf),kw,notes,en,jd,liid,USER]
  );
  await db.query(`DELETE FROM review_queue WHERE id=$1 AND user_profile=$2`, [rqId, USER]);
  console.log(`PA rq=${rqId}: ${title} @ ${company}`);
}

async function insertFlex(rqId, title, company, src, loc, sal, dt, url, gurl, rf, kw, notes, en, jd, liid, priority, cvApproach, status) {
  await db.query(
    `INSERT INTO job_applications
     (job_title,company,source,location,salary,priority,cv_approach,status,date_added,
      job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,
      job_description,listing_inbox_id,user_profile)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'[]',$13,$14,$15,$16,$17,$18)`,
    [title,company,src,loc,sal,priority,cvApproach,status,dt,url,gurl,JSON.stringify(rf),kw,notes,en,jd,liid,USER]
  );
  await db.query(`DELETE FROM review_queue WHERE id=$1 AND user_profile=$2`, [rqId, USER]);
  console.log(`${status} [${priority}] rq=${rqId}: ${title} @ ${company}`);
}

async function run() {
  await db.connect();

  // RQ|473 — CDG Industriel Senior @ RÉSEAU TALENTS → Priority B, Potentially Apply
  await insertPA(473,
    'Contrôleur de Gestion Industriel Senior H/F','RÉSEAU TALENTS','Direct',
    'Satolas-et-Bonce',null,'2026-06-14',
    'https://www.hellowork.com/fr-fr/emplois/80239956.html',
    'https://mail.google.com/mail/u/0/#all/19ed1346270570d9',
    ['Far location'],
    'Responsable Comptable',
    'CDG Industriel Senior multi-site (France + Germany, electrical/electronic) via RÉSEAU TALENTS — Satolas-et-Bonce (38, Orange ~50 min), hybrid essential; strong industrial controlling scope matches Schneider background, step below DAF target; salary undisclosed (risk below €65K floor), travel burden (several trips/month to industrial sites)',
    false,
    `Senior Industrial Management Controller — RÉSEAU TALENTS, Satolas-et-Bonce 38, CDI, Bac+5, 10+ years min.\n\nMulti-site industrial controlling for electrical/electronic equipment subsidiaries (France & Germany). Responsibilities: production cost monitoring (direct/indirect, standard vs actual variances), inventory & industrial flow management, budget preparation & forecasts, industrial dashboards (productivity, yield, scrap), performance improvement projects, investment analyses, operating account monitoring. Regular travel to industrial sites (several trips/month).\n\nURL: https://www.hellowork.com/fr-fr/emplois/80239956.html`,
    1020
  );

  // RQ|471 — Adjoint DAF H/F @ JEAN LAIN MOBILITÉS → Priority B, Potentially Apply
  await insertFlex(471,
    'Adjoint Directeur Administratif et Financier H/F','JEAN LAIN MOBILITÉS','LinkedIn',
    'Chambéry','65000-70000','2026-06-15',
    'https://www.linkedin.com/jobs/view/4428048887/',
    'https://mail.google.com/mail/u/0/#all/19ed7241c6f98a8a',
    ['No hybrid'],
    'LinkedIn JYMBII',
    "Adjoint DAF at JEAN LAIN MOBILITÉS (auto distribution, 90+ sites, Savoie/Isère/Rhône) — Chambéry Yellow ~45 min; €65-70K + company car + 4.5-day week; scope: group-wide accounting process governance + manage 2 CDG controllers; télétravail occasionnel only (risk for Yellow zone commute); no English requirement; automotive sector (not Zack's background); 33 applicants",
    false,
    `Adjoint DAF H/F — JEAN LAIN MOBILITÉS, Chambéry, CDI, €65-70K + company car\n\nGroup innovant, 2000+ collaborateurs, 90+ sites (Savoie, Haute-Savoie, Isère, Rhône, Pays de GEX). Distribution automobile + mobilité (15 marques). 4.5-day week in deployment.\n\nMissions:\n1. Structuration et déploiement des méthodes comptables à l'échelle du groupe\n   - Définir socle commun de méthodes/process comptables\n   - Déployer auprès des chefs de groupe comptable et directions de territoire\n   - Garantir application des process\n\n2. Gestion et pilotage contrôle de gestion:\n   - Manager 2 contrôleurs de gestion\n   - Structurer les reportings financiers\n   - Garantir fiabilité et conformité réglementaire\n\nProfil: Formation supérieure comptabilité/CDG, 10+ ans expérience multi-sites, management, pragmatisme. Connaissance secteur distribution automobile souhaitée.\n\nPérimètre: Chambéry — déplacements ponctuels. Télétravail occasionnel possible.`,
    991, 'B','Standard','Potentially Apply'
  );

  // RQ|470 — Responsable comptabilité clients @ Upward → Priority B, Potentially Apply (user request to keep)
  await insertFlex(470,
    'Responsable comptabilité clients','Upward','LinkedIn',
    'Greater Grenoble Metropolitan Area',null,'2026-06-15',
    'https://www.linkedin.com/jobs/view/4426843992/',
    'https://mail.google.com/mail/u/0/#all/19ed4fec959ce5f6',
    ['Junior scope'],
    'Responsable Trésorerie OR Responsable P2P',
    "AR/Customer Accounting Manager at major distribution company (anonymous client via Upward Finance recruiter) — Grenoble Green zone, 2j télétravail, English required; creation de poste, international environment, transformation projects; salary undisclosed (risk below €65K floor for AR manager scope); 5-year minimum (overqualified at 12+); 10 applicants",
    true,
    `Responsable comptabilité clients — client majeur de la distribution, Grenoble, CDI, 2j télétravail\n\nRecruté via Upward Finance (Brune Adrian Chaperon). Création de poste.\n\nMissions:\n- Superviser équipe et montée en compétences\n- Participer clôtures mensuelles et annuelles\n- Fiabiliser CA sur flux de ventes\n- Sécuriser BFR: credit management, suivi risque client\n- Garantir fiabilité encaissements et rapprochements\n- Relance et recouvrement\n- Produire et analyser KPIs\n- Accompagner audits internes/externes\n- Projets amélioration outils et processus financiers\n\nProfil: 5+ ans expérience confirmée, expérience cabinet (vrai plus), multi-sociétés, environnement international, management hiérarchique obligatoire, anglais professionnel indispensable.\n\nPlus: forte dynamique de croissance internationale, rôle transverse, projets transformation direction comptable.`,
    990, 'B','Standard','Potentially Apply'
  );

  // RQ|472 — Financial Controller @ INTERPOL → Priority B, Potentially Apply — DEADLINE JUNE 30
  await insertFlex(472,
    'Financial Controller','INTERPOL','LinkedIn',
    'Lyon',null,'2026-06-15',
    'https://www.linkedin.com/jobs/view/4422759690/',
    'https://mail.google.com/mail/u/0/#all/19ed7241c6f98a8a',
    ['Fixed-term','Far location'],
    'LinkedIn JYMBII',
    "Financial Controller at INTERPOL (Lyon) — 36-month FTC (Grade 3); IPSAS financial statements + external audit management + accounting team lead; English essential, French desirable; SAP experience relevant; IPSAS expertise gap; 100+ applicants; Orange zone Lyon (~1h); ⚠️ DEADLINE JUNE 30 2026 — apply immediately if pursuing",
    true,
    `Financial Controller — INTERPOL, Lyon, Fixed-term 36 months, Grade 3. Deadline: 30 June 2026.\n\nEDRM / Finance & Corporate Services Directorate. Reports to: Assistant Director, Financial Affairs.\n\nPrincipal duties:\n1. Lead financial records in compliance with IPSAS — GL, income/expenditure, balance sheet controls, monthly closure, collaboration with Treasury and AP heads\n2. Prepare annual financial statements (Balance Sheet, P&L, Cash Flow, Notes to financial statements) in compliance with IPSAS\n3. Manage external audit process — plan, coordinate, respond to auditors, implement recommendations\n4. Define financial policies, accounts and systems — financial regulations, directives, accounting system configuration, segregation of duties\n5. Lead accounting team (coordinators + technical accountants)\n6. Provide financial advice organization-wide\n\nRequirements: 5-year degree (Finance/Business), qualified accountant or equivalent, 8+ years financial reporting + team management, IFRS/IAS/IPSAS knowledge, SAP or similar ERP, BI tools, English fluent (essential), French highly desirable.\n\n100+ applicants. INTERPOL vacancy notice 1870.`,
    992, 'B','Transformation Focus','Potentially Apply'
  );

  await db.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
