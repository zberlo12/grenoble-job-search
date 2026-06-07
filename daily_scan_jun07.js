// daily_scan_jun07.js — scan_date 2026-06-07, user_profile zberlo
const {Client} = require(process.env.PG_MODULE);
const c = new Client({connectionString: process.env.PG_CONN});
const TODAY = '2026-06-07';
const U = 'zberlo';

// ── ROUTING DECISIONS (pre-analysed) ──────────────────────────────────────
const manualRows = [
  {id:874, source:'APEC', alertKw:null, title:null, company:null, url:'Not available', turl:'https://mail.google.com/mail/u/0/#all/19e97e727f02cb7a', notes:'APEC: 19 offres — check apec.fr manually', date:'2026-06-04'},
  {id:875, source:'Cadremploi', alertKw:'Directeur Financier OR DAF OR Finance Director', title:null, company:null, url:'Not available', turl:'https://mail.google.com/mail/u/0/#all/19e983a4aae13eef', notes:'Cadremploi HTML-only — open Gmail link to review and paste JD', date:'2026-06-04'},
  {id:876, source:'Cadremploi', alertKw:'Financial Controller OR Finance Manager', title:null, company:null, url:'Not available', turl:'https://mail.google.com/mail/u/0/#all/19e97541f01c5af5', notes:'Cadremploi HTML-only — open Gmail link to review and paste JD', date:'2026-06-04'},
  {id:877, source:'Cadremploi', alertKw:'Responsable Supply Chain OR Supply Chain Manager', title:'Supply Chain Manager France & Suisse', company:'Not disclosed', url:'Not available', turl:'https://mail.google.com/mail/u/0/#all/19e970c6ffea5559', notes:'Cadremploi HTML-only — open Gmail link to review and paste JD', date:'2026-06-04'},
  {id:878, source:'Cadremploi', alertKw:'Responsable Administratif et Financier OR RAF', title:null, company:null, url:'Not available', turl:'https://mail.google.com/mail/u/0/#all/19e970c6ffea5559', notes:'Cadremploi HTML-only — open Gmail link to review and paste JD', date:'2026-06-04'},
  {id:912, source:'Indeed', alertKw:'finance director', title:null, company:null, url:'Not available', turl:'https://mail.google.com/mail/u/0/#all/19e9e6a86b6631cb', notes:'Indeed multi 10 offres — featured VINCI RAF débutant (likely dup); open Gmail to review', date:'2026-06-06'},
  {id:913, source:'Cadremploi', alertKw:'Directeur Financier OR DAF OR Finance Director', title:null, company:null, url:'Not available', turl:'https://mail.google.com/mail/u/0/#all/19e9d57dbaaa36a1', notes:'Cadremploi HTML-only — open Gmail link to review and paste JD', date:'2026-06-06'},
  {id:914, source:'Cadremploi', alertKw:'Credit Manager OR Responsable Recouvrement', title:null, company:null, url:'Not available', turl:'https://mail.google.com/mail/u/0/#all/19e9c7c3c33d78b0', notes:'Cadremploi HTML-only — open Gmail link to review and paste JD', date:'2026-06-06'},
  {id:915, source:'Cadremploi', alertKw:'Responsable Administratif Financier OR RAF', title:null, company:null, url:'Not available', turl:'https://mail.google.com/mail/u/0/#all/19e9c7c3c33d78b0', notes:'Cadremploi HTML-only — open Gmail link to review and paste JD', date:'2026-06-06'},
  {id:916, source:'Cadremploi', alertKw:'Contrôleur de Gestion OR Pilote Financier', title:null, company:null, url:'Not available', turl:'https://mail.google.com/mail/u/0/#all/19e9c7c3c33d78b0', notes:'Cadremploi HTML-only — open Gmail link to review and paste JD', date:'2026-06-06'},
  {id:917, source:'Cadremploi', alertKw:'Responsable Achats OR Acheteur Senior', title:null, company:null, url:'Not available', turl:'https://mail.google.com/mail/u/0/#all/19e9c7c3c33d78b0', notes:'Cadremploi HTML-only — open Gmail link to review and paste JD', date:'2026-06-06'},
  {id:918, source:'APEC', alertKw:null, title:null, company:null, url:'Not available', turl:'https://mail.google.com/mail/u/0/#all/19e9c0f35fe58cda', notes:'APEC: 13 offres — check apec.fr manually', date:'2026-06-06'},
  {id:919, source:'Cadremploi', alertKw:'Responsable Administratif et Financier OR RAF', title:null, company:null, url:'Not available', turl:'https://mail.google.com/mail/u/0/#all/19e9c0e4f3ac1071', notes:'Cadremploi HTML-only — open Gmail link to review and paste JD', date:'2026-06-06'},
  {id:920, source:'Cadremploi', alertKw:'Responsable Supply Chain OR Supply Chain Manager', title:'Supply Chain Manager France & Suisse', company:'Not disclosed', url:'Not available', turl:'https://mail.google.com/mail/u/0/#all/19e9c0e4f3ac1071', notes:'Cadremploi HTML-only — open Gmail link to review and paste JD', date:'2026-06-06'},
  {id:922, source:'Cadremploi', alertKw:'Contrôleur de Gestion OR Contrôleur de Gestion Industriel OR Finance Business', title:null, company:null, url:'Not available', turl:'https://mail.google.com/mail/u/0/#all/19e9b292dfdc00c3', notes:'Cadremploi HTML-only — open Gmail link to review and paste JD', date:'2026-06-06'},
];

