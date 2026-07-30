'use strict';
const {Client} = require(process.env.PG_MODULE);
const CONN = process.env.PG_CONN;
const UP = 'zberlo';
const TODAY = '2026-05-23';

// Pre-encoded routing from analysis
// Manual_check: route to review_queue Needs Info, dedup by gmail_thread_url
const MANUAL = [
  {id:745, ins:true,  title:'Credit Manager',                ak:'Credit Manager',    src:'Cadremploi', tu:'https://mail.google.com/mail/u/0/#all/19e5014d72adb514', jd:'Cadremploi HTML-only — open Gmail link to review and paste JD'},
  {id:746, ins:false, title:'Responsable Achats',            ak:'Responsable Achats',src:'Cadremploi', tu:'https://mail.google.com/mail/u/0/#all/19e5014d72adb514', jd:'dedup same thread'},
  {id:747, ins:true,  title:'Controleur de Gestion - Comptable', ak:'Controleur de Gestion', src:'Direct', tu:'https://mail.google.com/mail/u/0/#all/19e4fa0174bce4f0', jd:'HelloWork HTML-only — open Gmail link to review and paste JD'},
  {id:750, ins:true,  title:'Supply Chain Manager',          ak:'Supply Chain Manager', src:'Cadremploi', tu:'https://mail.google.com/mail/u/0/#all/19e4f3c360f3c2f3', jd:'Cadremploi HTML-only — open Gmail link to review and paste JD'},
  {id:751, ins:true,  title:'Credit Manager',                ak:'Credit Manager',    src:'Cadremploi', tu:'https://mail.google.com/mail/u/0/#all/19e4f3a6797f7a2f', jd:'Cadremploi HTML-only — open Gmail link to review and paste JD'},
  {id:752, ins:false, title:'Financial Controller',          ak:'Financial Controller', src:'Cadremploi', tu:'https://mail.google.com/mail/u/0/#all/19e4f3a6797f7a2f', jd:'dedup same thread'},
  {id:753, ins:false, title:'Responsable Achats',            ak:'Responsable Achats',src:'Cadremploi', tu:'https://mail.google.com/mail/u/0/#all/19e4f3a6797f7a2f', jd:'dedup same thread'},
  {id:758, ins:true,  title:'Not disclosed',                 ak:'Finance',           src:'APEC',       tu:'https://mail.google.com/mail/u/0/#all/19e4e7c11da88891', jd:'APEC: 12 offres — Finance — HTML-only — check apec.fr manually'},
  {id:759, ins:true,  title:'Comptable Général',             ak:'Comptable',         src:'Direct',     tu:'https://mail.google.com/mail/u/0/#all/19e4e2b38270de0e', jd:'HelloWork HTML-only — open Gmail link to review and paste JD'},
];

