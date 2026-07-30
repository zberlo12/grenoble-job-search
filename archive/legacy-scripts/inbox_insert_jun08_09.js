const {Client}=require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const c=new Client({connectionString:'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'});
const USER='zberlo';

const rows=[

// ═══════════════ JUN 8 — 2026-06-08 ═══════════════

{d:'2026-06-08',tid:'19ea58a4f713bc84',src:'APEC',alert:'APEC Finance/Gestion',
 title:'Not disclosed',company:'Not disclosed',loc:null,sal:null,url:'Not available',ct:null,en:false,
 status:'manual_check',notes:'APEC: 1 offre — 08/06/2026 — HTML-only — check apec.fr manually',
 snip:'1 offre Apec du 08/06/2026',body:'1 offre Apec du 08/06/2026 | Découvrez votre sélection d\'offres'},

{d:'2026-06-08',tid:'19ea591a5ce9eda0',src:'Cadremploi',alert:'Contrôleur de Gestion OR Responsable Contrôle de Gestion',
 title:'Not disclosed',company:'Not disclosed',loc:null,sal:null,url:'Not available',ct:null,en:false,
 status:'manual_check',notes:'UNREADABLE: Cadremploi 1 nouvelle offre CDG publiée semaine dernière — HTML-only, open Gmail to review',
 snip:'Une nouvelle offre a été publiée la semaine dernière — Contrôleur de Gestion OR Responsable Contrôle de Gestion',
 body:'Une nouvelle offre a été publiée la semaine dernière | Contrôleur de Gestion OR Responsable Contrôle de Gestion — HTML-only'},

{d:'2026-06-08',tid:'19ea6c598e9f766f',src:'Cadremploi',alert:'Credit Manager OR RAF OR Responsable Achats',
 title:'Not disclosed',company:'Not disclosed',loc:null,sal:null,url:'Not available',ct:null,en:false,
 status:'manual_check',notes:'UNREADABLE: Cadremploi multi-alert batch 08/06 — Credit Manager, RAF, Responsable Achats keywords — HTML-only, open Gmail to review',
 snip:'Et si vous modifiez vos critères — Credit Manager / RAF / Responsable Achats',
 body:'Et si vous modifiez vos critères de recherche | Credit Manager OR Responsable Recouvrement / Responsable Administratif Financier OR RAF / Responsable Achats — HTML-only'},

{d:'2026-06-08',tid:'19ea6c8cc253fee0',src:'Cadremploi',alert:'Responsable Supply Chain OR Supply Chain Manager',
 title:'Supply Chain Manager France & Suisse',company:'Not disclosed',loc:'Isère (38)',sal:null,url:'Not available',ct:'CDI',en:false,
 status:'pending',notes:'Cadremploi snippet-parsed — Supply Chain Manager CDI Isère; OPERATIONAL role; repeat of Jun 7 alert',
 snip:'1 offre à ne rater — Supply Chain Manager France & Suisse, Isère, CDI',
 body:'1 offre à ne rater sous aucun prétexte | Supply Chain Manager France & Suisse, Isère, CDI — HTML-only'},

{d:'2026-06-08',tid:'19ea808ded83d602',src:'Cadremploi',alert:'Directeur Financier OR DAF OR Finance Director',
 title:'Not disclosed',company:'Not disclosed',loc:null,sal:null,url:'Not available',ct:null,en:false,
 status:'manual_check',notes:'UNREADABLE: Cadremploi HTML-only "profil intéressant" promo email — open Gmail link to review',
 snip:'Ces entreprises recherchent encore des candidats ! Directeur Financier OR DAF OR Finance Director',
 body:'Votre profil intéresse ces entreprises ! | Ces entreprises recherchent encore des candidats — HTML-only'},

{d:'2026-06-08',tid:'19ea855423df805f',src:'Indeed',alert:'finance director',
 title:'Not disclosed',company:'Not disclosed',loc:null,sal:null,url:'Not available',ct:null,en:false,
 status:'manual_check',notes:'Indeed multi 12 offres "finance director" Grenoble 08/06 — open Gmail to review; featured: VMC Bois RAF Saint-Ondras (below floor); recurring batch',
 snip:'VMC Bois + 12 nouvelles offres "finance director" à Grenoble — VMC Bois, CBA Assurance, Sauvegarde Isère',
 body:'VMC Bois recherche un/e Responsable Administratif et Financier H/F + 12 nouvelles offres "finance director" | Postulez aux offres publiées par VMC Bois, CBA Assurance et Sauvegarde Isère'},

{d:'2026-06-08',tid:'19ea834f74627cbf',src:'Indeed',alert:'Pilote Financier',
 title:'Pilote Financier',company:'ACEPP 38',loc:'Grenoble (38)',sal:null,url:'Not available',ct:null,en:false,
 status:'pending',notes:'Subject-parsed — Indeed single listing; ACEPP 38 (childcare/social association); finance role in non-profit sector; verify salary and scope',
 snip:'ACEPP 38 vous propose une offre d\'emploi ! — 1 nouvel emploi Pilote Financier - Grenoble (38)',
 body:'1 nouvel emploi Pilote Financier - Grenoble (38) | ACEPP 38 vous propose une offre d\'emploi !'},

{d:'2026-06-08',tid:'19ea82d68883d234',src:'LinkedIn',alert:'LinkedIn',
 title:'Responsable de la gestion administrative et financière H/F',company:'CNRS',loc:null,sal:null,url:'Not available',ct:null,en:false,
 status:'pending',notes:'Subject-parsed — CNRS Responsable gestion administrative et financière; major public research org; posted 5/27/2026',
 snip:'CNRS is hiring a Responsable de la gestion administrative et financière (H/F) — Posted on 5/27/2026',
 body:'CNRS is hiring a Responsable de la gestion administrative et financière (H/F) | Posted on 5/27/2026 — LinkedIn jobs listing'},

{d:'2026-06-08',tid:'19ea637a4e8dfcd8',src:'LinkedIn',alert:'LinkedIn',
 title:'Directeur·trice Achats Région Europe H/F',company:'GE Vernova',loc:null,sal:null,url:'Not available',ct:null,en:true,
 status:'pending',notes:'Subject-parsed — GE Vernova Regional Procurement Director Europe; OPERATIONAL procurement role, not finance',
 snip:'GE Vernova — Directeur·trice Achats Région Europe H/F (Regional Procurement Director Europe)',
 body:'Directeur·trice Achats Région Europe H/F at GE Vernova | Job Description: Chez GE Vernova — OPERATIONAL procurement director'},

{d:'2026-06-08',tid:'19ea7ef564a7f4c4',src:'LinkedIn',alert:'Responsable Achats OR Acheteur Senior',
 title:'Directeur·trice Achats Région Europe H/F',company:'GE Vernova',loc:null,sal:null,url:'Not available',ct:null,en:true,
 status:'pending',notes:'Subject-parsed — GE Vernova Directeur Achats Europe; jobalert (Responsable Achats keyword); OPERATIONAL; same job as thread 19ea637a4e8dfcd8',
 snip:'"Responsable Achats OR Acheteur…": GE Vernova - Directeur·trice Achats Région Europe H/F posted on 6/7/26',
 body:'"Responsable Achats OR Acheteur…": GE Vernova - Directeur·trice Achats posted on 6/7/26 | View jobs in Greater Grenoble'},

{d:'2026-06-08',tid:'19ea7136176b54a8',src:'LinkedIn',alert:'Responsable Supply Chain OR Supply Chain Manager',
 title:'Directeur·trice Achats Région Europe H/F',company:'GE Vernova',loc:null,sal:null,url:'Not available',ct:null,en:true,
 status:'pending',notes:'Subject-parsed — GE Vernova Directeur Achats Europe; jobalert (Supply Chain keyword); OPERATIONAL; duplicate alert same job',
 snip:'"Responsable Supply Chain OR Supply…": GE Vernova - Directeur·trice Achats Région Europe H/F posted on 6/7/26',
 body:'"Responsable Supply Chain OR Supply…": GE Vernova - Directeur·trice Achats posted on 6/7/26 | View jobs in Greater Grenoble'},

{d:'2026-06-08',tid:'19ea78199475002e',src:'LinkedIn',alert:'Responsable Achats OR Acheteur Senior',
 title:'Gestionnaire Achats H/F',company:'Davidson consulting',loc:null,sal:null,url:'Not available',ct:null,en:false,
 status:'pending',notes:'Subject-parsed — Davidson Consulting purchasing manager; IT/engineering consulting; OPERATIONAL, not finance',
 snip:'Davidson consulting — Gestionnaire Achats (H/F)',
 body:'Gestionnaire Achats (H/F) at Davidson consulting | Davidson consulting Gestionnaire Achats H/F: Rejoindre Davidson'},

{d:'2026-06-08',tid:'19ea6e27387a19d4',src:'Direct',alert:'Responsable Comptable',
 title:'Responsable Comptable H/F',company:'Brun Invest',loc:null,sal:null,url:'Not available',ct:null,en:false,
 status:'pending',notes:'Subject-parsed (HelloWork) — Brun Invest Responsable Comptable; investment/holding company; accounting scope',
 snip:'Zachary, Brun Invest recrute un Responsable Comptable H/F — 1 nouvelle offre correspond à votre profil',
 body:'Zachary, Brun Invest recrute un Responsable Comptable H/F | HelloWork notification'},

// ═══════════════ JUN 9 — 2026-06-09 ═══════════════

{d:'2026-06-09',tid:'19eab56f8cdd6804',src:'APEC',alert:'APEC Finance/Gestion',
 title:'Not disclosed',company:'Not disclosed',loc:null,sal:null,url:'Not available',ct:null,en:false,
 status:'manual_check',notes:'APEC: 8 offres — 09/06/2026 — HTML-only — check apec.fr manually',
 snip:'8 offres Apec du 09/06/2026',body:'8 offres Apec du 09/06/2026 | Découvrez votre sélection d\'offres'},

{d:'2026-06-09',tid:'19eab95551345d3a',src:'Direct',alert:'Contrôleur de Gestion',
 title:'Controleur de Gestion Operationnelle H/F',company:'STEF',loc:null,sal:null,url:'Not available',ct:null,en:false,
 status:'pending',notes:'Subject-parsed (HelloWork) — STEF logistics CDG Opérationnel; 3 offers total; STEF is major French food logistics group',
 snip:'Zachary, STEF recrute un Controleur de Gestion Operationnelle H/F — 3 nouvelles offres',
 body:'Zachary, STEF recrute un Controleur de Gestion Operationnelle H/F | 3 nouvelles offres — HelloWork'},

{d:'2026-06-09',tid:'19eab5e07b8fc48a',src:'LinkedIn',alert:'Responsable Administratif et Financier',
 title:'Business controller',company:'TAVENGINEERING',loc:null,sal:null,url:'Not available',ct:null,en:true,
 status:'pending',notes:'Subject-parsed — TAVENGINEERING Business controller; engineering company; English likely required',
 snip:'TAVENGINEERING Business controller: Nous sommes une entreprise dynamique',
 body:'Business controller at TAVENGINEERING | TAVENGINEERING Business controller: Nous sommes une entreprise dynamique'},

{d:'2026-06-09',tid:'19eabed04081ff42',src:'Cadremploi',alert:'Financial Controller OR Finance Manager',
 title:'Not disclosed',company:'Not disclosed',loc:null,sal:null,url:'Not available',ct:null,en:true,
 status:'manual_check',notes:'UNREADABLE: Cadremploi 3 offres Financial Controller/Finance Manager — 09/06/2026 — HTML-only, open Gmail to review',
 snip:'3 offres — Financial Controller OR Finance Manager OR Accounting — Et si vous modifiez vos critères',
 body:'Et si vous modifiez vos critères de recherche | 3 offres Financial Controller OR Finance Manager — HTML-only'},

{d:'2026-06-09',tid:'19eabd92686af6d3',src:'Indeed',alert:'Indeed Match',
 title:'Comptable général H/F',company:'Page Personnel',loc:null,sal:null,url:'Not available',ct:null,en:false,
 status:'pending',notes:'Snippet-parsed — Indeed match via Page Personnel; Comptable général is junior-to-mid level; salary in email corrupted (shows €420-456K — data error)',
 snip:'Page Personnel — Comptable général H/F — salary data corrupted in email',
 body:'Comptable général (H/F) @ Page Personnel | De 420 000 € à 456 000 € par an — Indeed match (salary corrupted)'},

{d:'2026-06-09',tid:'19eac39c0e93f7af',src:'LinkedIn',alert:'Responsable Supply Chain OR Supply Chain Manager',
 title:'Directeur de projet Sénior H/F',company:'France Travail',loc:null,sal:null,url:'Not available',ct:null,en:false,
 status:'pending',notes:'Subject-parsed — France Travail Directeur de projet Sénior; OPERATIONAL project management, not finance',
 snip:'"Responsable Supply Chain OR Supply…": France Travail - Directeur de projet Sénior (H/F) posted on 6/8/26',
 body:'"Responsable Supply Chain OR Supply…": France Travail - Directeur de projet Sénior posted on 6/8/26 | View jobs in Greater Grenoble'},

{d:'2026-06-09',tid:'19eaca79c066854c',src:'LinkedIn',alert:'Responsable Administratif et Financier',
 title:'Business controller',company:'TAVENGINEERING',loc:null,sal:null,url:'Not available',ct:null,en:true,
 status:'pending',notes:'Subject-parsed — TAVENGINEERING Business controller; jobalert digest; repeat alert different thread',
 snip:'"Responsable Administratif et…": TAVENGINEERING - Business controller posted on 6/8/26',
 body:'"Responsable Administratif et…": TAVENGINEERING - Business controller posted on 6/8/26 | View jobs in Greater Grenoble'},

{d:'2026-06-09',tid:'19ead452129545f4',src:'Direct',alert:'Expert-Comptable',
 title:'Expert-Comptable H/F',company:'Skills Grenoble',loc:'Grenoble',sal:null,url:'Not available',ct:null,en:false,
 status:'pending',notes:'Subject-parsed (HelloWork) — Expert-Comptable public accounting; Skills Grenoble staffing; not corporate finance profile',
 snip:'Zachary, Skills Grenoble recrute un Expert-Comptable H/F — 1 nouvelle offre',
 body:'Zachary, Skills Grenoble recrute un Expert-Comptable H/F | HelloWork notification'},

{d:'2026-06-09',tid:'19eacef3321fbf20',src:'Cadremploi',alert:'Directeur Financier OR DAF OR Finance Director',
 title:'Not disclosed',company:'Not disclosed',loc:null,sal:null,url:'Not available',ct:null,en:false,
 status:'manual_check',notes:'UNREADABLE: Cadremploi HTML-only "profil intéressant" promo email — open Gmail link to review',
 snip:'Ces entreprises recherchent encore des candidats ! Directeur Financier OR DAF OR Finance Director',
 body:'Votre profil intéresse ces entreprises ! | Ces entreprises recherchent encore des candidats — HTML-only'},

{d:'2026-06-09',tid:'19eadf16875fcc4a',src:'LinkedIn',alert:'LinkedIn',
 title:'Gestionnaire administratif et financier H/F',company:'France Travail',loc:null,sal:null,url:'Not available',ct:null,en:false,
 status:'pending',notes:'Snippet-parsed — LinkedIn recommendations via Crit Experts & Cadres; France Travail gestionnaire admin financier visible',
 snip:'France Travail is also hiring for Gestionnaire administratif et financier (H/F)',
 body:'View Crit Experts & Cadres jobs and your next steps | France Travail is also hiring for Gestionnaire administratif et financier (H/F)'},

{d:'2026-06-09',tid:'19ead835698bfd63',src:'LinkedIn',alert:'LinkedIn',
 title:'Not disclosed',company:'Not disclosed',loc:null,sal:null,url:'Not available',ct:null,en:false,
 status:'manual_check',notes:'LinkedIn CDG recommendations digest — jobs similar to Contrôleur de gestion at Forum réfugiés; open to view full listings',
 snip:'Jobs similar to Contrôleur de gestion - F/H at Forum réfugiés — View jobs in Greater Grenoble',
 body:'New jobs similar to Contrôleur de gestion - F/H at Forum réfugiés | View jobs in Greater Grenoble Metropolitan Area'},

{d:'2026-06-09',tid:'19ead7b136adaa71',src:'Indeed',alert:'finance director',
 title:'Not disclosed',company:'Not disclosed',loc:null,sal:null,url:'Not available',ct:null,en:false,
 status:'manual_check',notes:'Indeed multi 12 offres "finance director" Grenoble 09/06 — open Gmail to review; featured: Grenoble-INP Directeur Opérationnel DFP (operational)',
 snip:'Grenoble-INP + 12 nouvelles offres "finance director" à Grenoble — Grenoble-INP, CBA Assurance, Sauvegarde Isère',
 body:'Grenoble-INP recherche un/e Directeur Opérationnel DFP (F/H) + 12 nouvelles offres "finance director" | Postulez aux offres de Grenoble-INP, CBA Assurance et Sauvegarde Isère'},

{d:'2026-06-09',tid:'19ead53c3afa6090',src:'LinkedIn',alert:'LinkedIn',
 title:'Responsable de la gestion administrative et financière H/F',company:'CNRS',loc:null,sal:null,url:'Not available',ct:null,en:false,
 status:'pending',notes:'Subject-parsed — CNRS Responsable gestion admin et financière; repeat alert (also appeared Jun 8); posted 5/27/2026',
 snip:'CNRS is hiring a Responsable de la gestion administrative et financière (H/F) — Posted on 5/27/2026',
 body:'CNRS is hiring a Responsable de la gestion administrative et financière (H/F) | Posted on 5/27/2026 — repeat alert'},

{d:'2026-06-09',tid:'19eae34b9c5feca9',src:'Indeed',alert:'Pilote Financier',
 title:'Not disclosed',company:'Not disclosed',loc:'Grenoble (38)',sal:null,url:'Not available',ct:null,en:false,
 status:'manual_check',notes:'Indeed multi 3 offres "Pilote Financier" Grenoble — open Gmail to review; featured: Ville de Saint-Egrève RESPONSABLE SERVICE JEUNESSE (non-finance)',
 snip:'Ville de Saint-Egrève + 3 nouvelles offres de "Pilote Financier" à Grenoble (38)',
 body:'Ville de Saint-Egrève + 3 nouvelles offres "Pilote Financier" Grenoble | Ville de Saint-Egrève, Framatome et ACEPP 38 vous proposent des offres'}
];