const dismissed = [
  {id:855, title:'Financial Controller - French Perimeter', company:'Alan', loc:'Paris, France', sal:null, url:'https://jobs.ashbyhq.com/alan/9b05fbb0-506a-4dd5-89e1-52540db950a9', src:'ashby-api', kw:null, eng:false, date:'2026-05-31', flags:['Far location'], notes:'Auto-dismissed: Paris location'},
  {id:885, title:'Responsable Administratif et Financier H/F', company:'Adsearch', loc:'67100', sal:null, url:'https://www.linkedin.com/jobs/view/4416516016/', src:'LinkedIn', kw:'Responsable Administratif et Financier', eng:false, date:'2026-06-04', flags:['Far location'], notes:'Auto-dismissed: 67100 = Strasbourg, far outside Grenoble area'},
  {id:894, title:"Responsable Achat Projets d'investissements F/H", company:'Framatome', loc:'Le Creusot (71)', sal:'55000-75000', url:'Not available', src:'Indeed', kw:'Framatome', eng:false, date:'2026-06-04', flags:['Far location','Off-topic'], notes:'Auto-dismissed: Le Creusot (71) far from Grenoble; procurement role'},
  {id:895, title:'Data Governance Officer F/H', company:'Framatome', loc:'Lyon (69)', sal:'50000-60000', url:'Not available', src:'Indeed', kw:'Framatome', eng:true, date:'2026-06-04', flags:['Off-topic'], notes:'Auto-dismissed: IT data governance role, not finance'},
  {id:898, title:'Directeur des opérations indépendant H/F', company:'PROD-ACTIVE', loc:'Grenoble (38)', sal:'30000-110000', url:'Not available', src:'Indeed', kw:'finance director', eng:false, date:'2026-06-04', flags:['Off-topic','Fixed-term'], notes:'Auto-dismissed: operations director + freelance platform'},
  {id:899, title:'DIRECTEUR DE MAGASIN F/H', company:'Centrakor', loc:"Saint-Martin-d'Hères (38)", sal:null, url:'Not available', src:'Indeed', kw:'finance director', eng:false, date:'2026-06-04', flags:['Off-topic'], notes:'Auto-dismissed: retail store director'},
  {id:900, title:'Directeur commercial indépendant H/F', company:'PROSPACTIVE', loc:'Grenoble (38)', sal:'30000-110000', url:'Not available', src:'Indeed', kw:'finance director', eng:false, date:'2026-06-04', flags:['Off-topic','Fixed-term'], notes:'Auto-dismissed: commercial director + freelance platform'},
  {id:901, title:'Directeur Commercial Adjoint H/F', company:'CBA Assurance', loc:'Échirolles (38)', sal:'41000-42000', url:'Not available', src:'Indeed', kw:'finance director', eng:false, date:'2026-06-04', flags:['Off-topic','Low salary'], notes:'Auto-dismissed: commercial role; salary 41-42K below floor'},
  {id:902, title:'Directeur des ressources humaines indépendant H/F', company:'DRH-ACTIVE', loc:'Grenoble (38)', sal:'30000-110000', url:'Not available', src:'Indeed', kw:'finance director', eng:false, date:'2026-06-04', flags:['Off-topic','Fixed-term'], notes:'Auto-dismissed: HR director + freelance platform'},
  {id:903, title:"Directeur d'agence H/F", company:'VITALIS MEDICAL', loc:'Voiron (38)', sal:null, url:'Not available', src:'Indeed', kw:'finance director', eng:false, date:'2026-06-04', flags:['Off-topic'], notes:'Auto-dismissed: healthcare staffing agency director'},
  {id:904, title:"Directeur d'agence H/F", company:'VITALIS MEDICAL', loc:'Grenoble (38)', sal:null, url:'Not available', src:'Indeed', kw:'finance director', eng:false, date:'2026-06-04', flags:['Off-topic'], notes:'Auto-dismissed: healthcare staffing agency director'},
  {id:905, title:"Directeur systèmes d'information indépendant H/F", company:'DSIACTIVE', loc:'Grenoble (38)', sal:'30000-110000', url:'Not available', src:'Indeed', kw:'finance director', eng:false, date:'2026-06-04', flags:['Off-topic'], notes:'Auto-dismissed: IT systems director'},
  {id:906, title:"Directeur d'agence H/F", company:'VITALIS MEDICAL', loc:'Tullins (38)', sal:null, url:'Not available', src:'Indeed', kw:'finance director', eng:false, date:'2026-06-04', flags:['Off-topic'], notes:'Auto-dismissed: healthcare staffing agency director'},
  {id:907, title:"Directeur d'agence H/F", company:'VITALIS MEDICAL', loc:'Chambéry (73)', sal:null, url:'Not available', src:'Indeed', kw:'finance director', eng:false, date:'2026-06-04', flags:['Off-topic'], notes:'Auto-dismissed: healthcare staffing agency director'},
  {id:908, title:"Directeur d'agence d'intérim et de recrutement indépendant H/F", company:'Lynx RH', loc:'Chambéry (73)', sal:null, url:'Not available', src:'Indeed', kw:'finance director', eng:false, date:'2026-06-04', flags:['Off-topic'], notes:'Auto-dismissed: staffing agency director'},
  {id:909, title:'Directrice/Directeur de Magasin Adjoint F/H', company:'Courir', loc:'Grenoble (38)', sal:null, url:'Not available', src:'Indeed', kw:'finance director', eng:false, date:'2026-06-04', flags:['Off-topic'], notes:'Auto-dismissed: retail store management'},
];

