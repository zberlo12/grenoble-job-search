// Daily scan batch insert — 2026-06-27
const {Client} = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const c = new Client({connectionString: 'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'});

const UP = 'zberlo';
const d23 = '2026-06-24'; // Jun 23 email in Europe/Paris
const d24 = '2026-06-25'; // Jun 24 email in Europe/Paris
const d26 = '2026-06-27'; // Jun 26 (career-ops)

// review_queue inserts: Needs Info B + C
const rq = [
  // row 1083
  {job_title:'Contrôleur de Gestion International H/F', company:'W Executive France', source:'LinkedIn', location:'Greater Lyon Area', salary:null, priority:'B', status:'Needs Info', date_added:d23, job_url:'https://www.linkedin.com/jobs/view/4430922880/', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19efc0c4cb34969f', red_flags:'[]', missing_info:'["Salary","Hybrid policy","Full JD","Company name"]', alert_keyword:'LinkedIn', notes:'QUEUED: CDG International via W Executive France (executive search). Lyon area (orange zone).', english:false, listing_inbox_id:1083},
  // row 1085 - LYNRED different title vs DB (Achats Indirects vs Support Achats)
  {job_title:'Manager Achats Indirects H/F', company:'LYNRED', source:'LinkedIn', location:'Grenoble (38)', salary:null, priority:'B', status:'Needs Info', date_added:d23, job_url:'https://www.linkedin.com/jobs/view/4431209532/', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19efb9e7e5a45690', red_flags:'[]', missing_info:'["Salary","Hybrid policy","Scope","Full JD"]', alert_keyword:'Responsable Achats', notes:'OPERATIONAL ROLE — review for fit. Indirect purchasing manager at LYNRED (infrared sensors). Green zone Grenoble.', english:false, listing_inbox_id:1085},
  // row 1086
  {job_title:'Acheteur/Acheteuse', company:'Vulcain Engineering Group', source:'LinkedIn', location:'Grenoble (38)', salary:null, priority:'B', status:'Needs Info', date_added:d23, job_url:'https://www.linkedin.com/jobs/view/4432257313/', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19efb9e7e5a45690', red_flags:'[]', missing_info:'["Salary","Hybrid policy","Scope","Full JD"]', alert_keyword:'Responsable Achats', notes:'OPERATIONAL ROLE — review for fit. Buyer at Vulcain Engineering Group, Grenoble.', english:false, listing_inbox_id:1086},
  // row 1090
  {job_title:'Project manager / Chef de Projet Industriel H/F', company:'SGL Group', source:'Indeed', location:'Saint-Martin-d’Hères (38)', salary:null, priority:'B', status:'Needs Info', date_added:d23, job_url:'https://fr.indeed.com/viewjob?jk=0ca1710d68c730', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19efb25ea8e815e7', red_flags:'[]', missing_info:'["Salary","Hybrid policy","Scope","Full JD"]', alert_keyword:'Pilote Financier', notes:'OPERATIONAL ROLE — review for fit. Industrial project manager at SGL Group (carbon materials). Green zone.', english:false, listing_inbox_id:1090},
  // row 1091
  {job_title:'Gestionnaire de la commande publique F/H', company:'Ville de Chambéry', source:'Indeed', location:'Chambéry (73)', salary:null, priority:'B', status:'Needs Info', date_added:d23, job_url:'https://fr.indeed.com/viewjob?jk=db0ce45a8e8272', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19efb25ea8e815e7', red_flags:'[]', missing_info:'["Salary","Hybrid policy","Scope","Full JD"]', alert_keyword:'Pilote Financier', notes:'OPERATIONAL ROLE — review for fit. Public procurement officer, municipal government Chambéry. Yellow zone.', english:false, listing_inbox_id:1091},
  // row 1095
  {job_title:'Manager Logistique H/F', company:'DECATHLON FRANCE', source:'LinkedIn', location:'Frontonas (38)', salary:null, priority:'B', status:'Needs Info', date_added:d23, job_url:'https://www.linkedin.com/jobs/view/4432285362/', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19efa54de0b988f6', red_flags:'[]', missing_info:'["Salary","Hybrid policy","Scope","Full JD"]', alert_keyword:'Responsable Supply Chain', notes:'OPERATIONAL ROLE — review for fit. Logistics manager at Decathlon warehouse, Frontonas.', english:false, listing_inbox_id:1095},
  // row 1096
  {job_title:'Manager Logistique H/F', company:'DECATHLON FITNESS LAB', source:'LinkedIn', location:'Frontonas (38)', salary:null, priority:'B', status:'Needs Info', date_added:d23, job_url:'https://www.linkedin.com/jobs/view/4432403125/', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19efa54de0b988f6', red_flags:'[]', missing_info:'["Salary","Hybrid policy","Scope","Full JD"]', alert_keyword:'Responsable Supply Chain', notes:'OPERATIONAL ROLE — review for fit. Logistics manager at Decathlon Fitness Lab warehouse, Frontonas.', english:false, listing_inbox_id:1096},
  // row 1097
  {job_title:'Analyste financier Senior / Associate Financement et M&A', company:'Waga Energy', source:'LinkedIn', location:'Eybens (38)', salary:null, priority:'B', status:'Needs Info', date_added:d23, job_url:'https://www.linkedin.com/jobs/view/4432033574/', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19ef9e7e9ecdac27', red_flags:'[]', missing_info:'["Salary","Hybrid policy","Scope"]', alert_keyword:'Contrôleur de Gestion', notes:'QUEUED: Senior finance analyst (M&A/financing) at Waga Energy (biomethane/energy transition). Green zone Eybens.', english:false, listing_inbox_id:1097},
  // row 1099
  {job_title:'Gestionnaire Comptable et Ressources Humaines H/F', company:'Maison de l’Emploi et de la Formation des Pays Voironnais et Sud Grésivaudan', source:'LinkedIn', location:'Voiron (38)', salary:null, priority:'B', status:'Needs Info', date_added:d23, job_url:'https://www.linkedin.com/jobs/view/4432283135/', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19ef90b6ed111982', red_flags:'[]', missing_info:'["Salary","Scope","Full JD"]', alert_keyword:'Responsable Administratif et Financier', notes:'QUEUED: Combined accounting/HR manager at public employment agency. Yellow zone Voiron.', english:false, listing_inbox_id:1099},
  // row 1118
  {job_title:'Materials Planner 3', company:'Lam Research', source:'LinkedIn', location:'Meylan (38)', salary:null, priority:'B', status:'Needs Info', date_added:d24, job_url:'https://www.linkedin.com/jobs/view/4413588194/', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19efdc3d9d1043fd', red_flags:'[]', missing_info:'["Salary","Hybrid policy","Scope","Full JD"]', alert_keyword:'Supply Chain', notes:'OPERATIONAL ROLE — review for fit. Supply chain planner at Lam Research (semiconductors). Green zone Meylan. English-language environment.', english:true, listing_inbox_id:1118},
  // row 1100 sub: RAF via Fonction:Support
  {job_title:'Responsable Administratif et Financier H/F', company:'Not disclosed (via Fonction:Support)', source:'Direct', location:'Grenoble (38)', salary:'55 000 - 65 000 € / an', priority:'B', status:'Needs Info', date_added:d23, job_url:'Not available', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19ef807d48a45c2b', red_flags:'["Fixed-term"]', missing_info:'["Company name","Hybrid policy","Full JD"]', alert_keyword:'HelloWork', notes:'QUEUED: RAF via Fonction:Support agency. Green zone Grenoble. CDD 55-65K. Employer not disclosed.', english:false, listing_inbox_id:1100},
  // row 1100 sub: Responsable Comptable et Admin
  {job_title:'Responsable Comptable et Administratif H/F', company:'Not disclosed (via Fonction:Support)', source:'Direct', location:'Grenoble (38)', salary:'55 000 - 65 000 € / an', priority:'B', status:'Needs Info', date_added:d23, job_url:'Not available', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19ef807d48a45c2b', red_flags:'["Fixed-term"]', missing_info:'["Company name","Hybrid policy","Full JD"]', alert_keyword:'HelloWork', notes:'QUEUED: Accounting/admin manager via Fonction:Support. Green zone Grenoble. CDD 55-65K. Employer not disclosed.', english:false, listing_inbox_id:1100},
  // row 1100 sub: Responsable CDG et Finance
  {job_title:'Responsable Contrôle de Gestion et Finance H/F', company:'Not disclosed (via Fonction:Support)', source:'Direct', location:'Grenoble (38)', salary:'55 000 - 65 000 € / an', priority:'B', status:'Needs Info', date_added:d23, job_url:'Not available', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19ef807d48a45c2b', red_flags:'["Fixed-term"]', missing_info:'["Company name","Hybrid policy","Full JD"]', alert_keyword:'HelloWork', notes:'QUEUED: Controlling & Finance manager via Fonction:Support. Green zone Grenoble. CDD 55-65K. Employer not disclosed.', english:false, listing_inbox_id:1100},
  // row 1100 sub: Adsearch RAF/Comptable
  {job_title:'Responsable Administratif et Comptable H/F', company:'Adsearch', source:'Direct', location:'Saint-Étienne-de-Saint-Geoirs (38)', salary:'50 000 - 60 000 € / an', priority:'B', status:'Needs Info', date_added:d23, job_url:'Not available', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19ef807d48a45c2b', red_flags:'[]', missing_info:'["Company name","Hybrid policy","Full JD"]', alert_keyword:'HelloWork', notes:'QUEUED: Admin/accounting manager via Adsearch (agency). Saint-Étienne-de-Saint-Geoirs (38). CDI 50-60K. Employer not disclosed.', english:false, listing_inbox_id:1100},
  // row 1100 sub: Groupe Piment Logistique (OPERATIONAL)
  {job_title:'Responsable Logistique H/F', company:'Groupe Piment', source:'Direct', location:'Rives (38)', salary:null, priority:'B', status:'Needs Info', date_added:d23, job_url:'Not available', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19ef807d48a45c2b', red_flags:'[]', missing_info:'["Salary","Hybrid policy","Full JD"]', alert_keyword:'HelloWork', notes:'OPERATIONAL ROLE — review for fit. Logistics manager at Groupe Piment, Rives (38). CDI.', english:false, listing_inbox_id:1100},
  // row 1119 sub: EIMI Acheteur Projet (OPERATIONAL)
  {job_title:'Acheteur Projet H/F', company:'EIMI', source:'Direct', location:'Plan (38)', salary:null, priority:'B', status:'Needs Info', date_added:d24, job_url:'Not available', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19efe1edfad7bc26', red_flags:'[]', missing_info:'["Salary","Hybrid policy","Scope","Full JD"]', alert_keyword:'HelloWork', notes:'OPERATIONAL ROLE — review for fit. Project buyer at EIMI, Plan (38). CDI.', english:false, listing_inbox_id:1119},
  // row 1100 sub: SIDAS Responsable Comptable - C priority (low salary)
  {job_title:'Responsable Comptable H/F', company:'SIDAS', source:'Direct', location:'Voiron (38)', salary:'42 000 - 44 000 € / an', priority:'C', status:'To Assess', date_added:d23, job_url:'Not available', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19ef807d48a45c2b', red_flags:'["Low salary"]', missing_info:'[]', alert_keyword:'HelloWork', notes:'Responsable Comptable at SIDAS (sports/medical products), Voiron. CDI. Salary 42-44K below floor.', english:false, listing_inbox_id:1100},
];

// job_applications Dismissed
const ja = [
  {job_title:'Finance Expert - Fully Remote', company:'Mercor', source:'LinkedIn', location:'Paris / Remote', salary:'Upto $100/hr', priority:'C', cv_approach:'Standard', status:'Dismissed', date_added:d23, job_url:'https://www.linkedin.com/jobs/view/4431468559/', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19efc0c4cb34969f', red_flags:'["Off-topic"]', missing_info:'[]', alert_keyword:'LinkedIn', notes:'Auto-dismissed: gig/freelance AI matching platform, not a CDI position.', english:true, listing_inbox_id:1084},
  {job_title:"Directeur d'agence d'intérim et de recrutement indépendant H/F", company:'Lynx RH', source:'Indeed', location:'Chambéry (73)', salary:"De 30 à 55 EUR de l'heure", priority:'C', cv_approach:'Standard', status:'Dismissed', date_added:d23, job_url:'Not available', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19efabe1713f5bb8', red_flags:'["Off-topic"]', missing_info:'[]', alert_keyword:'finance director', notes:'Auto-dismissed: staffing agency franchise director, not corporate finance.', english:false, listing_inbox_id:1093},
  {job_title:"Directeur d'agence expertise comptable H/F", company:'Fiducial', source:'Indeed', location:'France', salary:null, priority:'C', cv_approach:'Standard', status:'Dismissed', date_added:d23, job_url:'Not available', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19efabe1713f5bb8', red_flags:'["Off-topic"]', missing_info:'[]', alert_keyword:'finance director', notes:'Auto-dismissed: accounting firm agency director, not corporate finance.', english:false, listing_inbox_id:1094},
  {job_title:'Directeur(trice) de Maison de quartier', company:'CCAS Saint-Martin-d’Hères', source:'Indeed', location:'Saint-Martin-d’Hères (38)', salary:'26 €/h', priority:'C', cv_approach:'Standard', status:'Dismissed', date_added:d24, job_url:'https://fr.indeed.com/viewjob?jk=5a9c6a4d35394d', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19f01112cce8cbbc', red_flags:'["Off-topic"]', missing_info:'[]', alert_keyword:'Pilote Financier', notes:'Auto-dismissed: community center director, social/public sector — not finance.', english:false, listing_inbox_id:1106},
  {job_title:"Directeur adjoint de groupe d'agence F/H", company:'Banque de Savoie', source:'Indeed', location:'La Ravoire (73)', salary:null, priority:'C', cv_approach:'Standard', status:'Dismissed', date_added:d24, job_url:'https://fr.indeed.com/viewjob?jk=bed51e9d7c68d5', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19f00abff9498542', red_flags:'["Off-topic"]', missing_info:'[]', alert_keyword:'finance director', notes:'Auto-dismissed: bank branch deputy director, not corporate finance.', english:false, listing_inbox_id:1109},
  {job_title:'Directeur(rice) Commercial(e) H/F', company:'APPERTON', source:'Indeed', location:'Échirolles (38)', salary:'7 800 €/mois', priority:'C', cv_approach:'Standard', status:'Dismissed', date_added:d24, job_url:'https://fr.indeed.com/viewjob?jk=3a4fa955a5506b', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19f00abff9498542', red_flags:'["Off-topic"]', missing_info:'[]', alert_keyword:'finance director', notes:'Auto-dismissed: commercial/sales director, not finance.', english:false, listing_inbox_id:1110},
  {job_title:'Établissement médico-social H/F', company:'Fondation Partage et Vie', source:'Indeed', location:'Saint-Ismier (38)', salary:null, priority:'C', cv_approach:'Standard', status:'Dismissed', date_added:d24, job_url:'https://fr.indeed.com/viewjob?jk=31bf0ca9f17874', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19f00abff9498542', red_flags:'["Off-topic"]', missing_info:'[]', alert_keyword:'finance director', notes:'Auto-dismissed: healthcare institution director, not finance.', english:false, listing_inbox_id:1111},
  {job_title:"Directeur/Directrice d'Association", company:'LA SASSON', source:'Indeed', location:'Saint-Alban-Leysse (73)', salary:'70 000 - 80 000 €/an', priority:'C', cv_approach:'Standard', status:'Dismissed', date_added:d24, job_url:'https://fr.indeed.com/viewjob?jk=a953aedc63248d', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19f00abff9498542', red_flags:'["Off-topic"]', missing_info:'[]', alert_keyword:'finance director', notes:'Auto-dismissed: nonprofit association director, not finance.', english:false, listing_inbox_id:1112},
  {job_title:'Directeur adjoint de village vacances H/F', company:'CEVEO', source:'Indeed', location:'Allevard (38)', salary:'2 268 €/mois', priority:'C', cv_approach:'Standard', status:'Dismissed', date_added:d24, job_url:'https://fr.indeed.com/viewjob?jk=b38021d6d7e81f', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19f00abff9498542', red_flags:'["Off-topic","Fixed-term","Low salary"]', missing_info:'[]', alert_keyword:'finance director', notes:'Auto-dismissed: holiday village deputy director, CDD, very low salary.', english:false, listing_inbox_id:1113},
  {job_title:'Directeur de restaurant H/F', company:'Burger King St Etienne de St Geoirs', source:'Indeed', location:'Saint-Étienne-de-Saint-Geoirs (38)', salary:null, priority:'C', cv_approach:'Standard', status:'Dismissed', date_added:d24, job_url:'Not available', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19f00abff9498542', red_flags:'["Off-topic"]', missing_info:'[]', alert_keyword:'finance director', notes:'Auto-dismissed: restaurant director.', english:false, listing_inbox_id:1114},
  {job_title:'Alternance - Contrôleur de Gestion de Projets H/F', company:'Air Liquide', source:'LinkedIn', location:'Sassenage (38)', salary:null, priority:'C', cv_approach:'Standard', status:'Dismissed', date_added:d24, job_url:'https://www.linkedin.com/jobs/view/4413445006/', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19efe9fed8ac3339', red_flags:'["Junior scope"]', missing_info:'[]', alert_keyword:'Contrôleur de Gestion Industriel', notes:'Auto-dismissed: alternance/apprenticeship, junior scope.', english:false, listing_inbox_id:1116},
  {job_title:'Ingénieur responsable de service du SACO H/F', company:'Communauté de communes de l’Oisans', source:'LinkedIn', location:"Le Bourg-d'Oisans (38)", salary:null, priority:'C', cv_approach:'Standard', status:'Dismissed', date_added:d24, job_url:'https://www.linkedin.com/jobs/view/4429828596/', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19efe31a11175717', red_flags:'["Off-topic","Far location"]', missing_info:'[]', alert_keyword:'Responsable Administratif et Financier', notes:'Auto-dismissed: engineering/technical service manager for mountain community — not finance.', english:false, listing_inbox_id:1117},
  {job_title:'Strategic Finance Manager', company:'Hightouch', source:'greenhouse-api', location:'Remote (North America)', salary:null, priority:'C', cv_approach:'Standard', status:'Dismissed', date_added:d26, job_url:'https://job-boards.greenhouse.io/hightouch/jobs/6101147004', gmail_thread_url:null, red_flags:'["Far location"]', missing_info:'[]', alert_keyword:'career-ops', notes:'Auto-dismissed: North America remote only, outside France/Grenoble search zone.', english:true, listing_inbox_id:1127},
  {job_title:'Credit Manager F/H', company:'MICHAEL PAGE', source:'Direct', location:'Alênon (61)', salary:null, priority:'C', cv_approach:'Standard', status:'Dismissed', date_added:d23, job_url:'Not available', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19efac7ef8cd8e49', red_flags:'["Far location"]', missing_info:'[]', alert_keyword:'Cadremploi', notes:'Auto-dismissed: far location (Alênon, Normandy).', english:false, listing_inbox_id:1102},
  {job_title:'Financial Controller F/H', company:'MICHAEL PAGE', source:'Direct', location:'Alênon (61)', salary:null, priority:'C', cv_approach:'Standard', status:'Dismissed', date_added:d24, job_url:'Not available', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19f00abff9498542', red_flags:'["Far location"]', missing_info:'[]', alert_keyword:'Cadremploi', notes:'Auto-dismissed: far location (Alênon, Normandy).', english:false, listing_inbox_id:1123},
  {job_title:'Cost Controller H/F', company:'PARLYM', source:'Direct', location:'Berre-l’Étang (13)', salary:null, priority:'C', cv_approach:'Standard', status:'Dismissed', date_added:d24, job_url:'Not available', gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19f00abff9498542', red_flags:'["Far location"]', missing_info:'[]', alert_keyword:'Cadremploi', notes:'Auto-dismissed: far location (near Marseille).', english:false, listing_inbox_id:1123},
];

const allIds = [1081,1082,1083,1084,1085,1086,1087,1088,1089,1090,1091,1092,1093,1094,1095,1096,1097,1098,1099,1100,1101,1102,1103,1104,1106,1107,1108,1109,1110,1111,1112,1113,1114,1115,1116,1117,1118,1119,1120,1121,1122,1123,1124,1125,1127];

const newCompanies = [
  {company:'Waga Energy', location:'Eybens (38)', notes:'Biomethane/energy transition. Finance analyst role spotted 2026-06-27.'},
  {company:'Vulcain Engineering Group', location:'Grenoble (38)', notes:'Engineering firm. Acheteur role spotted 2026-06-27.'},
  {company:'SGL Group', location:'Saint-Martin-d’Hères (38)', notes:'Carbon materials manufacturer. Project manager role spotted 2026-06-27.'},
  {company:'Decathlon', location:'Frontonas (38)', notes:'Sports retail/logistics. Manager Logistique roles spotted 2026-06-27.'},
  {company:'Lam Research', location:'Meylan (38)', notes:'Semiconductor equipment. English-language environment. Materials Planner role spotted 2026-06-27.'},
  {company:'EIMI', location:'Plan (38)', notes:'Engineering/industrial. Project buyer role spotted 2026-06-27.'},
  {company:'Groupe Piment', location:'Rives (38)', notes:'Logistics/industry. Responsable Logistique role spotted 2026-06-27.'},
  {company:'SIDAS', location:'Voiron (38)', notes:'Sports/medical products. Responsable Comptable role spotted 2026-06-27.'},
  {company:'LYNRED', location:'Grenoble (38)', notes:'Infrared sensor manufacturer (Sofradir + Ulis). Finance/purchasing roles spotted.'},
];

async function run() {
  await c.connect();
  let rqInserted = 0, jaInserted = 0, newCo = 0, errors = [];

  for (const r of rq) {
    try {
      await c.query(
        `INSERT INTO review_queue (job_title,company,source,location,salary,priority,status,date_added,job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id,user_profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [r.job_title,r.company,r.source,r.location,r.salary,r.priority,r.status,r.date_added,r.job_url,r.gmail_thread_url,r.red_flags,r.missing_info,r.alert_keyword,r.notes,r.english,null,r.listing_inbox_id,UP]
      );
      rqInserted++;
    } catch(e) { errors.push({table:'review_queue', title:r.job_title, err:e.message}); }
  }

  for (const r of ja) {
    try {
      await c.query(
        `INSERT INTO job_applications (job_title,company,source,location,salary,priority,cv_approach,status,date_added,job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id,user_profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
        [r.job_title,r.company,r.source,r.location,r.salary,r.priority,r.cv_approach,r.status,r.date_added,r.job_url,r.gmail_thread_url,r.red_flags,r.missing_info,r.alert_keyword,r.notes,r.english,null,r.listing_inbox_id,UP]
      );
      jaInserted++;
    } catch(e) { errors.push({table:'job_applications', title:r.job_title, err:e.message}); }
  }

  // Mark all listing_inbox rows processed
  const markRes = await c.query(
    `UPDATE listing_inbox SET parse_status='processed' WHERE id=ANY($1) AND user_profile=$2 RETURNING id`,
    [allIds, UP]
  );

  // Insert new target companies (skip if already exists)
  for (const co of newCompanies) {
    try {
      const exists = await c.query(
        `SELECT id FROM target_companies WHERE company ILIKE $1 AND user_profile=$2`,
        ['%' + co.company + '%', UP]
      );
      if (exists.rows.length === 0) {
        await c.query(
          `INSERT INTO target_companies (company,tier,location,notes,user_profile) VALUES ($1,'C',$2,$3,$4)`,
          [co.company, co.location, co.notes, UP]
        );
        newCo++;
      }
    } catch(e) { errors.push({table:'target_companies', company:co.company, err:e.message}); }
  }

  const result = {
    rqInserted,
    jaInserted,
    allIds_marked: markRes.rows.length,
    newCo,
    errors: errors.length > 0 ? errors : 'none',
  };
  console.log(JSON.stringify(result, null, 2));
  await c.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
