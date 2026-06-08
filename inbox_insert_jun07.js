const {Client}=require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const c=new Client({connectionString:'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'});

const PARSE_DATE='2026-06-07';
const USER='zberlo';

const rows=[
  // --- Cadremploi 19ea27ee78d3f32f "Votre profil intéresse ces entreprises!" ---
  {tid:'19ea27ee78d3f32f',source:'Cadremploi',alert:'Directeur Financier OR DAF OR Finance Director',
   title:'Not disclosed',company:'Not disclosed',location:null,salary:null,url:'Not available',contract:null,
   status:'manual_check',notes:'UNREADABLE: Cadremploi HTML-only "profil intéressant" promo email — open Gmail link to review and paste JD',
   english:false,snippet:"Ces entreprises recherchent encore des candidats ! Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable",
   body:"Votre profil intéresse ces entreprises! | Ces entreprises recherchent encore des candidats ! Directeur Financier OR DAF OR Finance Director OR Head of Finance"},

  // --- Cadremploi 19ea1a134e9d6ffd "Et si vous modifiez vos critères?" 3 offres ---
  {tid:'19ea1a134e9d6ffd',source:'Cadremploi',alert:'Financial Controller OR Finance Manager',
   title:'Not disclosed',company:'Not disclosed',location:null,salary:null,url:'Not available',contract:null,
   status:'manual_check',notes:'UNREADABLE: Cadremploi 3 offres Financial Controller/Finance Manager — 08/06/2026 — HTML-only, open Gmail to review',
   english:true,snippet:"3 offres d'emploi trouvées. Financial Controller OR Finance Manager OR Accounting. Aucune offre ne correspond exactement.",
   body:"Et si vous modifiez vos critères de recherche ? | 3 offres trouvées. Financial Controller OR Finance Manager OR Accounting — HTML-only"},

  // --- Cadremploi 19ea19938a47f7ff "1 offre Supply Chain Manager" ---
  {tid:'19ea19938a47f7ff',source:'Cadremploi',alert:'Responsable Supply Chain OR Supply Chain Manager',
   title:'Supply Chain Manager France & Suisse',company:'Not disclosed',location:'Isère (38)',salary:null,url:'Not available',contract:'CDI',
   status:'pending',notes:'Cadremploi snippet-parsed — Supply Chain operational role CDI Isère; confirm company/salary',
   english:false,snippet:"1 offre à ne rater sous aucun prétexte Responsable Supply Chain OR Supply Chain Manager OR Demand Planner, Isère, CDI. Supply Chain Manager France & Suisse",
   body:"1 offre à ne rater sous aucun prétexte | Supply Chain Manager France & Suisse, Isère, CDI — HTML-only, open Gmail to review"},

  // --- Indeed 19ea36dd7ccfa33e — 8 listings from multi-alert ---
  {tid:'19ea36dd7ccfa33e',source:'Indeed',alert:'finance director',
   title:'Responsable Administratif et Financier H/F',company:'VMC Bois',location:'Saint-Ondras (38)',salary:'33000',url:'Not available',contract:null,
   status:'pending',notes:'Salary €33K — below €52K reject floor; RAF at VMC Bois Saint-Ondras',
   english:false,snippet:'VMC Bois — Saint-Ondras (38) — À partir de 33 000 € par an',
   body:'VMC Bois recherche un/e Responsable Administratif et Financier H/F + 10 nouvelles offres de "finance director" | À partir de 33 000 € par an'},

  {tid:'19ea36dd7ccfa33e',source:'Indeed',alert:'finance director',
   title:'Responsable administratif H/F',company:"Maison de l'Emploi et de l'Entreprise-MIFE Isère",location:'Eybens (38)',salary:'15.67 EUR/hr',url:'Not available',contract:null,
   status:'pending',notes:'Non-finance admin role, hourly wage — likely Skip',
   english:false,snippet:"MIFE Isère — Eybens (38) — À partir de 15,67 € de l'heure",
   body:"MIFE Isère Responsable administratif H/F — Eybens (38) — 15,67 €/h | indeed alert multi-listing"},

  {tid:'19ea36dd7ccfa33e',source:'Indeed',alert:'finance director',
   title:'Directeur CER H/F',company:'Sauvegarde Isère',location:'Lans-en-Vercors (38)',salary:'50016',url:'Not available',contract:null,
   status:'pending',notes:'Social sector director (Centre Éducatif Renforcé) — non-finance operational role',
   english:false,snippet:'Sauvegarde Isère — Lans-en-Vercors (38) — À partir de 50 016 € par an',
   body:'Sauvegarde Isère Directeur CER H/F — Lans-en-Vercors — 50 016 €/an | indeed alert'},

  {tid:'19ea36dd7ccfa33e',source:'Indeed',alert:'finance director',
   title:'Directeur Commercial Adjoint H/F',company:'CBA Assurance',location:'Échirolles (38)',salary:'41000-42000',url:'Not available',contract:null,
   status:'pending',notes:'Commercial director at insurance firm — non-finance; below salary floor',
   english:false,snippet:'CBA Assurance — Échirolles (38) — De 41 000 € à 42 000 € par an',
   body:'CBA Assurance Directeur Commercial Adjoint H/F — Échirolles — 41-42K | indeed alert'},

  {tid:'19ea36dd7ccfa33e',source:'Indeed',alert:'finance director',
   title:'Directeur / Directrice de crèche EJE en CDI H/F',company:'Zanaka Solutions RH',location:'Eybens (38)',salary:'30000',url:'Not available',contract:'CDI',
   status:'pending',notes:'Childcare director — non-finance operational role',
   english:false,snippet:'Zanaka Solutions RH — Eybens (38) — À partir de 2 500 € par mois',
   body:'Zanaka Directeur crèche EJE CDI — Eybens — 2500€/mois | indeed alert'},

  {tid:'19ea36dd7ccfa33e',source:'Indeed',alert:'finance director',
   title:'DIRECTEUR DE MAGASIN F/H',company:'Centrakor',location:"Saint-Martin-d'Hères (38)",salary:null,url:'Not available',contract:null,
   status:'pending',notes:'Retail store director — non-finance',
   english:false,snippet:"Centrakor — Saint-Martin-d'Hères (38) — Directeur de Magasin",
   body:"Centrakor DIRECTEUR DE MAGASIN F/H — Saint-Martin-d'Hères | indeed alert"},

  {tid:'19ea36dd7ccfa33e',source:'Indeed',alert:'finance director',
   title:"Directeur d'agence H/F",company:'VITALIS MEDICAL',location:'Grenoble (38)',salary:null,url:'Not available',contract:null,
   status:'pending',notes:'Medical staffing agency director — non-finance',
   english:false,snippet:"VITALIS MEDICAL — Grenoble (38) — Directeur d'agence",
   body:"VITALIS MEDICAL Directeur d'agence H/F — Grenoble | indeed alert"},

  {tid:'19ea36dd7ccfa33e',source:'Indeed',alert:'finance director',
   title:"Directeur d'agence d'intérim et de recrutement indépendant H/F",company:'Lynx RH',location:'Chambéry (73)',salary:null,url:'Not available',contract:null,
   status:'pending',notes:'Staffing agency director — non-finance',
   english:false,snippet:"Lynx RH — Chambéry (73) — Directeur d'agence d'intérim",
   body:"Lynx RH Directeur agence intérim H/F — Chambéry | indeed alert"},

  // --- LinkedIn 19ea2c984b136415 — 4 listings ---
  {tid:'19ea2c984b136415',source:'LinkedIn',alert:'LinkedIn',
   title:'Directeur administratif et financier/Directrice administrative et financière',company:'LB Ressources',location:'Aix-en-Provence',salary:null,url:'https://www.linkedin.com/jobs/view/4423361398/',contract:null,
   status:'pending',notes:'DAF via LB Ressources — Aix-en-Provence (far from Grenoble, remote essential or skip)',
   english:false,snippet:'LB Ressources — DAF — Aix-en-Provence',
   body:'LinkedIn recommendations: LB Ressources DAF — Aix-en-Provence — job 4423361398'},

  {tid:'19ea2c984b136415',source:'LinkedIn',alert:'LinkedIn',
   title:'Directeur administratif et financier/Directrice administrative et financière',company:'Les Phénix',location:'Nyons',salary:null,url:'https://www.linkedin.com/jobs/view/4418801874/',contract:null,
   status:'pending',notes:'DAF at Les Phénix — Nyons (Drôme 26, orange zone ~80km from Grenoble)',
   english:false,snippet:'Les Phénix — DAF — Nyons',
   body:'LinkedIn recommendations: Les Phénix DAF — Nyons — job 4418801874'},

  {tid:'19ea2c984b136415',source:'LinkedIn',alert:'LinkedIn',
   title:'CFO LBO - F/H',company:'Selescope',location:'Grenoble',salary:null,url:'https://www.linkedin.com/jobs/view/4413926880/',contract:null,
   status:'pending',notes:'CFO LBO via Selescope executive search — Grenoble (Green zone). HIGH PRIORITY: CFO LBO role, confirm employer.',
   english:false,snippet:'Selescope — CFO LBO — Grenoble',
   body:'LinkedIn recommendations: Selescope CFO LBO F/H — Grenoble — job 4413926880'},

  {tid:'19ea2c984b136415',source:'LinkedIn',alert:'LinkedIn',
   title:'DAF PME F/H - Bourgogne',company:'LIVINGSTONE RH',location:'Bourgogne-Franche-Comté',salary:null,url:'https://www.linkedin.com/jobs/view/4416204726/',contract:null,
   status:'pending',notes:'DAF PME via Livingstone RH — Bourgogne-Franche-Comté (wrong region, not Grenoble area)',
   english:false,snippet:'LIVINGSTONE RH — DAF PME — Bourgogne-Franche-Comté',
   body:'LinkedIn recommendations: Livingstone RH DAF PME — Bourgogne — job 4416204726'},

  // --- Indeed Wiico 19ea1891f30d5262 (snippet-parsed Indeed match) ---
  {tid:'19ea1891f30d5262',source:'Indeed',alert:'Indeed Match',
   title:'Manager équipe comptable H/F',company:'Wiico',location:null,salary:'45000-60000',url:'Not available',contract:null,
   status:'pending',notes:'Snippet-parsed — Indeed match suggestion; Wiico staffing placement; salary €45-60K below €65K floor',
   english:false,snippet:'Wiico — Manager équipe comptable H/F — De 45 000 € à 60 000 € par an',
   body:'Manager équipe comptable H/F @ Wiico | De 45 000 € à 60 000 € par an — Indeed match suggestion'}
];