const needsInfo = [
  {id:879, title:'Lead Controls & Finance Enablement (d/f/m)', company:'Roche', loc:null, sal:null, url:'Not available', src:'LinkedIn', kw:'LinkedIn', eng:true, date:'2026-06-04', missing:['Location','Salary','Hybrid policy'], notes:'QUEUED: Roche finance/controls role — location and salary unconfirmed (subject-parsed)'},
  {id:880, title:"Responsable projet de la chaine d'approvisionnement (Project Supply Chain Manager) H/F", company:'GE Vernova', loc:null, sal:null, url:'Not available', src:'LinkedIn', kw:'LinkedIn', eng:false, date:'2026-06-04', missing:['Location','Salary'], notes:'OPERATIONAL ROLE — supply chain PM; verify if finance-adjacent scope; location unknown'},
  {id:881, title:'Finance Excellence Partner (d/f/m)', company:'Roche', loc:null, sal:null, url:'Not available', src:'LinkedIn', kw:'LinkedIn', eng:true, date:'2026-06-04', missing:['Location','Salary','Hybrid policy'], notes:'QUEUED: Roche Finance Excellence Partner — location and salary unconfirmed (subject-parsed)'},
  {id:882, title:'Responsable Comptabilité Clients F/H', company:'COURIR', loc:null, sal:null, url:'Not available', src:'LinkedIn', kw:'LinkedIn', eng:false, date:'2026-06-04', missing:['Location','Salary'], notes:'QUEUED: COURIR accounting role — location and salary unknown'},
  {id:883, title:'Acheteur Confirmé Industriel & Électronique H/F', company:'LYNRED', loc:null, sal:null, url:'Not available', src:'LinkedIn', kw:'Responsable Achats OR Acheteur', eng:false, date:'2026-06-04', missing:['Location','Salary'], notes:'OPERATIONAL ROLE — industrial buyer at LYNRED; verify if finance-adjacent; location unknown'},
  {id:884, title:"Manager d'Agence/Expert-Comptable ou Expert-comptable mémorialiste H/F", company:'Vie De Comptable by HappyCab', loc:null, sal:null, url:'Not available', src:'LinkedIn', kw:'Responsable Administratif et', eng:false, date:'2026-06-04', missing:['Location','Salary','Scope','Company name'], notes:'QUEUED: Expert-comptable management at HappyCab franchise — verify in-house vs agency scope'},
  {id:886, title:'Responsable Opérationnel Trésorerie', company:'MMG Millet Mountain Group', loc:'Annecy', sal:null, url:'https://www.linkedin.com/jobs/view/4422041368/', src:'LinkedIn', kw:'Responsable Administratif et Financier', eng:false, date:'2026-06-04', missing:['Salary','Hybrid policy'], notes:'QUEUED: Trésorerie at MMG Annecy (orange zone 1h) — confirm hybrid before applying'},
  {id:887, title:'Responsable de trésorerie h/f', company:'Sonepar France', loc:'Lyon', sal:null, url:'https://www.linkedin.com/jobs/view/4419285326/', src:'LinkedIn', kw:'Responsable Administratif et Financier', eng:false, date:'2026-06-04', missing:['Salary','Hybrid policy'], notes:'QUEUED: Trésorerie at Sonepar Lyon (orange zone 1h30) — need ≥3 days remote'},
  {id:888, title:'Chef de Projet ERP H/F', company:'OPEN-PROD', loc:null, sal:null, url:'Not available', src:'Direct', kw:'Chef de Projet ERP', eng:false, date:'2026-06-04', missing:['Location','Salary','Scope'], notes:'OPERATIONAL ROLE — ERP project management; verify finance-adjacent scope and location'},
  {id:889, title:'Responsable Comptable H/F', company:'Hays', loc:null, sal:null, url:'Not available', src:'Direct', kw:'Responsable Comptable', eng:false, date:'2026-06-04', missing:['Company name','Location','Salary'], notes:'QUEUED: Hays placement — actual employer, location and salary unknown'},
  {id:890, title:'Contrôleur de Gestion', company:'VINCI Energies', loc:'Grenoble (38)', sal:null, url:'Not available', src:'Indeed', kw:'Contrôleur de Gestion', eng:false, date:'2026-06-04', missing:['Salary'], notes:'QUEUED: VINCI Energies CDG Grenoble — green zone CDI; need salary confirmation'},
  {id:892, title:"Pilote Financier", company:"Société Dauphinoise pour l'Habitat", loc:'Grenoble (38)', sal:null, url:'Not available', src:'Indeed', kw:'Pilote Financier', eng:false, date:'2026-06-04', missing:['Salary'], notes:'QUEUED: SDH Pilote Financier Grenoble — green zone, known target; need salary'},
  {id:893, title:'Contrôleur de Gestion', company:'VMC Bois', loc:'Grenoble (38)', sal:null, url:'Not available', src:'Indeed', kw:'Contrôleur de Gestion', eng:false, date:'2026-06-04', missing:['Salary'], notes:'QUEUED: VMC Bois CDG Grenoble — green zone; need salary confirmation'},
  {id:896, title:'Responsable administratif et financier débutant F/H', company:'VINCI Energies', loc:'Chambéry (73)', sal:null, url:'https://fr.indeed.com/viewjob?jk=b258dab1ab5bbb', src:'Indeed', kw:'finance director', eng:false, date:'2026-06-04', missing:['Salary','Scope'], notes:'QUEUED: VINCI Energies RAF débutant Chambéry (yellow zone) — junior flag; verify YoE required'},
  {id:921, title:'Responsable de Dossiers H/F', company:'Ekko RH', loc:null, sal:null, url:'Not available', src:'Direct', kw:'Responsable de Dossiers', eng:false, date:'2026-06-06', missing:['Company name','Location','Full JD'], notes:'QUEUED: Ekko RH placement — actual employer, location, full JD all unknown'},
  {id:923, title:'Responsable Administratif et Financier de transition H/F', company:'Alma scop', loc:null, sal:null, url:'Not available', src:'LinkedIn', kw:'LinkedIn', eng:false, date:'2026-06-06', missing:['Location','Salary','Contract type'], notes:'QUEUED: Alma scop RAF de transition — posted 5/28; transition/interim scope and location unclear'},
];