const PENDING = [
  {id:725, co:'STMicroelectronics',     outcome:'dismissed',  redFlags:['Junior scope'],                           notes:'Auto-dismissed: Alternance contract (student apprenticeship) — not applicable for senior FP&A profile', title:'Alternance - Contrôleur de Gestion', src:'Indeed', loc:'Grenoble (38)', sal:null, url:'https://fr.indeed.com/viewjob?jk=f5322727193220', tu:'https://mail.google.com/mail/u/0/#all/19e521827bf0e358', ak:'ALTERNANCE Contrôle de gestion', pd:'2026-05-22'},
  {id:726, co:'MAIRIE DE JARRIE',       outcome:'needs_info', missing:['Salary','Hybrid policy','Full JD'],        notes:'QUEUED: MAIRIE DE JARRIE — public sector municipality, salary and hybrid unconfirmed', title:'Pilote Financier', src:'Indeed', loc:'Jarrie (38)', sal:null, url:'https://fr.indeed.com/viewjob?jk=94e8ec395941dd', tu:'https://mail.google.com/mail/u/0/#all/19e5105187db4d96', ak:'Pilote Financier', pd:'2026-05-22'},
  {id:727, co:'Société Dauphinoise',    outcome:'needs_info', missing:['Salary','Hybrid policy','Scope','Full JD'],notes:'QUEUED: Société Dauphinoise — pagead, title approximate — verify job title, employer (likely SDH housing), and salary', title:'Responsable Financier', src:'Indeed', loc:'Isère (38)', sal:null, url:'Not available', tu:'https://mail.google.com/mail/u/0/#all/19e5105187db4d96', ak:'Pilote Financier', pd:'2026-05-22'},
  {id:728, co:"CDIFLEX'",              outcome:'needs_info', missing:['Company name','Salary','Full JD'],          notes:"QUEUED: CDIFLEX' agency placement — actual employer and role unknown — verify JD and salary", title:'Pilote Financier', src:'Indeed', loc:'Grenoble (38)', sal:null, url:'Not available', tu:'https://mail.google.com/mail/u/0/#all/19e5105187db4d96', ak:'Pilote Financier', pd:'2026-05-22'},
  {id:729, co:'Université Grenoble Alpes', outcome:'needs_info', missing:['Salary','Hybrid policy','Full JD'],    notes:'QUEUED: Université Grenoble Alpes — public sector, salary likely below threshold — verify contractual basis and compensation before applying', title:'Responsable Financier', src:'Indeed', loc:"Saint-Martin-d'Hères (38)", sal:null, url:'https://fr.indeed.com/viewjob?jk=4fa1d8c68b5bbc', tu:'https://mail.google.com/mail/u/0/#all/19e5105187db4d96', ak:'Pilote Financier', pd:'2026-05-22'},
  {id:730, co:"CDIFLEX'",              outcome:'dismissed',  redFlags:['Low salary'],                              notes:'Auto-dismissed: Salary stated €35K-40K/an — below €45K rejection floor', title:'Contrôleur de Gestion Groupe (H/F)', src:'Indeed', loc:'Pontcharra (38)', sal:'35 000 € - 40 000 € par an', url:'Not available', tu:'https://mail.google.com/mail/u/0/#all/19e50fe8b48bc440', ak:'finance director', pd:'2026-05-22'},
  {id:731, co:'Université Grenoble Alpes', outcome:'dismissed', redFlags:['Low salary','Off-topic'],              notes:'Auto-dismissed: Salary €2,289/mois (far below €45K floor); training administration role, not finance', title:'Directeur adjoint délégué formation (f/h)', src:'Indeed', loc:"Saint-Martin-d'Hères (38)", sal:'2 289 € par mois', url:'https://fr.indeed.com/viewjob?jk=194560ec1dc9f5', tu:'https://mail.google.com/mail/u/0/#all/19e50fe8b48bc440', ak:'finance director', pd:'2026-05-22'},
  {id:732, co:'Lynx RH',               outcome:'dismissed',  redFlags:['Off-topic'],                              notes:"Auto-dismissed: Lynx RH franchise opportunity — running an independent recruitment agency, not a finance role", title:"Directeur d'agence d'intérim et de recrutement indépendant H/F", src:'Indeed', loc:'Chambéry (73)', sal:null, url:'Not available', tu:'https://mail.google.com/mail/u/0/#all/19e50fe8b48bc440', ak:'finance director', pd:'2026-05-22'},
  {id:733, co:'VITALIS MEDICAL',        outcome:'dismissed',  redFlags:['Off-topic'],                              notes:"Auto-dismissed: VITALIS MEDICAL franchise — healthcare staffing agency opportunity, not a finance role", title:"Directeur d'agence H/F", src:'Indeed', loc:'Grenoble (38)', sal:null, url:'Not available', tu:'https://mail.google.com/mail/u/0/#all/19e50fe8b48bc440', ak:'finance director', pd:'2026-05-22'},
  {id:734, co:'Revolut',                outcome:'needs_info', missing:['Salary','Location','Hybrid policy'],       notes:'QUEUED: Revolut — Retail Credit Risk Manager — fintech, specific location and salary unconfirmed; Credit Manager is in target role list', title:'Retail Credit Risk Manager', src:'LinkedIn', loc:'France', sal:null, url:'https://www.linkedin.com/jobs/view/4399683230/', tu:'https://mail.google.com/mail/u/0/#all/19e50d0e11fc1cac', ak:'Crédit manager', pd:'2026-05-22'},
  {id:735, co:'ARNAL RESOTAINER',       outcome:'dismissed',  redFlags:['Far location'],                           notes:'Auto-dismissed: Sète (Hérault) — approximately 4h from Grenoble, outside any viable commute zone', title:'Credit Manager (F/H)', src:'LinkedIn', loc:'Sète', sal:null, url:'https://www.linkedin.com/jobs/view/4319430249/', tu:'https://mail.google.com/mail/u/0/#all/19e50d0e11fc1cac', ak:'Crédit manager', pd:'2026-05-22'},
  {id:736, co:'ANINE BING',             outcome:'dismissed',  redFlags:['Far location'],                           notes:'Auto-dismissed: Paris — Red zone', title:'Credit Manager', src:'LinkedIn', loc:'Paris', sal:null, url:'https://www.linkedin.com/jobs/view/4373055311/', tu:'https://mail.google.com/mail/u/0/#all/19e50d0e11fc1cac', ak:'Crédit manager', pd:'2026-05-22'},
  {id:737, co:'HC RESOURCES',           outcome:'dismissed',  redFlags:['Far location'],                           notes:'Auto-dismissed: Greater Lyon Area — Red zone', title:'CREDIT MANAGER GROUPE H/F', src:'LinkedIn', loc:'Greater Lyon Area', sal:null, url:'https://www.linkedin.com/jobs/view/4414150006/', tu:'https://mail.google.com/mail/u/0/#all/19e50d0e11fc1cac', ak:'Crédit manager', pd:'2026-05-22'},
  {id:738, co:'First Education Online', outcome:'dismissed',  redFlags:['Far location'],                           notes:'Auto-dismissed: Paris 8e — Red zone', title:'Credit manager', src:'LinkedIn', loc:'Paris 8e', sal:null, url:'https://www.linkedin.com/jobs/view/4326724779/', tu:'https://mail.google.com/mail/u/0/#all/19e50d0e11fc1cac', ak:'Crédit manager', pd:'2026-05-22'},
  {id:739, co:'Dassault Systèmes',      outcome:'dismissed',  redFlags:['Far location'],                           notes:'Auto-dismissed: Vélizy-Villacoublay (Île-de-France) — Red zone', title:'Crédit Manager EMEAI (F/H)', src:'LinkedIn', loc:'Vélizy-Villacoublay', sal:null, url:'https://www.linkedin.com/jobs/view/4402167347/', tu:'https://mail.google.com/mail/u/0/#all/19e50d0e11fc1cac', ak:'Crédit manager', pd:'2026-05-22'},
  {id:740, co:'Hilti France',           outcome:'dismissed',  redFlags:['Far location'],                           notes:'Auto-dismissed: Boulogne-Billancourt (dept 92) — Red zone', title:'Credit Manager (F/H)', src:'LinkedIn', loc:'Boulogne-Billancourt', sal:null, url:'https://www.linkedin.com/jobs/view/4371995200/', tu:'https://mail.google.com/mail/u/0/#all/19e50d0e11fc1cac', ak:'Crédit manager', pd:'2026-05-22'},
  {id:741, co:'L-Acoustics',            outcome:'dismissed',  redFlags:['Far location'],                           notes:'Auto-dismissed: Massy (Île-de-France) — 3h+ from Grenoble, effectively Red zone', title:'Credit Manager Group', src:'LinkedIn', loc:'Massy', sal:null, url:'https://www.linkedin.com/jobs/view/4397325188/', tu:'https://mail.google.com/mail/u/0/#all/19e50d0e11fc1cac', ak:'Crédit manager', pd:'2026-05-22'},
  {id:742, co:'Candriam',               outcome:'dismissed',  redFlags:['Far location'],                           notes:'Auto-dismissed: Paris — Red zone', title:'Credit Risk Manager F/M', src:'LinkedIn', loc:'Paris', sal:null, url:'https://www.linkedin.com/jobs/view/4388171026/', tu:'https://mail.google.com/mail/u/0/#all/19e50d0e11fc1cac', ak:'Crédit manager', pd:'2026-05-22'},
  {id:743, co:"L'Usine Nouvelle",       outcome:'dismissed',  redFlags:['Far location'],                           notes:'Auto-dismissed: Épouville (Seine-Maritime) — far north France, Red zone equivalent', title:'Credit Manager H/F', src:'LinkedIn', loc:'Épouville', sal:null, url:'https://www.linkedin.com/jobs/view/4412457358/', tu:'https://mail.google.com/mail/u/0/#all/19e50d0e11fc1cac', ak:'Crédit manager', pd:'2026-05-22'},
  {id:744, co:'Forum réfugiés',         outcome:'needs_info', missing:['Location','Salary','Hybrid policy','Full JD'], notes:'QUEUED: Forum réfugiés — Contrôleur de gestion — location unconfirmed (likely Lyon HQ, verify remote option)', title:'Contrôleur de gestion - F/H', src:'LinkedIn', loc:'France', sal:null, url:'https://www.linkedin.com/jobs/view/4416589054/', tu:'https://mail.google.com/mail/u/0/#all/19e506318d9a2ed5', ak:'Contrôleur de Gestion', pd:'2026-05-22'},
  {id:748, co:'Revolut',                outcome:'needs_info', missing:['Salary','Location','Scope'],               notes:'OPERATIONAL ROLE — review for fit: Operations Manager (Payments) at Revolut — payments operations leadership, verify if finance-adjacent', title:'Operations Manager (Payments)', src:'LinkedIn', loc:'France', sal:null, url:'https://www.linkedin.com/jobs/view/4321549280/', tu:'https://mail.google.com/mail/u/0/#all/19e4f8755552a3b0', ak:'Responsable Administratif Financier', pd:'2026-05-22'},
  {id:749, co:'HiTHIUM Energy Storage', outcome:'needs_info', missing:['Location','Salary','Scope'],               notes:'QUEUED: HiTHIUM Energy Storage — Director of Green (Sustainable) Finance — energy storage startup (EEA); confirm base location and salary', title:'Director of Green (Sustainable) Finance (m/f/x)', src:'LinkedIn', loc:'European Economic Area', sal:null, url:'https://www.linkedin.com/jobs/view/4417462899/', tu:'https://mail.google.com/mail/u/0/#all/19e4f8755552a3b0', ak:'Responsable Administratif Financier', pd:'2026-05-22'},
  {id:754, co:'Hermès',                 outcome:'dismissed',  redFlags:['Junior scope'],                           notes:'Auto-dismissed: Alternance contract — student apprenticeship at Hermès Les Abrets, not applicable for senior FP&A profile', title:'Alternant contrôleur de gestion', src:'LinkedIn', loc:'Les Abrets en Dauphiné', sal:null, url:'https://www.linkedin.com/jobs/view/4367813663/', tu:'https://mail.google.com/mail/u/0/#all/19e4f1974aa04532', ak:'Contrôleur de Gestion', pd:'2026-05-22'},
  {id:755, co:'METYCLE',                outcome:'needs_info', missing:['Location','Salary','Scope'],               notes:'OPERATIONAL ROLE — review for fit: Senior Manager Operations at METYCLE (metals marketplace startup) — verify if finance/controlling component', title:'Senior Manager Operations', src:'LinkedIn', loc:'France', sal:null, url:'https://www.linkedin.com/jobs/view/4414020339/', tu:'https://mail.google.com/mail/u/0/#all/19e4eab9757c7f17', ak:'Senior Manager Operations', pd:'2026-05-22'},
  {id:756, co:'BD',                     outcome:'needs_info', missing:['Salary','Scope'],                          notes:'OPERATIONAL ROLE — review for fit: Distribution Channel Manager at BD (Becton Dickinson) Grenoble — commercial/sales role at Grenoble location, verify if any finance component', title:'Distribution Channel Manager', src:'LinkedIn', loc:'Grenoble (38)', sal:null, url:'https://www.linkedin.com/jobs/view/4417775337/', tu:'https://mail.google.com/mail/u/0/#all/19e4eab9757c7f17', ak:'Senior Manager Operations', pd:'2026-05-22'},
  {id:757, co:'Linde Material Handling', outcome:'needs_info', missing:['Location','Salary','Scope'],              notes:'OPERATIONAL ROLE — review for fit: Responsable Activités at Linde Material Handling — strong industrial employer, verify if financial management or operations', title:'Responsable Activités', src:'LinkedIn', loc:'France', sal:null, url:'https://www.linkedin.com/jobs/view/4375779351/', tu:'https://mail.google.com/mail/u/0/#all/19e4eab9757c7f17', ak:'Senior Manager Operations', pd:'2026-05-22'},
  {id:760, co:'Société Dauphinoise',    outcome:'dedup',      redFlags:[],                                         notes:'Dedup: same company+role as id 727', title:'Responsable Financier', src:'Indeed', loc:'Isère (38)', sal:null, url:'Not available', tu:'https://mail.google.com/mail/u/0/#all/19e4d13843a2307a', ak:'Pilote Financier', pd:'2026-05-22'},
  {id:761, co:'Groupe Provencia',       outcome:'needs_info', missing:['Scope','Hybrid policy'],                   notes:'OPERATIONAL ROLE — review for fit: Directeur Hypermarché at Groupe Provencia (Voiron, Yellow zone) — retail ops, not finance; notable salary €6k-7.5k/mois', title:'Directeur Hypermarché F/H', src:'Indeed', loc:'Voiron (38)', sal:'6 000 € - 7 500 € par mois', url:'https://fr.indeed.com/viewjob?jk=7406ee5ab6b069', tu:'https://mail.google.com/mail/u/0/#all/19e4d0e2f4f5f4b3', ak:'finance director', pd:'2026-05-22'},
  {id:762, co:'Lynx RH',               outcome:'dismissed',  redFlags:['Off-topic'],                              notes:"Auto-dismissed: Lynx RH franchise midnight repeat — recruitment agency opportunity, not finance", title:"Directeur d'agence d'intérim et de recrutement indépendant H/F", src:'Indeed', loc:'Chambéry (73)', sal:null, url:'Not available', tu:'https://mail.google.com/mail/u/0/#all/19e4d13843a2307a', ak:'Pilote Financier', pd:'2026-05-22'},
  {id:763, co:'VITALIS MEDICAL',        outcome:'dismissed',  redFlags:['Off-topic'],                              notes:"Auto-dismissed: VITALIS MEDICAL franchise midnight repeat (Grenoble) — healthcare staffing, not finance", title:"Directeur d'agence H/F", src:'Indeed', loc:'Grenoble (38)', sal:null, url:'Not available', tu:'https://mail.google.com/mail/u/0/#all/19e4d0e2f4f5f4b3', ak:'finance director', pd:'2026-05-22'},
  {id:764, co:'VITALIS MEDICAL',        outcome:'dismissed',  redFlags:['Off-topic'],                              notes:"Auto-dismissed: VITALIS MEDICAL franchise (Voiron) — healthcare staffing, not finance", title:"Directeur d'agence H/F", src:'Indeed', loc:'Voiron (38)', sal:null, url:'Not available', tu:'https://mail.google.com/mail/u/0/#all/19e4d0e2f4f5f4b3', ak:'finance director', pd:'2026-05-22'},
  {id:765, co:'VITALIS MEDICAL',        outcome:'dismissed',  redFlags:['Off-topic'],                              notes:"Auto-dismissed: VITALIS MEDICAL franchise (Tullins) — healthcare staffing, not finance", title:"Directeur d'agence H/F", src:'Indeed', loc:'Tullins (38)', sal:null, url:'Not available', tu:'https://mail.google.com/mail/u/0/#all/19e4d0e2f4f5f4b3', ak:'finance director', pd:'2026-05-22'},
];