const INSERT=`INSERT INTO listing_inbox
(parse_date,gmail_thread_id,gmail_thread_url,source,alert_keyword,job_title,company,location,salary,job_url,contract_type,parse_status,parse_notes,english,raw_snippet,raw_body,user_profile)
VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`;

const URLDEDUP=`SELECT id FROM listing_inbox WHERE job_url=$1 AND parse_date>=CURRENT_DATE-7 AND user_profile=$2 LIMIT 1`;

async function run(){
  await c.connect();
  let pending=0,manual=0,urlDedup=0,errors=[];
  for(const r of rows){
    if(r.url && r.url!=='Not available'){
      const chk=await c.query(URLDEDUP,[r.url,USER]);
      if(chk.rows.length>0){urlDedup++;console.log(`URL_DEDUP: ${r.title} @ ${r.company}`);continue;}
    }
    const threadUrl=`https://mail.google.com/mail/u/0/#all/${r.tid}`;
    try{
      await c.query(INSERT,[
        PARSE_DATE,r.tid,threadUrl,r.source,r.alert,
        r.title,r.company,r.location,r.salary,r.url,r.contract,
        r.status,r.notes,r.english,
        r.snippet.substring(0,200),r.body.substring(0,8000),USER
      ]);
      if(r.status==='pending')pending++;else manual++;
      console.log(`OK [${r.status}] ${r.title} @ ${r.company}`);
    }catch(e){
      errors.push(`${r.title} @ ${r.company}: ${e.message}`);
      console.error(`ERR ${r.title}: ${e.message}`);
    }
  }
  await c.end();
  console.log(`\nDone: ${pending} pending, ${manual} manual_check, ${urlDedup} url_dedup, ${errors.length} errors`);
}
run().catch(e=>{console.error(e.message);process.exit(1);});
