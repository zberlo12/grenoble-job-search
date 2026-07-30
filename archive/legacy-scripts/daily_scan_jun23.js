'use strict';
const {Client} = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const db = new Client({connectionString: cfg.supabase_connection_string});
const U = cfg.user.profile_id;

const ROUTES = [
  // === PURE DUPLICATES (mark processed only) ===
  {action:'dup', id:1035, reason:'Duplicate of 1029 (Actual Talent RAF Echirolles)'},
  {action:'dup', id:1036, reason:'Duplicate of 1030 (TRIALP RAF Chambery)'},
  {action:'dup', id:1056, reason:'Duplicate of 1055 (TALENTS FINANCE CdG industrielle Voreppe)'},
  {action:'dup', id:1067, reason:'No Isere matches (Alencon, Berre-l Etang — outside zone)'},
  {action:'dup', id:1068, reason:'Duplicate of 1060 (KURIBAY RAF Isere — same Cadremploi alert)'},
  {action:'dup', id:1069, reason:'Duplicate of 1060 (KURIBAY RAF Isere — same Cadremploi alert)'},
  {action:'dup', id:1070, reason:'Duplicate of 1060 (KURIBAY RAF Isere — same Cadremploi alert)'},
  {action:'dup', id:1071, reason:'Duplicate of 1055/1056 (TALENTS FINANCE CdG Voreppe)'},
  {action:'dup', id:1080, reason:'Duplicate of 1079 (Actual Talent RAF Grenoble — same alert re-posted)'},

  // === DISMISSED ===
  {action:'dismiss', id:1033, job_title:'Charge etudes budgetaires et controle de gestion',
    company:'Pays Voironnais', source:'Indeed', location:'Voiron (38)', salary:'8256 EUR annuel',
    date_added:'2026-06-17', red_flags:['Low salary'],
    notes:'Auto-dismissed: public sector salary 8256/yr — far below floor',
    alert_keyword:'Charge de Gestion', english:false},
  {action:'dismiss', id:1034, job_title:'Alternant Controleur de Gestion',
    company:'MasterGrid', source:'LinkedIn', location:'Grenoble (38)', salary:null,
    date_added:'2026-06-17', red_flags:['Junior scope'],
    notes:'Auto-dismissed: alternant (apprentice) position',
    alert_keyword:'Controleur de Gestion', english:false},
  {action:'dismiss', id:1037, job_title:'Comptable H/F',
    company:'ZADIENT Technologies', source:'Indeed', location:'Sainte-Helene-du-Lac (73)', salary:'30000-40000 EUR/an',
    date_added:'2026-06-17', red_flags:['Low salary','Junior scope'],
    notes:'Auto-dismissed: accounting clerk 30-40K below salary floor',
    alert_keyword:'Comptable', english:false},
  {action:'dismiss', id:1039, job_title:'Charge Affaires travaux CVC',
    company:'EOLYA', source:'LinkedIn', location:'Saint-Martin-le-Vinoux (38)', salary:null,
    date_added:'2026-06-17', red_flags:['Off-topic'],
    notes:'Auto-dismissed: HVAC/construction role non-finance',
    alert_keyword:'Charge Affaires', english:false},
  {action:'dismiss', id:1040, job_title:'Manager Laser Game Evolution',
    company:'Laser Game Evolution', source:'LinkedIn', location:'La Ravoire (73)', salary:'31000-37000 EUR/an',
    date_added:'2026-06-17', red_flags:['Off-topic','Low salary'],
    notes:'Auto-dismissed: leisure industry manager non-finance',
    alert_keyword:'Manager', english:false},
  {action:'dismiss', id:1044, job_title:'Directeur Commercial',
    company:'Jean Lain Mobilites', source:'Indeed', location:'Chambery (73)', salary:'69000-90000 EUR/an',
    date_added:'2026-06-17', red_flags:['Off-topic'],
    notes:'Auto-dismissed: sales/commercial director not a finance role',
    alert_keyword:'Directeur Commercial', english:false},
  {action:'dismiss', id:1046, job_title:'Directeur agence interim et recrutement independant',
    company:'Lynx RH', source:'Indeed', location:'Chambery (73)', salary:'30000-55000 EUR/an',
    date_added:'2026-06-17', red_flags:['Off-topic'],
    notes:'Auto-dismissed: staffing agency franchise role non-finance',
    alert_keyword:'Directeur', english:false},
  {action:'dismiss', id:1047, job_title:'Directeur adjoint de village vacances',
    company:'CEVEO', source:'LinkedIn', location:'Allevard (38)', salary:'27000 EUR/an',
    date_added:'2026-06-17', red_flags:['Off-topic','Low salary'],
    notes:'Auto-dismissed: hospitality/leisure director non-finance 27K',
    alert_keyword:'Directeur', english:false},
  {action:'dismiss', id:1048, job_title:'Directeur periscolaire et ALSH',
    company:'EVADE', source:'Indeed', location:'Echirolles (38)', salary:'28000 EUR/an',
    date_added:'2026-06-17', red_flags:['Off-topic','Low salary'],
    notes:'Auto-dismissed: childcare/education director non-finance 28K',
    alert_keyword:'Directeur', english:false},
  {action:'dismiss', id:1049, job_title:'Directeur accueils de mineurs periscolaires',
    company:'Mairie de Bernin', source:'Indeed', location:'Bernin (38)', salary:null,
    date_added:'2026-06-17', red_flags:['Off-topic'],
    notes:'Auto-dismissed: municipal childcare director non-finance',
    alert_keyword:'Directeur', english:false},

  // === REVIEW QUEUE — Operational rescue gate ===
  {action:'rq', id:1038, job_title:'Manager de production equipe ICTSMMA',
    company:'Framatome', source:'LinkedIn', location:'Grenoble (38)', salary:'65000-70000 EUR/an',
    priority:'B', status:'Needs Info', date_added:'2026-06-17',
    red_flags:[], missing_info:['Scope'],
    notes:'OPERATIONAL ROLE — review for fit. Nuclear production manager 65-70K Green zone',
    alert_keyword:'Manager Production', english:false},
  {action:'rq', id:1041, job_title:'Directeur adjoint de groupe agence',
    company:'Banque de Savoie', source:'Indeed', location:'Saint-Alban-Leysse (73)', salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-17',
    red_flags:[], missing_info:['Salary','Scope'],
    notes:'OPERATIONAL ROLE — review for fit. Bank branch adjoint director Yellow zone',
    alert_keyword:'Directeur', english:false},
  {action:'rq', id:1043, job_title:'Directeur Adjoint',
    company:'Emeis', source:'Indeed', location:'Seyssins (38)', salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-17',
    red_flags:[], missing_info:['Salary','Scope'],
    notes:'OPERATIONAL ROLE — review for fit. Healthcare adjoint director Green zone scope unclear',
    alert_keyword:'Directeur', english:false},
  {action:'rq', id:1045, job_title:'Directeur de site automobile VO',
    company:'Actual Talent', source:'Indeed', location:'Seyssinet-Pariset (38)', salary:'60000-100000 EUR/an',
    priority:'B', status:'Needs Info', date_added:'2026-06-17',
    red_flags:[], missing_info:['Scope','Company name'],
    notes:'OPERATIONAL ROLE — review for fit. Auto site director via agency Green zone',
    alert_keyword:'Directeur', english:false},
  {action:'rq', id:1051, job_title:'Responsable Supply Chain Usine F/H',
    company:'Candia', source:'Cadremploi', location:'Vienne (38)', salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-17',
    red_flags:[], missing_info:['Salary','Scope'],
    notes:'OPERATIONAL ROLE — review for fit. Factory supply chain manager Candia Green zone Vienne',
    alert_keyword:'Responsable Supply Chain', english:false},
  {action:'rq', id:1054, job_title:'Gestionnaire planification H/F',
    company:'Groupe elydan', source:'Cadremploi', location:null, salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-17',
    red_flags:[], missing_info:['Salary','Location'],
    notes:'OPERATIONAL ROLE — review for fit. Elydan planning manager missing location',
    alert_keyword:'Responsable Planification', english:false},
  {action:'rq', id:1057, job_title:'Supply Chain Manager France Suisse F/H',
    company:'PERSONAE RECRUTEMENT', source:'Cadremploi', location:'Montbonnot-Saint-Martin (38)', salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-17',
    red_flags:[], missing_info:['Salary','Company name'],
    notes:'OPERATIONAL ROLE — review for fit. SCM France & Suisse via agency Green zone Montbonnot',
    alert_keyword:'Responsable Supply Chain', english:false},
  {action:'rq', id:1059, job_title:'Responsable Supply Chain H/F',
    company:'CONNEXIA', source:'Cadremploi', location:'Isere (38)', salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-17',
    red_flags:[], missing_info:['Salary','Location'],
    notes:'OPERATIONAL ROLE — review for fit. Resp Supply Chain via agency Isere',
    alert_keyword:'Responsable Supply Chain', english:false},

  // === REVIEW QUEUE — Finance roles ===
  {action:'rq', id:1029, job_title:'Responsable Administratif et Financier F/H',
    company:'Actual Talent', source:'Indeed', location:'Echirolles (38)', salary:'45000-50000 EUR/an',
    priority:'C', status:'To Assess', date_added:'2026-06-17',
    red_flags:['Low salary'], missing_info:['Company name'],
    notes:'Salary below 55K floor agency listing — check actual employer and scope',
    alert_keyword:'Responsable Administratif Financier', english:false},
  {action:'rq', id:1030, job_title:'Responsable Administratif et Financier H/F',
    company:'TRIALP', source:'Indeed', location:'Chambery (73)', salary:'45000-55000 EUR/an',
    priority:'C', status:'To Assess', date_added:'2026-06-17',
    red_flags:['Low salary'], missing_info:[],
    notes:'Yellow zone Chambery salary borderline — max 55K at floor threshold',
    alert_keyword:'Responsable Administratif Financier', english:false},
  {action:'rq', id:1031, job_title:'Controleur de Gestion R&D et Fonctions Corporate H/F',
    company:'Radiall', source:'LinkedIn', location:'Voreppe (38)', salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-17',
    red_flags:[], missing_info:['Salary'],
    notes:'QUEUED: Radiall target company Green zone Voreppe missing salary',
    alert_keyword:'Controleur de Gestion', english:false},
  {action:'rq', id:1032, job_title:'Controleur de Gestion Industriel H/F',
    company:'Groupe Elydan', source:'LinkedIn', location:'Saint-Etienne-de-Saint-Geoirs (38)', salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-17',
    red_flags:[], missing_info:['Salary'],
    notes:'QUEUED: Elydan target company Green zone missing salary',
    alert_keyword:'Controleur de Gestion', english:false},
  {action:'rq', id:1042, job_title:'Directeur Departement Surveillance',
    company:'Banque Populaire AURA', source:'Indeed', location:'Corenc (38)', salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-17',
    red_flags:[], missing_info:['Salary','Scope','Full JD'],
    notes:'QUEUED: Risk/compliance director at bank Green zone Corenc missing salary and JD',
    alert_keyword:'Directeur Financier', english:false},
  {action:'rq', id:1050, job_title:'Responsable Administratif et Financier F/H',
    company:'VINCI Energies France Industrie', source:'Cadremploi', location:'Saint-Jean-de-Moirans (38)', salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-17',
    red_flags:[], missing_info:['Salary'],
    notes:'QUEUED: VINCI Energies Green zone Moirans missing salary',
    alert_keyword:'Responsable Administratif Financier', english:false},
  {action:'rq', id:1052, job_title:'Senior FP&A Analytics and Automation Engineer',
    company:'BD', source:'LinkedIn', location:'Grenoble (38)', salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-19',
    red_flags:[], missing_info:['Salary'],
    notes:'QUEUED: BD (Becton Dickinson) senior FP&A English role Green zone Grenoble missing salary',
    alert_keyword:'FP&A', english:true},
  {action:'rq', id:1053, job_title:'Responsable application SI Finance domaine Tresorerie',
    company:'Artelia', source:'LinkedIn', location:null, salary:'60000 EUR/an',
    priority:'B', status:'Needs Info', date_added:'2026-06-19',
    red_flags:[], missing_info:['Location'],
    notes:'QUEUED: Artelia target company treasury IT system manager 60K missing location',
    alert_keyword:'Responsable Finance Tresorerie', english:false},
  {action:'rq', id:1055, job_title:'Controleur de gestion industrielle H/F',
    company:'Talents Finance', source:'Cadremploi', location:null, salary:'45000-48000 EUR/an',
    priority:'C', status:'Needs Info', date_added:'2026-06-17',
    red_flags:['Low salary'], missing_info:['Location','Company name'],
    notes:'Agency listing 45-48K below floor missing location and actual employer',
    alert_keyword:'Controleur de Gestion Industriel', english:false},
  {action:'rq', id:1058, job_title:'Credit Manager H/F',
    company:'SKILLS RH', source:'Cadremploi', location:null, salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-17',
    red_flags:[], missing_info:['Location','Company name','Salary'],
    notes:'QUEUED: Credit manager via agency missing location and salary — other listings in this alert outside zone',
    alert_keyword:'Credit Manager', english:false},
  {action:'rq', id:1060, job_title:'Responsable Administratif et Financier H/F futur DAF',
    company:'KURIBAY HR CONSULTING', source:'Cadremploi', location:'Isere (38)', salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-17',
    red_flags:[], missing_info:['Salary','Location','Company name'],
    notes:'QUEUED: RAF futur DAF via agency Isere — missing exact location and salary',
    alert_keyword:'Responsable Administratif Financier', english:false},
  {action:'rq', id:1072, job_title:'Controleur de Gestion Industriel Senior H/F',
    company:'RESEAU TALENTS', source:'Direct', location:null, salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-23',
    red_flags:[], missing_info:['Salary','Location','Company name'],
    notes:'QUEUED: CdG Senior via agency missing location and salary',
    alert_keyword:'Controleur de Gestion', english:false},
  {action:'rq', id:1073, job_title:'Controleur de Gestion Groupe H/F',
    company:'CDI Flex', source:'Direct', location:null, salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-21',
    red_flags:[], missing_info:['Salary','Location','Company name'],
    notes:'QUEUED: CdG Groupe via agency missing location and salary',
    alert_keyword:'Controleur de Gestion', english:false},
  {action:'rq', id:1074, job_title:'Controleur de Gestion',
    company:'Howmet Aerospace', source:'Direct', location:null, salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-23',
    red_flags:[], missing_info:['Salary','Location'],
    notes:'QUEUED: Howmet Aerospace direct email target company missing location and salary',
    alert_keyword:'Controleur de Gestion', english:false},
  {action:'rq', id:1075, job_title:'Controleur de Gestion H/F/X',
    company:'SAF Aerogroup', source:'LinkedIn', location:null, salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-23',
    red_flags:[], missing_info:['Salary','Location'],
    notes:'QUEUED: SAF Aerogroup CdG missing location and salary',
    alert_keyword:'Controleur de Gestion', english:false},
  {action:'rq', id:1076, job_title:'Project Administrative and Financial Manager CPM',
    company:'Siemens Energy', source:'LinkedIn', location:null, salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-22',
    red_flags:[], missing_info:['Salary','Location'],
    notes:'QUEUED: Siemens Energy English project finance manager missing location and salary',
    alert_keyword:'Controleur de Gestion', english:true},
  {action:'rq', id:1077, job_title:'Responsable administratif et financier H/F',
    company:'France Travail', source:'LinkedIn', location:'Grenoble (38)', salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-21',
    red_flags:[], missing_info:['Salary','Scope'],
    notes:'QUEUED: France Travail public employment agency RAF Green zone missing salary',
    alert_keyword:'Responsable Administratif Financier', english:false},
  {action:'rq', id:1078, job_title:'Directeur administratif et financier H/F',
    company:'CDG Conseil', source:'LinkedIn', location:'Grenoble (38)', salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-21',
    red_flags:[], missing_info:['Salary','Company name'],
    notes:'QUEUED: DAF via CDG Conseil recruitment Green zone missing actual employer and salary',
    alert_keyword:'Directeur Financier', english:false},
  {action:'rq', id:1079, job_title:'Responsable Administratif et Financier F/H',
    company:'Actual Talent Grenoble', source:'Indeed', location:'Grenoble (38)', salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-21',
    red_flags:[], missing_info:['Salary','Company name'],
    notes:'QUEUED: RAF Green zone Grenoble via Actual Talent missing salary and actual employer',
    alert_keyword:'Responsable Administratif Financier', english:false},

  // === From HelloWork 1061 multi-listing ===
  {action:'rq', id:1061, sub:'chapel', job_title:'Controleur de Gestion Industriel Multisites H/F',
    company:'Chapel SAS', source:'HelloWork', location:'Apprieu (38)', salary:'55000-70000 EUR/an',
    priority:'B', status:'To Assess', date_added:'2026-06-17',
    red_flags:[], missing_info:[],
    notes:'CdG industriel multisites Chapel SAS Green zone Apprieu salary 55-70K — strong fit',
    alert_keyword:'Controleur de Gestion', english:false},
  {action:'rq', id:1061, sub:'hays_fpa', job_title:'Controleur de Gestion Commercial FP&A H/F',
    company:'Hays Bernin', source:'HelloWork', location:'Bernin (38)', salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-17',
    red_flags:[], missing_info:['Salary','Company name'],
    notes:'QUEUED: CdG FP&A via Hays Green zone Bernin missing salary and actual employer',
    alert_keyword:'Controleur de Gestion', english:false},
  {action:'rq', id:1061, sub:'manpower', job_title:'Controleur de Gestion H/F Morestel',
    company:'Manpower Morestel', source:'HelloWork', location:'Morestel (38)', salary:null,
    priority:'C', status:'Needs Info', date_added:'2026-06-17',
    red_flags:[], missing_info:['Salary','Company name'],
    notes:'QUEUED: CdG via Manpower agency Green zone Morestel missing salary',
    alert_keyword:'Controleur de Gestion', english:false},
  {action:'rq', id:1061, sub:'hays_bj', job_title:'Controleur de Gestion H/F Bourgoin',
    company:'Hays Bourgoin-Jallieu', source:'HelloWork', location:'Bourgoin-Jallieu (38)', salary:'50000-55000 EUR/an',
    priority:'C', status:'To Assess', date_added:'2026-06-17',
    red_flags:['Low salary'], missing_info:['Company name'],
    notes:'CdG via Hays Bourgoin-Jallieu 50-55K salary borderline missing actual employer',
    alert_keyword:'Controleur de Gestion', english:false},
  {action:'rq', id:1061, sub:'kingjouet', job_title:'Controleur de Gestion Senior H/F',
    company:'King Jouet Recrutement', source:'HelloWork', location:'Voiron (38)', salary:'50000-60000 EUR/an',
    priority:'C', status:'Needs Info', date_added:'2026-06-17',
    red_flags:['Low salary'], missing_info:['Salary'],
    notes:'CdG Senior King Jouet Yellow zone Voiron salary 50-60K borderline',
    alert_keyword:'Controleur de Gestion', english:false},
  {action:'dismiss', id:1061, sub:'fitae', job_title:'Controleur de Gestion Industriel H/F Fitae',
    company:'Cabinet Fitae', source:'HelloWork', location:'Voreppe (38)', salary:'40000-45000 EUR/an',
    date_added:'2026-06-17', red_flags:['Low salary'],
    notes:'Auto-dismissed: 40-45K below salary floor',
    alert_keyword:'Controleur de Gestion', english:false},
  {action:'dismiss', id:1061, sub:'kj_low', job_title:'Controleur de Gestion H/F King Jouet Low',
    company:'King Jouet Low', source:'HelloWork', location:'Voiron (38)', salary:'37000-43000 EUR/an',
    date_added:'2026-06-17', red_flags:['Low salary'],
    notes:'Auto-dismissed: 37-43K below salary floor',
    alert_keyword:'Controleur de Gestion', english:false},
  {action:'dismiss', id:1061, sub:'industrie_recrute', job_title:'Controleur de Gestion Junior H/F CDD',
    company:'L industrie recrute', source:'HelloWork', location:'Belmont-Tramonet (73)', salary:null,
    date_added:'2026-06-17', red_flags:['Junior scope','Fixed-term'],
    notes:'Auto-dismissed: junior CDD role',
    alert_keyword:'Controleur de Gestion', english:false},

  // === From HelloWork 1062 multi-listing ===
  {action:'rq', id:1062, sub:'novae', job_title:'Responsable Achats Transport Logistique et Packaging H/F',
    company:'Novae', source:'HelloWork', location:'Sassenage (38)', salary:'42000-48000 EUR/an',
    priority:'B', status:'Needs Info', date_added:'2026-06-17',
    red_flags:['Low salary'], missing_info:['Scope'],
    notes:'OPERATIONAL ROLE — review for fit. Resp Achats Transport Novae 42-48K Green zone Sassenage',
    alert_keyword:'Responsable Supply Chain', english:false},
  {action:'rq', id:1062, sub:'bakertilly', job_title:'Consolideur Senior H/F',
    company:'Baker Tilly', source:'HelloWork', location:'Vienne (38)', salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-17',
    red_flags:[], missing_info:['Salary','Scope'],
    notes:'QUEUED: Senior consolidation Baker Tilly Green zone Vienne — verify if corporate or public accounting',
    alert_keyword:'Controleur de Gestion', english:false},
  {action:'rq', id:1062, sub:'riva', job_title:'Responsable Logistique Operationnel H/F',
    company:'Riva Group', source:'HelloWork', location:'Salaise-sur-Sanne (38)', salary:null,
    priority:'B', status:'Needs Info', date_added:'2026-06-17',
    red_flags:[], missing_info:['Salary','Scope'],
    notes:'OPERATIONAL ROLE — review for fit. Riva Group logistics manager Green zone missing salary',
    alert_keyword:'Responsable Supply Chain', english:false},
  {action:'dismiss', id:1062, sub:'focus1', job_title:'Chef de Mission Expertise Comptable H/F',
    company:'Focus Recrutement Grenoble', source:'HelloWork', location:'Grenoble (38)', salary:'50000-60000 EUR/an',
    date_added:'2026-06-17', red_flags:['Off-topic'],
    notes:'Auto-dismissed: public accounting firm chef de mission not corporate finance director',
    alert_keyword:'Controleur de Gestion', english:false},
  {action:'dismiss', id:1062, sub:'focus2', job_title:'Chef de Mission Comptable H/F',
    company:'Focus Recrutement Compta', source:'HelloWork', location:'Grenoble (38)', salary:'50000-60000 EUR/an',
    date_added:'2026-06-17', red_flags:['Off-topic'],
    notes:'Auto-dismissed: public accounting firm chef de mission not corporate finance director',
    alert_keyword:'Controleur de Gestion', english:false},
  {action:'dismiss', id:1062, sub:'bbm', job_title:'Comptable H/F BBM',
    company:'BBM et Associes', source:'HelloWork', location:'Seyssinet-Pariset (38)', salary:null,
    date_added:'2026-06-17', red_flags:['Junior scope','Off-topic'],
    notes:'Auto-dismissed: junior accounting role',
    alert_keyword:'Controleur de Gestion', english:false},
  {action:'dismiss', id:1062, sub:'btjunior', job_title:'Consolideur Junior H/F',
    company:'Baker Tilly Junior', source:'HelloWork', location:'Vienne (38)', salary:null,
    date_added:'2026-06-17', red_flags:['Junior scope'],
    notes:'Auto-dismissed: junior consolidation role',
    alert_keyword:'Controleur de Gestion', english:false},
];