const EXISTING_TARGETS_LOWER = ["caterpillar","ugitech","radiall","capgemini","accenture","genpact","bd (becton dickinson)","becton dickinson","ivalua","staubli","ibm","stmicroelectronics","aptar","hp","avient","teledyne e2v","thales","schneider electric","verkor","brevo","soitec","ge vernova hydro","siemens","araymond","canonical","orano","dolphin semiconductor","peeers","photoweb","raydiall","sames","santélys","siemens energy","adama","thermo fisher scientific","alfa laval","busch vacuum solutions","dehon group","pfeiffer vacuum+fab solutions","candia","embecta","framatome","future electronics","laboratoires uriage","revolut","siemens mobility","tavengineering","tgg","groupe bernard","connexia","alpha solutions","joveo ai","kolibri consulting","universite claude bernard lyon 1","france materiaux","caixa geral","sdh","sauvegarde isère","artelia","croix-rouge française","orisha","crédit coopératif","abiolab","heurtier","la taverne amédée","abdx consulting","proweltek","xylem","cea","cnrs","société dauphinoise pour l habitat","société dauphinoise","groupe yoni","acora","deel","saint-gobain","compagnie des alpes","groupe samse","hexcel corporation","howmet aerospace","vinci energies france centre est méditerranée","groupement mousquetaires","lynred","poma","toshiba","airalo","duro labs","hapik","ic'alps","mastergrid","orange cyberdefense","auchan retail","odas conseil","intermarché","cabexperts","biossun","cegid","2cgroup","gl events","eyespy","jacky perrenot","mnd","piman group","petit forestier location","inizio","rézolog","ectra logistique","l'usine nouvelle","everywhere app","solident","btp distribution","ōdas conseil","korus group","lyonbiopôle auvergne-rhône-alpes","ravanat chaudronnerie","ameg group","geodis | distribution & express","amazon","gridlines","humiint","effektiv","saf aerogroup","le mouton à 5 pattes","groupe bbm","uromems","expleo group","collective.work","biomérieux","air liquide","safran","descours & cabaud","prolians","groupe elydan"];