const INSERT=`INSERT INTO listing_inbox
(parse_date,gmail_thread_id,gmail_thread_url,source,alert_keyword,job_title,company,location,salary,job_url,contract_type,parse_status,parse_notes,english,raw_snippet,raw_body,user_profile)
VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`;
const TDEDUP=`SELECT id FROM listing_inbox WHERE gmail_thread_id=$1 AND parse_date=$2 AND user_profile=$3 LIMIT 1`;
const UDEDUP=`SELECT id FROM listing_inbox WHERE job_url=$1 AND parse_date>=CURRENT_DATE-7 AND user_profile=$2 LIMIT 1`;

async function run(){
  await c.connect();
  let pending=0,manual=0,tDup=0,uDup=0,errors=[];
  for(const r of rows){
    const td=await c.query(TDEDUP,[r.tid,r.d,USER]);
    if(td.rows.length>0){tDup++;console.log(`T_DEDUP [${r.d}]: ${r.title} @ ${r.company}`);continue;}
    if(r.url&&r.url!=='Not available'){
      const ud=await c.query(UDEDUP,[r.url,USER]);
      if(ud.rows.length>0){uDup++;console.log(`U_DEDUP [${r.d}]: ${r.title} @ ${r.company}`);continue;}
    }
    const threadUrl=`https://mail.google.com/mail/u/0/#all/${r.tid}`;
    try{
      await c.query(INSERT,[r.d,r.tid,threadUrl,r.src,r.alert,r.title,r.company,r.loc,r.sal,r.url,r.ct,
        r.status,r.notes,r.en,r.snip.substring(0,200),r.body.substring(0,8000),USER]);
      if(r.status==='pending')pending++;else manual++;
      console.log(`OK [${r.d}][${r.status}] ${r.title} @ ${r.company}`);
    }catch(e){
      errors.push(`[${r.d}] ${r.title} @ ${r.company}: ${e.message}`);
      console.error(`ERR: ${e.message}`);
    }
  }
  await c.end();
  console.log(`\nDone: ${pending} pending, ${manual} manual_check, ${tDup} t_dedup, ${uDup} u_dedup, ${errors.length} errors`);
  if(errors.length)errors.forEach(e=>console.error(' ',e));
}
run().catch(e=>{console.error(e.message);process.exit(1);});
