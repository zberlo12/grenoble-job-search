const {Client}=require(process.env.PG_MODULE);
const c=new Client({connectionString:process.env.PG_CONN});

const rows=[
  // R1: APEC
  {parse_date:'2026-05-21',gmail_thread_id:'19e497948759c69c',
   gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e497948759c69c',
   source:'APEC',alert_keyword:null,job_title:null,company:null,location:null,salary:null,
   job_url:'Not available',contract_type:null,parse_status:'manual_check',
   parse_notes:'APEC: 3 offres — HTML-only — check apec.fr manually',english:false,
   raw_snippet:'Voici une sélection d offres d emploi 2 offres correspondent à votre recherche',
   raw_body:'3 offres Apec du 21/05/2026 | Voici une sélection d offres d emploi 2 offres correspondent à votre recherche'.substring(0,500)},

  // R2: LinkedIn Hermès
  {parse_date:'2026-05-21',gmail_thread_id:'19e4c1865f60556a',
   gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e4c1865f60556a',
   source:'LinkedIn',alert_keyword:'Contrôleur de Gestion',
   job_title:'Alternant contrôleur de gestion',company:'Hermès',
   location:'Les Abrets en Dauphiné',salary:null,
   job_url:'https://www.linkedin.com/comm/jobs/view/4367813663/',
   contract_type:null,parse_status:'pending',parse_notes:null,english:false,
   raw_snippet:'Hermès Alternant contrôleur de gestion: Les Maroquineries des Alpes sont logées au sein',
   raw_body:'Alternant contrôleur de gestion at Hermès | Les Maroquineries des Alpes sont logées au sein de HERMES SAS. Recherche alert: Contrôleur de Gestion OR Responsable Contrôle de Gestion in Grenoble'.substring(0,8000)},

  // R3: LinkedIn CHU Grenoble Alpes
  {parse_date:'2026-05-21',gmail_thread_id:'19e4baac386abc94',
   gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e4baac386abc94',
   source:'LinkedIn',alert_keyword:'Responsable Administratif Financier',
   job_title:'Gestionnaire Comptable et Achat - H/F',company:'CHU Grenoble Alpes',
   location:'Saint-Laurent-du-Pont',salary:null,
   job_url:'https://www.linkedin.com/comm/jobs/view/4417073489/',
   contract_type:null,parse_status:'pending',parse_notes:null,english:false,
   raw_snippet:'CHU Grenoble Alpes Gestionnaire Comptable et Achat - H/F: Le Centre Hospitalier de Saint-Laurent-du-Pont',
   raw_body:'Gestionnaire Comptable et Achat - H/F at CHU Grenoble Alpes | Centre Hospitalier de Saint-Laurent-du-Pont. Alert: Responsable Administratif Financier OR RAF in Grenoble'.substring(0,8000)},

  // R4: LinkedIn LYNRED Supply Chain (listing 1)
  {parse_date:'2026-05-21',gmail_thread_id:'19e4b3cad3b5ffaf',
   gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e4b3cad3b5ffaf',
   source:'LinkedIn',alert_keyword:'Responsable Supply Chain',
   job_title:'MANAGER SUPPORT ACHATS & SUPPLY CHAIN H/F',company:'LYNRED',
   location:'Région de Grenoble',salary:null,
   job_url:'https://www.linkedin.com/comm/jobs/view/4417085646/',
   contract_type:null,parse_status:'pending',parse_notes:null,english:false,
   raw_snippet:'LYNRED MANAGER SUPPORT ACHATS & SUPPLY CHAIN H/F: À propos de LYNRED - Rejoindre LYNRED',
   raw_body:'Responsable Supply Chain alert | LYNRED MANAGER SUPPORT ACHATS & SUPPLY CHAIN H/F - Région de Grenoble | 3-listing alert'.substring(0,8000)},

  // R5: LinkedIn Roche (listing 2)
  {parse_date:'2026-05-21',gmail_thread_id:'19e4b3cad3b5ffaf',
   gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e4b3cad3b5ffaf',
   source:'LinkedIn',alert_keyword:'Responsable Supply Chain',
   job_title:'Manager Inventory & Planning (d/f/m)',company:'Roche',
   location:'Meylan',salary:null,
   job_url:'https://www.linkedin.com/comm/jobs/view/4417396559/',
   contract_type:null,parse_status:'pending',parse_notes:null,english:true,
   raw_snippet:'Roche Manager Inventory & Planning (d/f/m) - Meylan',
   raw_body:'Responsable Supply Chain alert | Roche Manager Inventory & Planning (d/f/m) - Meylan'.substring(0,8000)},

  // R6: LinkedIn LD Connexion (listing 3)
  {parse_date:'2026-05-21',gmail_thread_id:'19e4b3cad3b5ffaf',
   gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e4b3cad3b5ffaf',
   source:'LinkedIn',alert_keyword:'Responsable Supply Chain',
   job_title:'Responsable de Site Logistique H/F',company:'LD Connexion',
   location:'Saint-Quentin-Fallavier',salary:null,
   job_url:'https://www.linkedin.com/comm/jobs/view/4417093879/',
   contract_type:null,parse_status:'pending',parse_notes:null,english:false,
   raw_snippet:'LD Connexion Responsable de Site Logistique H/F - Saint-Quentin-Fallavier',
   raw_body:'Responsable Supply Chain alert | LD Connexion Responsable de Site Logistique H/F - Saint-Quentin-Fallavier'.substring(0,8000)},

  // R7: LinkedIn Deel (thread 19e498535735b072, listing 1)
  {parse_date:'2026-05-21',gmail_thread_id:'19e498535735b072',
   gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e498535735b072',
   source:'LinkedIn',alert_keyword:'Financial Controller',
   job_title:'Country Finance Manager I France',company:'Deel',
   location:'France',salary:null,
   job_url:'https://www.linkedin.com/comm/jobs/view/4417076843/',
   contract_type:null,parse_status:'pending',parse_notes:null,english:true,
   raw_snippet:'Deel Country Finance Manager I France: Who We Are Is What We Do. Deel is the all-in-one',
   raw_body:'Country Finance Manager I France at Deel | Who We Are Is What We Do. Deel is the all-in-one payroll platform. Alert: Financial Controller OR Finance Manager in Grenoble'.substring(0,8000)},

  // CHU from Deel thread (URL 4417073489) -> session dup caught by loop
  {parse_date:'2026-05-21',gmail_thread_id:'19e498535735b072',
   gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e498535735b072',
   source:'LinkedIn',alert_keyword:'Financial Controller',
   job_title:'Gestionnaire Comptable et Achat - H/F',company:'CHU Grenoble Alpes',
   location:'Saint-Laurent-du-Pont',salary:null,
   job_url:'https://www.linkedin.com/comm/jobs/view/4417073489/',
   contract_type:null,parse_status:'pending',parse_notes:null,english:false,
   raw_snippet:'CHU Grenoble Alpes Gestionnaire Comptable et Achat - H/F',
   raw_body:'CHU dup from Deel thread'.substring(0,100)},

  // LYNRED from thread 7 (19e49f312b91641a) -> session dup
  {parse_date:'2026-05-21',gmail_thread_id:'19e49f312b91641a',
   gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e49f312b91641a',
   source:'LinkedIn',alert_keyword:'Responsable Supply Chain',
   job_title:'MANAGER SUPPORT ACHATS & SUPPLY CHAIN H/F',company:'LYNRED',
   location:'Région de Grenoble',salary:null,
   job_url:'https://www.linkedin.com/comm/jobs/view/4417085646/',
   contract_type:null,parse_status:'pending',parse_notes:null,english:false,
   raw_snippet:'LYNRED MANAGER SUPPORT ACHATS & SUPPLY CHAIN H/F',
   raw_body:'LYNRED dup from thread 7'.substring(0,100)},

  // Roche from thread 7 -> session dup
  {parse_date:'2026-05-21',gmail_thread_id:'19e49f312b91641a',
   gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e49f312b91641a',
   source:'LinkedIn',alert_keyword:'Responsable Supply Chain',
   job_title:'Manager Inventory & Planning (d/f/m)',company:'Roche',
   location:'Meylan',salary:null,
   job_url:'https://www.linkedin.com/comm/jobs/view/4417396559/',
   contract_type:null,parse_status:'pending',parse_notes:null,english:true,
   raw_snippet:'Roche Manager Inventory & Planning (d/f/m) - Meylan',
   raw_body:'Roche dup from thread 7'.substring(0,100)},

  // R8: LinkedIn Bras Droit DAF Bourgoin (thread 19e4a60f4d7be1b3, listing 1)
  {parse_date:'2026-05-21',gmail_thread_id:'19e4a60f4d7be1b3',
   gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e4a60f4d7be1b3',
   source:'LinkedIn',alert_keyword:'Contrôleur de Gestion',
   job_title:'DAF INDEPENDANT F/H',company:'Bras Droit des Dirigeants',
   location:'Bourgoin',salary:null,
   job_url:'https://www.linkedin.com/comm/jobs/view/4416627954/',
   contract_type:null,parse_status:'pending',parse_notes:null,english:false,
   raw_snippet:'Bras Droit des Dirigeants DAF INDEPENDANT F/H - Bourgoin',
   raw_body:'Contrôleur de Gestion alert | Bras Droit des Dirigeants DAF INDEPENDANT F/H - Bourgoin | posted 5/19/26'.substring(0,8000)},

  // R9: LinkedIn Bras Droit DAF Grenoble (listing 2)
  {parse_date:'2026-05-21',gmail_thread_id:'19e4a60f4d7be1b3',
   gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e4a60f4d7be1b3',
   source:'LinkedIn',alert_keyword:'Contrôleur de Gestion',
   job_title:'DAF INDEPENDANT F/H',company:'Bras Droit des Dirigeants',
   location:'Grenoble',salary:null,
   job_url:'https://www.linkedin.com/comm/jobs/view/4416639355/',
   contract_type:null,parse_status:'pending',parse_notes:null,english:false,
   raw_snippet:'Bras Droit des Dirigeants DAF INDEPENDANT F/H - Grenoble',
   raw_body:'Contrôleur de Gestion alert | Bras Droit des Dirigeants DAF INDEPENDANT F/H - Grenoble | posted 5/19/26'.substring(0,8000)},

  // Thread 19e49f312b91641a: both URLs are session dups -> 0 inserts

  // R10: LinkedIn LYNRED Achats subject-parsed (thread 19e4aceccb3e4fe9)
  {parse_date:'2026-05-21',gmail_thread_id:'19e4aceccb3e4fe9',
   gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e4aceccb3e4fe9',
   source:'LinkedIn',alert_keyword:'Responsable Achats',
   job_title:'MANAGER SUPPORT ACHATS & SUPPLY CHAIN H/F',company:'LYNRED',
   location:null,salary:null,
   job_url:'Not available',
   contract_type:null,parse_status:'pending',
   parse_notes:'Subject-parsed (HTML-only body — verify location/salary)',english:false,
   raw_snippet:'LYNRED - MANAGER SUPPORT ACHATS & SUPPLY CHAIN H/F posted on 5/20/26',
   raw_body:'"Responsable Achats OR Acheteur": LYNRED - MANAGER SUPPORT ACHATS & SUPPLY CHAIN H/F posted on 5/20/26 | View jobs in Greater Grenoble Metropolitan Area'.substring(0,8000)},

  // R11: HelloWork CG-RH (thread 19e4b70d70371f1d, subject-parsed)
  {parse_date:'2026-05-21',gmail_thread_id:'19e4b70d70371f1d',
   gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e4b70d70371f1d',
   source:'Direct',alert_keyword:null,
   job_title:'Controleur de Gestion - Comptable H/F',company:'CG-RH Conseil et Recrutement',
   location:null,salary:null,
   job_url:'Not available',
   contract_type:null,parse_status:'pending',
   parse_notes:'Subject-parsed (HTML-only body — verify location/salary)',english:false,
   raw_snippet:'Zachary, CG-RH Conseil et Recrutement recrute un Controleur de Gestion - Comptable H/F',
   raw_body:'Zachary, CG-RH Conseil et Recrutement recrute un Controleur de Gestion - Comptable H/F | 2 nouvelles offres correspondent à votre profil'.substring(0,500)},

  // R12: HelloWork Ekko RH (thread 19e493a5a690f3b0, subject-parsed)
  {parse_date:'2026-05-21',gmail_thread_id:'19e493a5a690f3b0',
   gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e493a5a690f3b0',
   source:'Direct',alert_keyword:null,
   job_title:'Responsable de Dossiers H/F',company:'Ekko RH',
   location:null,salary:null,
   job_url:'Not available',
   contract_type:null,parse_status:'pending',
   parse_notes:'Subject-parsed (HTML-only body — verify location/salary)',english:false,
   raw_snippet:'Zachary, Ekko RH recrute un Responsable de Dossiers H/F',
   raw_body:'Zachary, Ekko RH recrute un Responsable de Dossiers H/F | 3 nouvelles offres correspondent à votre profil'.substring(0,500)},

  // R13: Cadremploi 4-msg thread (19e4a139851950fe, no exact matches)
  {parse_date:'2026-05-21',gmail_thread_id:'19e4a139851950fe',
   gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e4a139851950fe',
   source:'Cadremploi',alert_keyword:'Contrôleur de Gestion',
   job_title:null,company:null,location:null,salary:null,
   job_url:'Not available',
   contract_type:null,parse_status:'manual_check',
   parse_notes:'Cadremploi HTML-only — open Gmail link to review and paste JD',english:false,
   raw_snippet:'3 offres trouvées — Aucune offre ne correspond à votre recherche. Critères modifiés.',
   raw_body:'Et si vous modifiez vos critères de recherche ? | 4 messages: CDG/RAF/Supply Chain/Pilote Financier alerts — 3 offres chacun, aucune correspondance exacte. HTML-only.'.substring(0,500)},

  // R14: Cadremploi 1 offre (19e49b19e9914cb1)
  {parse_date:'2026-05-21',gmail_thread_id:'19e49b19e9914cb1',
   gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e49b19e9914cb1',
   source:'Cadremploi',alert_keyword:'Directeur Financier',
   job_title:null,company:null,location:null,salary:null,
   job_url:'Not available',
   contract_type:null,parse_status:'manual_check',
   parse_notes:'Cadremploi HTML-only — open Gmail link to review and paste JD',english:false,
   raw_snippet:'1 offre à ne rater sous aucun prétexte — Directeur Financier OR DAF OR Finance Director',
   raw_body:'1 offre à ne rater sous aucun prétexte | Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR Responsable Budget et Reporting'.substring(0,500)},

  // R15: Cadremploi nouvelle offre (19e48f13d0cfe05a)
  {parse_date:'2026-05-21',gmail_thread_id:'19e48f13d0cfe05a',
   gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e48f13d0cfe05a',
   source:'Cadremploi',alert_keyword:'Responsable Administratif et Financier',
   job_title:null,company:null,location:null,salary:null,
   job_url:'Not available',
   contract_type:null,parse_status:'manual_check',
   parse_notes:'Cadremploi HTML-only — open Gmail link to review and paste JD',english:false,
   raw_snippet:'Une nouvelle offre a été publiée hier — Responsable Administratif et Financier OR RAF',
   raw_body:'Une nouvelle offre a été publiée hier | Responsable Administratif et Financier OR RAF OR Responsable Consolidation OR Responsable Trésorerie'.substring(0,500)},
];

