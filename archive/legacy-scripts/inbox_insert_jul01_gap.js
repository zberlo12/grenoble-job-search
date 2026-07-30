const {Client}=require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const c=new Client({connectionString:'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'});

const PARSE_DATE='2026-07-01';
const USER='zberlo';

// Backfill for Jul 1 gap threads not already covered by the earlier same-day scan.
// Excluded entirely: 19f1c9e3740d1cbb (Beetween/Radiall rejection response — not a new listing).

const rows=[
  {thread:'19f1f4fa05e4d5c1',src:'Indeed',kw:'Pilote Financier',
   title:'Directeur de site TOYOTA - H/F - Echirolles',company:'Jean Lain Mobilites',
   loc:'Echirolles (38)',sal:'De 70 000 EUR a 100 000 EUR par an',
   url:'https://fr.indeed.com/rc/clk/dl?jk=7c14350adcb1be&from=ja',
   ct:null,en:false,st:'pending',notes:null,
   snip:'Notre Groupe Jean Lain Mobilites, acteur majeur de la distribution automobile...',
   body:'Thread 19f1f4fa05e4d5c1 — Indeed "Pilote Financier" alert, 1 listing. Directeur de site TOYOTA - H/F, Jean Lain Mobilites, Echirolles (38), 70-100K EUR/an'},
  {thread:'19f1df4656a69397',src:'LinkedIn',kw:'Credit Manager OR Responsable Tresorerie',
   title:"Benevolat - J'apporte mon aide benevole en tant que tresorier d'une association",company:'JeVeuxAider.gouv.fr',
   loc:'France',sal:null,url:'https://www.linkedin.com/comm/jobs/view/4434301617/',
   ct:null,en:false,st:'pending',notes:'Volunteer (unpaid) listing surfaced by LinkedIn alert — not a paid role',
   snip:"Benevolat - tresorier d'une association — JeVeuxAider.gouv.fr — France",
   body:'Thread 19f1df4656a69397 — LinkedIn alert "Credit Manager OR Responsable Recouvrement OR Responsable Tresorerie..." — Benevolat tresorier, JeVeuxAider.gouv.fr, France'},
  {thread:'19f2018d48395950',src:'LinkedIn',kw:null,
   title:null,company:null,loc:null,sal:null,url:null,ct:null,en:false,
   st:'manual_check',notes:'Non-job LinkedIn connection notification — no listing data',
   snip:'Zachary, add Loic PANIER - Assistant comptable',
   body:'LinkedIn — Subject: "Zachary, add Loic PANIER - Assistant comptable" — connection-request notification, not a job listing'},
  {thread:'19f1e4f2474bb4db',src:'Cadremploi',kw:null,
   title:null,company:null,loc:null,sal:null,url:null,ct:null,en:false,
   st:'manual_check',notes:'Non-job survey/newsletter content — no listing data',
   snip:'[Sondage] Votre avis sur le recrutement de demain',
   body:'Cadremploi (info@mail.cadremploi.fr) — Subject: "[Sondage] Votre avis sur le recrutement de demain" — survey/newsletter, not a job listing'},
  {thread:'19f1dc65b162ab93',src:'Direct',kw:null,
   title:null,company:null,loc:null,sal:null,url:null,ct:null,en:false,
   st:'manual_check',notes:'Listing-expired notification for an existing application — not a new listing',
   snip:"L'offre de Responsable Comptable et Tresorerie H/F n'est plus disponible",
   body:'HelloWork (emploi@emails.hellowork.com) — Subject: "L\'offre de Responsable Comptable et Tresorerie H/F n\'est plus disponible" — Suivi de votre candidature'},
  {thread:'19f1cb84dd33c6d8',src:'Direct',kw:null,
   title:null,company:null,loc:null,sal:null,url:null,ct:null,en:false,
   st:'manual_check',notes:'Non-job profile-view notification — no listing data',
   snip:'1 recruteur vient de consulter votre cv',
   body:'HelloWork (emploi@emails.hellowork.com) — Subject: "1 recruteur vient de consulter votre cv" — profile-view notification, not a job listing'},
];

const SQL=`INSERT INTO listing_inbox
(parse_date,gmail_thread_id,gmail_thread_url,source,alert_keyword,
 job_title,company,location,salary,job_url,contract_type,
 parse_status,parse_notes,english,raw_snippet,raw_body,user_profile)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
RETURNING id`;

async function run(){
  await c.connect();
  let ok=0,errs=[];
  for(const r of rows){
    try{
      const res=await c.query(SQL,[
        PARSE_DATE,
        r.thread,
        `https://mail.google.com/mail/u/0/#all/${r.thread}`,
        r.src,r.kw,
        r.title,r.company,r.loc,r.sal,r.url,r.ct,
        r.st,r.notes,r.en,
        r.snip.substring(0,200),
        r.body.substring(0,8000),
        USER
      ]);
      console.log(`OK id=${res.rows[0].id} [${r.st}] ${r.title||r.src+' ('+r.st+')'}`);
      ok++;
    }catch(e){
      const msg=`FAIL thread=${r.thread} title="${r.title||'null'}": ${e.message}`;
      console.error(msg);
      errs.push(msg);
    }
  }
  await c.end();
  console.log(`\nDone: ${ok} inserted, ${errs.length} errors`);
  if(errs.length) process.exit(1);
}

run().catch(e=>{console.error(e.message);process.exit(1);});