const toAssessC = [
  {id:897, title:'Directeur administratif financier indépendant H/F', company:'DAF-ACTIVE', loc:'Grenoble (38)', sal:'30000-110000', url:'Not available', src:'Indeed', kw:'finance director', eng:false, date:'2026-06-04', missing:[], flags:['Fixed-term'], notes:'Freelance/portage DAF platform — not CDI; review only if open to independent consulting'},
];

const dupIds = [891, 910, 911];

const newCompanies = [
  {name:'Roche', loc:'Bâle / Grenoble', note:'Multinational pharma; Lead Controls + Finance Excellence Partner seen Jun 2026'},
  {name:'COURIR', loc:'France', note:'French sneaker retailer; Responsable Comptabilité Clients seen Jun 2026'},
  {name:'MMG Millet Mountain Group', loc:'Annecy', note:'Mountain sports group; Responsable Opérationnel Trésorerie seen Jun 2026'},
  {name:'Sonepar France', loc:'Lyon', note:'Electrical distribution; Responsable de trésorerie seen Jun 2026'},
  {name:'OPEN-PROD', loc:'Unknown', note:'ERP integrator; Chef de Projet ERP seen Jun 2026'},
  {name:'VMC Bois', loc:'Grenoble (38)', note:'Wood industry; Contrôleur de Gestion seen Jun 2026'},
];