// Session-level URL dedup (also covers within-run duplicates)
const seenUrls=new Set([
  // Pre-seed with URLs we know will be seen earlier in the run to handle
  // the CHU dup from Deel thread and LYNRED/Roche dups from thread 7.
  // These are inserted inline via the loop.
]);

let inserted=0,urlDedups=0,errors=[];

async function run(){
  await c.connect();
  for(const row of rows){
    if(row.job_url && row.job_url!=='Not available'){
      if(seenUrls.has(row.job_url)){
        urlDedups++;
        console.log('URL_DUP (session):',row.job_url);
        continue;
      }
      seenUrls.add(row.job_url);
    }
    try{
      await c.query(
        'INSERT INTO listing_inbox (parse_date,gmail_thread_id,gmail_thread_url,source,alert_keyword,job_title,company,location,salary,job_url,contract_type,parse_status,parse_notes,english,raw_snippet,raw_body) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)',
        [row.parse_date,row.gmail_thread_id,row.gmail_thread_url,row.source,row.alert_keyword,
         row.job_title,row.company,row.location,row.salary,row.job_url,row.contract_type,
         row.parse_status,row.parse_notes,row.english,row.raw_snippet,row.raw_body]
      );
      inserted++;
      console.log('OK:',row.job_title||row.parse_notes);
    }catch(e){
      errors.push({title:row.job_title||'(no title)',thread:row.gmail_thread_id,err:e.message});
      console.error('ERR:',e.message);
    }
  }
  await c.end();
  console.log(JSON.stringify({inserted,urlDedups,errors}));
}
run().catch(e=>{console.error(e.message);process.exit(1);});