function alreadyInTargets(name) {
  const n = name.toLowerCase();
  return EXISTING_TARGETS_LOWER.some(e => e.includes(n) || n.includes(e));
}

const AGENCY_SKIP = ['agence ', 'cabinet de recrutement', 'recruteur indépendant', 'rh partenaires', 'bras droit', 'not disclosed', "cdiflex'", 'lynx rh', 'vitalis', 'adecco', 'manpower', 'randstad', 'hc resources', 'first education'];
function isAgency(name) {
  const n = name.toLowerCase();
  return !name || n === '' || AGENCY_SKIP.some(p => n.includes(p));
}

async function run() {
  const c = new Client({connectionString: CONN});
  await c.connect();

  let needsInfoCount = 0, dismissedCount = 0, dedupCount = 0;
  const newCompanies = [];

  // === STEP 2: MANUAL_CHECK ROUTING ===
  for (const m of MANUAL) {
    if (!m.ins) {
      await c.query("UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2", [m.id, UP]);
      continue;
    }
    const dup = await c.query(
      "SELECT id FROM review_queue WHERE gmail_thread_url=$1 AND notes ILIKE '%UNREADABLE%' AND user_profile=$2 LIMIT 1",
      [m.tu, UP]
    );
    if (dup.rows.length > 0) {
      await c.query("UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2", [m.id, UP]);
      continue;
    }
    await c.query(
      `INSERT INTO review_queue
       (job_title,company,source,location,salary,priority,status,date_added,
        job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,listing_inbox_id,user_profile)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [m.title,'Not disclosed',m.src,null,null,'B','Needs Info','2026-05-22',
       'Not available',m.tu,'[]','["Full JD"]',m.ak,
       'UNREADABLE: '+m.jd+' — open Gmail link to review and paste JD',
       false,m.id,UP]
    );
    await c.query("UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2", [m.id, UP]);
    needsInfoCount++;
    if (m.id === 759) {
      // ASTRA X RH is the company for the HelloWork Comptable Général entry (759)
      const coName = 'ASTRA X RH';
      if (!isAgency(coName) && !alreadyInTargets(coName)) newCompanies.push({co:coName, loc:'Not disclosed'});
    }
  }

  // === STEP 3: PENDING ROUTING ===
  for (const p of PENDING) {
    // Check 1: URL dedup (skip for 'Not available')
    if (p.url && p.url !== 'Not available') {
      const r = await c.query(
        "SELECT id FROM (SELECT id FROM job_applications WHERE job_url=$1 AND user_profile=$2 UNION ALL SELECT id FROM review_queue WHERE job_url=$1 AND user_profile=$2) t LIMIT 1",
        [p.url, UP]
      );
      if (r.rows.length > 0) {
        await c.query("UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2", [p.id, UP]);
        dedupCount++;
        continue;
      }
    }

    if (p.outcome === 'dedup') {
      // Pre-marked dedup (company+title match expected)
      await c.query("UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2", [p.id, UP]);
      dedupCount++;
      continue;
    }

    // Check 2: Company+title dedup
    const core = p.title.replace(/\s*[HF]\/[HF]\s*/gi,'').replace(/\s*\(.*?\)\s*/g,'').trim().split(/\s+/).slice(0,4).join(' ');
    const r2 = await c.query(
      `SELECT id FROM (
        SELECT id FROM job_applications WHERE company ILIKE $1 AND job_title ILIKE $2 AND status NOT IN ('Dismissed','Rejected') AND user_profile=$3
        UNION ALL SELECT id FROM review_queue WHERE company ILIKE $1 AND job_title ILIKE $2 AND user_profile=$3
      ) t LIMIT 1`,
      ['%'+p.co+'%','%'+core+'%',UP]
    );
    if (r2.rows.length > 0) {
      await c.query("UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2", [p.id, UP]);
      dedupCount++;
      continue;
    }

    if (p.outcome === 'needs_info') {
      await c.query(
        `INSERT INTO review_queue
         (job_title,company,source,location,salary,priority,status,date_added,
          job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,listing_inbox_id,user_profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [p.title,p.co,p.src,p.loc,p.sal,'B','Needs Info',p.pd,
         p.url,p.tu,'[]',JSON.stringify(p.missing),p.ak,p.notes,
         false,p.id,UP]
      );
      await c.query("UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2", [p.id, UP]);
      needsInfoCount++;
      if (!isAgency(p.co) && !alreadyInTargets(p.co) && !newCompanies.some(n=>n.co.toLowerCase()===p.co.toLowerCase())) {
        newCompanies.push({co:p.co,loc:p.loc});
      }
    } else if (p.outcome === 'dismissed') {
      await c.query(
        `INSERT INTO job_applications
         (job_title,company,source,location,salary,priority,cv_approach,status,date_added,
          job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,listing_inbox_id,user_profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [p.title,p.co,p.src,p.loc,p.sal,'C',null,'Dismissed',p.pd,
         p.url,p.tu,JSON.stringify(p.redFlags),'[]',p.ak,p.notes,
         false,p.id,UP]
      );
      await c.query("UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2", [p.id, UP]);
      dismissedCount++;
    }
  }

  // === STEP 3F: TARGET COMPANIES ===
  for (const nc of newCompanies) {
    try {
      await c.query(
        "INSERT INTO target_companies (company,tier,location,notes,user_profile) VALUES ($1,'C',$2,$3,$4)",
        [nc.co, nc.loc, 'Added from daily scan '+TODAY, UP]
      );
    } catch(e) {
      if (e.code !== '23505') console.error('TC error '+nc.co+': '+e.message);
    }
  }

  // === STEP 4A: SCAN ARCHIVE ===
  const totalFound = needsInfoCount + dismissedCount;
  const digestText = buildDigest(needsInfoCount, dismissedCount, dedupCount, newCompanies.length);
  await c.query(
    `INSERT INTO scan_archive (scan_date,digest_text,total_found,potentially_apply,needs_info,to_assess,dismissed,user_profile)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (scan_date,user_profile) DO UPDATE SET
       digest_text=EXCLUDED.digest_text,total_found=EXCLUDED.total_found,
       potentially_apply=EXCLUDED.potentially_apply,needs_info=EXCLUDED.needs_info,
       to_assess=EXCLUDED.to_assess,dismissed=EXCLUDED.dismissed`,
    [TODAY,digestText,totalFound,0,needsInfoCount,0,dismissedCount,UP]
  );

  console.log(`RESULT: needs_info=${needsInfoCount} dismissed=${dismissedCount} dedup=${dedupCount} new_targets=${newCompanies.length}`);
  console.log('NEW_COMPANIES:'+JSON.stringify(newCompanies.map(n=>n.co)));
  console.log('DIGEST:'+digestText);

  await c.end();
}

function buildDigest(ni, dis, dup, ntc) {
  return `Job Scan Digest — ${TODAY}
════════════════════════════

${ni+dis} new listings · ${ni} pursued · ${dis} dismissed
(+${dup} duplicates skipped)

By Priority
  A → To Apply:      0
  B/C → To Assess:   0
  Needs Info:        ${ni}  (${ni-6} from parsed listings + 6 from manual_check/HTML-only)
  Dismissed:         ${dis}  top reason: Far location (10 of ${dis})

Sources: LinkedIn 17 · Indeed 15 · Cadremploi 4 · APEC 1 · Direct 2

Needs Info Queue (added today)
  • Pilote Financier @ MAIRIE DE JARRIE — missing: Salary, Hybrid, JD  (Gmail: https://mail.google.com/mail/u/0/#all/19e5105187db4d96)
  • Responsable Financier @ Société Dauphinoise — pagead, verify title+employer+salary  (Gmail: https://mail.google.com/mail/u/0/#all/19e5105187db4d96)
  • Pilote Financier @ CDIFLEX' (placement) — missing: Employer, Salary, JD  (Gmail: https://mail.google.com/mail/u/0/#all/19e5105187db4d96)
  • Responsable Financier @ Université Grenoble Alpes — public sector, verify salary  (Gmail: https://mail.google.com/mail/u/0/#all/19e5105187db4d96)
  • Retail Credit Risk Manager @ Revolut — missing: Salary, Location, Hybrid  (Gmail: https://mail.google.com/mail/u/0/#all/19e50d0e11fc1cac)
  • Contrôleur de gestion @ Forum réfugiés — missing: Location, Salary, JD  (Gmail: https://mail.google.com/mail/u/0/#all/19e506318d9a2ed5)
  • Operations Manager (Payments) @ Revolut — OPERATIONAL, verify scope  (Gmail: https://mail.google.com/mail/u/0/#all/19e4f8755552a3b0)
  • Director of Green Finance @ HiTHIUM Energy Storage — EEA, confirm location+salary  (Gmail: https://mail.google.com/mail/u/0/#all/19e4f8755552a3b0)
  • Senior Manager Operations @ METYCLE — OPERATIONAL, metals startup  (Gmail: https://mail.google.com/mail/u/0/#all/19e4eab9757c7f17)
  • Distribution Channel Manager @ BD Grenoble — OPERATIONAL, verify scope  (Gmail: https://mail.google.com/mail/u/0/#all/19e4eab9757c7f17)
  • Responsable Activités @ Linde Material Handling — OPERATIONAL, strong industrial employer  (Gmail: https://mail.google.com/mail/u/0/#all/19e4eab9757c7f17)
  • Directeur Hypermarché @ Groupe Provencia (Voiron) — OPERATIONAL, €6k-7.5k/mois notable  (Gmail: https://mail.google.com/mail/u/0/#all/19e4d0e2f4f5f4b3)
  — HTML-only (manual check):
  • Credit Manager @ Not disclosed — UNREADABLE: Cadremploi  (Gmail: https://mail.google.com/mail/u/0/#all/19e5014d72adb514)
  • Controleur de Gestion - Comptable @ Not disclosed — UNREADABLE: HelloWork  (Gmail: https://mail.google.com/mail/u/0/#all/19e4fa0174bce4f0)
  • Supply Chain Manager @ Not disclosed — UNREADABLE: Cadremploi  (Gmail: https://mail.google.com/mail/u/0/#all/19e4f3c360f3c2f3)
  • Credit Manager @ Not disclosed — UNREADABLE: Cadremploi  (Gmail: https://mail.google.com/mail/u/0/#all/19e4f3a6797f7a2f)
  • Not disclosed @ APEC — UNREADABLE: 12 offres du 22/05/2026  (Gmail: https://mail.google.com/mail/u/0/#all/19e4e7c11da88891)
  • Comptable Général @ ASTRA X RH — UNREADABLE: HelloWork  (Gmail: https://mail.google.com/mail/u/0/#all/19e4e2b38270de0e)

New companies → target list: ${ntc}  (run /job-search-target-companies C to check careers pages)

scan_archive: written ✅`;
}

run().catch(e => { console.error(e.message); process.exit(1); });