const RQ = `INSERT INTO review_queue
  (job_title,company,source,location,salary,priority,status,date_added,
   job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id,user_profile)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id`;

const JA = `INSERT INTO job_applications
  (job_title,company,source,location,salary,priority,cv_approach,status,date_added,
   job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id,user_profile)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING id`;

const MARK = `UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2`;

async function run() {
  await c.connect();
  const stats = {rq:0, ja:0, dedup:0, co:0, errors:[]};

  for (const r of manualRows) {
    try {
      await c.query(RQ, [r.title||null, r.company||null, r.source, null, null,
        'B','Needs Info',r.date, r.url, r.turl, '[]','["Full JD"]', r.alertKw||null,
        'UNREADABLE: '+r.notes+' — open Gmail link to review and paste JD',
        false, null, r.id, U]);
      await c.query(MARK,[r.id,U]);
      stats.rq++;
    } catch(e){ stats.errors.push(`mc${r.id}:${e.message.slice(0,80)}`); }
  }

  for (const r of dismissed) {
    try {
      await c.query(JA, [r.title, r.company, r.src, r.loc, r.sal,
        'C','Standard','Dismissed',r.date,
        r.url, null, JSON.stringify(r.flags),'[]',
        r.kw||null, r.notes, r.eng, null, r.id, U]);
      await c.query(MARK,[r.id,U]);
      stats.ja++;
    } catch(e){ stats.errors.push(`di${r.id}:${e.message.slice(0,80)}`); }
  }

  for (const r of needsInfo) {
    try {
      await c.query(RQ, [r.title, r.company, r.src, r.loc, r.sal,
        'B','Needs Info',r.date,
        r.url, null, '[]', JSON.stringify(r.missing),
        r.kw||null, r.notes, r.eng, null, r.id, U]);
      await c.query(MARK,[r.id,U]);
      stats.rq++;
    } catch(e){ stats.errors.push(`ni${r.id}:${e.message.slice(0,80)}`); }
  }

  for (const r of toAssessC) {
    try {
      await c.query(RQ, [r.title, r.company, r.src, r.loc, r.sal,
        'C','To Assess',r.date,
        r.url, null, JSON.stringify(r.flags||[]), JSON.stringify(r.missing||[]),
        r.kw||null, r.notes, r.eng, null, r.id, U]);
      await c.query(MARK,[r.id,U]);
      stats.rq++;
    } catch(e){ stats.errors.push(`ca${r.id}:${e.message.slice(0,80)}`); }
  }

  for (const id of dupIds) {
    try { await c.query(MARK,[id,U]); stats.dedup++; }
    catch(e){ stats.errors.push(`dup${id}:${e.message.slice(0,60)}`); }
  }

  for (const co of newCompanies) {
    try {
      await c.query(
        `INSERT INTO target_companies (company,tier,location,notes,user_profile)
         VALUES ($1,'C',$2,$3,$4) ON CONFLICT DO NOTHING`,
        [co.name, co.loc, co.note, U]);
      stats.co++;
    } catch(e){ stats.errors.push(`co:${co.name}:${e.message.slice(0,60)}`); }
  }

  const ni = needsInfo.length + manualRows.length;
  const digest = `Job Scan Digest — ${TODAY}
════════════════════════════

${needsInfo.length+toAssessC.length+dismissed.length} new listings · ${needsInfo.length+toAssessC.length} pursued · ${dismissed.length} dismissed
(+${dupIds.length} duplicates skipped)

By Priority
  A → To Apply:      0
  B/C → To Assess:   ${toAssessC.length}  (DAF-ACTIVE freelance platform)
  Needs Info:        ${ni}  (${needsInfo.length} parsed + ${manualRows.length} unreadable HTML)
  Dismissed:         ${dismissed.length}  top reasons: Paris/far location, off-topic (ops/retail/HR/freelance)

Sources: LinkedIn 9 · Indeed 15 · APEC 2 · Cadremploi 13 · Direct 3 · ATS 0

Needs Info — parsed listings (open Gmail links / verify before action)
  • Lead Controls & Finance Enablement @ Roche — missing: Location, Salary, Hybrid
  • Finance Excellence Partner @ Roche — missing: Location, Salary, Hybrid
  • Responsable Comptabilité Clients @ COURIR — missing: Location, Salary
  • RAF débutant @ VINCI Energies Chambéry — missing: Salary, Scope (junior flag — verify YoE)
  • Pilote Financier @ SDH Grenoble — missing: Salary
  • Contrôleur de Gestion @ VINCI Energies Grenoble — missing: Salary
  • Contrôleur de Gestion @ VMC Bois Grenoble — missing: Salary
  • Responsable Opérationnel Trésorerie @ MMG Annecy — missing: Salary, Hybrid (orange zone)
  • Responsable de trésorerie @ Sonepar Lyon — missing: Salary, Hybrid (orange zone)
  • + 5 operational/subject-parsed (GE Vernova, LYNRED, OPEN-PROD, Hays/Ekko RH, Alma scop)
  + ${manualRows.length} UNREADABLE: APEC×2, Cadremploi×13

New companies → target list: ${stats.co}  (Roche, COURIR, MMG, Sonepar, OPEN-PROD, VMC Bois)
Run /job-search-target-companies C to check careers pages.

career-ops: 0 new roles  |  scan_archive: written ✅`;

  try {
    await c.query(`INSERT INTO scan_archive
      (scan_date,digest_text,total_found,potentially_apply,needs_info,to_assess,dismissed,user_profile)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (scan_date,user_profile) DO UPDATE SET
        digest_text=EXCLUDED.digest_text,total_found=EXCLUDED.total_found,
        potentially_apply=EXCLUDED.potentially_apply,needs_info=EXCLUDED.needs_info,
        to_assess=EXCLUDED.to_assess,dismissed=EXCLUDED.dismissed`,
      [TODAY, digest,
       needsInfo.length+toAssessC.length+dismissed.length,
       0, ni, toAssessC.length, dismissed.length, U]);
  } catch(e){ stats.errors.push(`archive:${e.message.slice(0,80)}`); }

  await c.end();
  console.log(JSON.stringify({...stats, digest}));
}
run().catch(e=>{console.error(e.message);process.exit(1);});