const AGENCY_WORDS = ['agence','cabinet','recruteur','recrutement','talents finance','hays',
  'michael page','robert walters','actual talent','manpower','lynx rh','personae','skills rh',
  'connexia','cdi flex','reseau talents','kuribay','rh partenaires','bras droit'];

async function main() {
  await db.connect();

  const tcRes = await db.query(`SELECT LOWER(company) as co FROM target_companies WHERE user_profile=$1`, [U]);
  const existingCos = new Set(tcRes.rows.map(r => r.co));
  const newCos = [];

  const existRes = await db.query(`
    SELECT LOWER(company) as co, LOWER(job_title) as t FROM job_applications WHERE user_profile=$1
    UNION ALL
    SELECT LOWER(company) as co, LOWER(job_title) as t FROM review_queue WHERE user_profile=$1
  `, [U]);
  const existPairs = new Set(existRes.rows.map(r => r.co+'|'+r.t));

  let dupCount=0, dismissCount=0, rqCount=0, needsInfoCount=0, toAssessCount=0;
  const errorList=[];
  const processedIds = new Set();

  for (const route of ROUTES) {
    const {action, id, sub} = route;

    if (action === 'dup') {
      await db.query(`UPDATE listing_inbox SET parse_status='processed', parse_notes=$1 WHERE id=$2 AND user_profile=$3`,
        ['Skipped: '+route.reason, id, U]);
      dupCount++;
      processedIds.add(id);
      console.log(`DUP ${id}`);
      continue;
    }

    const coKey = (route.company||'').toLowerCase();
    const tKey = (route.job_title||'').toLowerCase();
    const pairKey = coKey+'|'+tKey;
    if (existPairs.has(pairKey)) {
      console.log(`SKIP_DEDUP ${id}${sub?'/'+sub:''}: already in DB`);
      if (!sub && !processedIds.has(id)) {
        await db.query(`UPDATE listing_inbox SET parse_status='processed', parse_notes='Duplicate: already in DB' WHERE id=$1 AND user_profile=$2`, [id, U]);
        processedIds.add(id);
      }
      dupCount++;
      continue;
    }
    existPairs.add(pairKey);

    const rf = JSON.stringify(route.red_flags||[]);
    const mi = JSON.stringify(route.missing_info||[]);

    try {
      if (action === 'dismiss') {
        await db.query(`INSERT INTO job_applications
          (job_title,company,source,location,salary,priority,cv_approach,status,date_added,
           job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,
           job_description,listing_inbox_id,user_profile)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
          [route.job_title,route.company,route.source,route.location,route.salary,
           null,'Standard','Dismissed',route.date_added,
           null,null,rf,mi,route.alert_keyword,route.notes,route.english||false,
           null,id,U]);
        dismissCount++;
        console.log(`DISMISS ${id}${sub?'/'+sub:''}: ${route.company}`);
      } else if (action === 'rq') {
        await db.query(`INSERT INTO review_queue
          (job_title,company,source,location,salary,priority,status,date_added,
           job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,
           job_description,listing_inbox_id,user_profile)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
          [route.job_title,route.company,route.source,route.location,route.salary,
           route.priority,route.status,route.date_added,
           null,null,rf,mi,route.alert_keyword,route.notes,route.english||false,
           null,id,U]);
        rqCount++;
        if (route.status==='Needs Info') needsInfoCount++; else toAssessCount++;
        console.log(`RQ ${id}${sub?'/'+sub:''} [${route.priority}/${route.status}]: ${route.company}`);

        const isAgency = AGENCY_WORDS.some(w => coKey.includes(w));
        if (!isAgency && !existingCos.has(coKey) && coKey && coKey!=='not disclosed') {
          existingCos.add(coKey);
          newCos.push({company:route.company, location:route.location});
        }
      }
    } catch(e) {
      errorList.push(`${id}${sub?'/'+sub:''}: ${e.message}`);
      console.log(`ERROR ${id}${sub?'/'+sub:''}: ${e.message}`);
    }

    if (!processedIds.has(id)) {
      await db.query(`UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2`, [id, U]);
      processedIds.add(id);
    }
  }

  let newCoCount=0;
  for (const nc of newCos) {
    try {
      await db.query(`INSERT INTO target_companies (company,tier,location,notes,user_profile)
        VALUES($1,'C',$2,'Auto-added from Jun 23 daily scan',$3) ON CONFLICT DO NOTHING`,
        [nc.company, nc.location, U]);
      newCoCount++;
      console.log(`NEW_CO: ${nc.company}`);
    } catch(e) { console.log(`CO_ERROR: ${nc.company} — ${e.message}`); }
  }

  const totalNew = dismissCount + rqCount;
  const digestText = [
    'Job Scan Digest — 2026-06-23',
    '════════════════════════════',
    '',
    `${totalNew} new listings · ${rqCount} pursued · ${dismissCount} dismissed`,
    `(+${dupCount} duplicates skipped)`,
    '',
    'By Priority',
    `  A → To Apply:      0`,
    `  B/C → To Assess:   ${toAssessCount}`,
    `  Needs Info:        ${needsInfoCount}`,
    `  Dismissed:         ${dismissCount}`,
    '',
    'Sources: LinkedIn 11 · Indeed 10 · Cadremploi 13 · HelloWork 3 · Direct 3 · APEC 3 (manual)',
    '',
    'Needs Info highlights:',
    '  • Senior FP&A Analytics @ BD — missing: Salary  (priority B)',
    '  • CdG Industriel Multisites @ Chapel SAS — Apprieu (38) €55-70K — B To Assess',
    '  • Directeur Département Surveillance @ Banque Populaire AURA — Corenc (38) — B',
    '  • CdG @ Howmet Aerospace — direct email, target company — B',
    '  • Project Admin Financial Manager @ Siemens Energy — English — B',
    '  • RAF futur/e DAF @ KURIBAY — Isère via Cadremploi — B',
    '  • Supply Chain Manager @ PERSONAE RECRUTEMENT — Montbonnot (38) — B (operational)',
    '',
    'APEC alerts: 3 — visit https://www.apec.fr/candidat/recherche-emploi.html',
    `  (Jun 19: 7 offres / 2 match, Jun 20: 21 offres / 7 match, Jun 23: 1 offre)`,
    '',
    `New companies added to target list: ${newCoCount}`,
    '',
    errorList.length ? 'ERRORS:\n' + errorList.join('\n') : 'No errors.',
    '',
    'scan_archive: written ✅'
  ].join('\n');

  await db.query(`INSERT INTO scan_archive
    (scan_date,digest_text,total_found,potentially_apply,needs_info,to_assess,dismissed,user_profile)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (scan_date,user_profile) DO UPDATE SET
      digest_text=EXCLUDED.digest_text, total_found=EXCLUDED.total_found,
      potentially_apply=EXCLUDED.potentially_apply, needs_info=EXCLUDED.needs_info,
      to_assess=EXCLUDED.to_assess, dismissed=EXCLUDED.dismissed`,
    ['2026-06-23', digestText, totalNew, 0, needsInfoCount, toAssessCount, dismissCount, U]);

  console.log('\n=== SUMMARY ===');
  console.log(`Duplicates skipped: ${dupCount}`);
  console.log(`Dismissed: ${dismissCount}`);
  console.log(`Review queue: ${rqCount} (Needs Info: ${needsInfoCount}, To Assess: ${toAssessCount})`);
  console.log(`New companies: ${newCoCount}`);
  console.log(`Errors: ${errorList.length}`);
  if (errorList.length) console.log(errorList.join('\n'));

  await db.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
