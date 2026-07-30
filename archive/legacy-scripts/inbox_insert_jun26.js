const {Client}=require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const c=new Client({connectionString:'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'});

const PARSE_DATE='2026-06-26';
const USER='zberlo';

// 16 rows total: 10 pending + 5 puppeteer_pending + 1 manual_check
// URL dedup pre-checked:
//   GE Vernova 4414201667 -> DEDUP (job_applications id=427) -> excluded
//   Actual Talent CDG -> soft-dedup (already ids 499,483) -> excluded
//   CCAS jk=5a9c6a4d35394d -> DEDUP -> excluded from multi-listing threads
//   APPERTON/Fondation/LA SASSON/Burger King -> DEDUP -> excluded

const rows=[
  // --- PENDING: 7-job Indeed finance director alert ---
  {thread:'19f0534cbf590d99',src:'Indeed',kw:'finance director',
   title:'Directeur de Pole Adjoint VA H/F',company:'Sauvegarde Isere',
   loc:'Noyarey (38)',sal:'49 536 EUR par an',url:'https://fr.indeed.com/viewjob?jk=f3437154e8cad8',
   ct:null,en:false,st:'pending',notes:null,
   snip:'Directeur de Pole Adjoint VA H/F — Sauvegarde Isere — Noyarey (38) — 49 536 EUR/an',
   body:'Thread 19f0534cbf590d99 — Indeed "finance director" alert — 7 listings. Listing: Directeur de Pole Adjoint VA H/F, Sauvegarde Isere, Noyarey (38), 49 536 EUR/an, jk=f3437154e8cad8'},
  {thread:'19f0534cbf590d99',src:'Indeed',kw:'finance director',
   title:'Directeur Commercial Immobilier H/F',company:'Human Immobilier',
   loc:'Grenoble (38)',sal:'35 000 a 130 000 EUR par an',url:'https://fr.indeed.com/viewjob?jk=e394f7983223e3',
   ct:'CDI',en:false,st:'pending',notes:null,
   snip:'Directeur Commercial Immobilier H/F CDI — Human Immobilier — Grenoble (38)',
   body:'Thread 19f0534cbf590d99 — Indeed "finance director" alert — Listing: Directeur Commercial Immobilier H/F CDI, Human Immobilier, Grenoble (38), 35-130K, jk=e394f7983223e3'},
  // --- PENDING: 3-job Indeed Pilote Financier alert ---
  {thread:'19f04ff255018634',src:'Indeed',kw:'Pilote Financier',
   title:'Manager F/H',company:"McDonald's",
   loc:'Les Abrets (38)',sal:null,url:'Not available',
   ct:null,en:false,st:'pending',notes:null,
   snip:"Manager F/H — McDonald's — Les Abrets (38)",
   body:"Thread 19f04ff255018634 — Indeed 'Pilote Financier' alert — 3 listings. Listing 1: Manager F/H, McDonald's, Les Abrets (38)"},
  {thread:'19f04ff255018634',src:'Indeed',kw:'Pilote Financier',
   title:'Manager/Responsable Laser Game H/F',company:'Laser Game Evolution',
   loc:'La Ravoire (73)',sal:'31 000 a 37 800 EUR par an',url:'Not available',
   ct:null,en:false,st:'pending',notes:null,
   snip:'Manager/Responsable Laser Game H/F — Laser Game Evolution — La Ravoire (73)',
   body:'Thread 19f04ff255018634 — Indeed Pilote Financier alert — Listing 3: Manager/Responsable Laser Game H/F, Laser Game Evolution, La Ravoire (73), 31-37.8K'},
  // --- PENDING: 3 Framatome Indeed roles ---
  {thread:'19f03335d483885d',src:'Indeed',kw:'Indeed',
   title:'Planificateur de Projets F/H',company:'Framatome',
   loc:'Saint-Vallier (26)',sal:'50 000 - 60 000 EUR par an',url:'Not available',
   ct:null,en:false,st:'pending',notes:null,
   snip:'Planificateur de Projets F/H — Framatome — Saint-Vallier (26) — 50-60K',
   body:'Thread 19f03335d483885d — Indeed Framatome alert — 3 listings. Listing 1: Planificateur de Projets F/H, Framatome, Saint-Vallier (26), 50-60K'},
  {thread:'19f03335d483885d',src:'Indeed',kw:'Indeed',
   title:'Manager SI scientifique F/H',company:'Framatome',
   loc:'La Defense (92)',sal:'70 000 - 90 000 EUR par an',url:'Not available',
   ct:null,en:false,st:'pending',notes:null,
   snip:'Manager SI scientifique F/H — Framatome — La Defense (92) — 70-90K',
   body:'Thread 19f03335d483885d — Indeed Framatome alert — Listing 2: Manager SI scientifique F/H, Framatome, La Defense (92), 70-90K'},
  {thread:'19f03335d483885d',src:'Indeed',kw:'Indeed',
   title:'Ingenieur surete generale F/H',company:'Framatome',
   loc:'Romans-sur-Isere (26)',sal:'45 000 - 55 000 EUR par an',url:'Not available',
   ct:null,en:false,st:'pending',notes:null,
   snip:'Ingenieur surete generale F/H — Framatome — Romans-sur-Isere (26) — 45-55K',
   body:'Thread 19f03335d483885d — Indeed Framatome alert — Listing 3: Ingenieur surete generale F/H, Framatome, Romans-sur-Isere (26), 45-55K'},
  // --- PENDING: France Travail Acheteur (LinkedIn) ---
  {thread:'19f0439351e875b5',src:'LinkedIn',kw:'Responsable Achats OR Acheteur Senior',
   title:'Acheteur F/H',company:'France Travail',
   loc:'Crolles (38)',sal:null,url:'https://www.linkedin.com/jobs/view/4432834170/',
   ct:null,en:false,st:'pending',notes:null,
   snip:'Acheteur (F/H) — France Travail — Crolles (38)',
   body:'LinkedIn alert "Responsable Achats OR Acheteur Senior OR Responsable Procure-to-Pay OR Procurement Manager OR P2P Manager" — 1 new job. Acheteur (F/H), France Travail, Crolles. LinkedIn job 4432834170.'},
  // --- PENDING: Roche Lead Controls & Finance Enablement (LinkedIn) ---
  {thread:'19f03c5e017f5423',src:'LinkedIn',kw:'Responsable Administratif Financier OR RAF OR Directeur Financier',
   title:'Lead Controls & Finance Enablement',company:'Roche',
   loc:'Meylan (38)',sal:null,url:'https://www.linkedin.com/jobs/view/4423054383/',
   ct:null,en:true,st:'pending',notes:null,
   snip:'Lead Controls & Finance Enablement (d/f/m) — Roche — Meylan',
   body:'LinkedIn alert "Responsable Administratif Financier OR RAF OR Directeur Financier OR Chef Comptable" — Lead Controls & Finance Enablement (d/f/m), Roche, Meylan. LinkedIn job 4423054383.'},
  // --- PENDING: Edwards Lifesciences Sales Strategy (LinkedIn) ---
  {thread:'19f03c5e017f5423',src:'LinkedIn',kw:'Controleur de Gestion OR Finance Business Partner',
   title:'Manager Sales Strategy & Operations THV France',company:'Edwards Lifesciences',
   loc:'Grenoble metropolitan area (38)',sal:null,url:'https://www.linkedin.com/jobs/view/4410374946/',
   ct:null,en:true,st:'pending',notes:null,
   snip:'Manager, Sales Strategy & Operations THV France (m/f/d) — Edwards Lifesciences — Grenoble',
   body:'LinkedIn alert "Controleur de Gestion OR Finance Business Partner" — Manager, Sales Strategy & Operations THV France (m/f/d), Edwards Lifesciences, Grenoble area. LinkedIn job 4410374946.'},
  // --- PUPPETEER_PENDING: 5 Cadremploi threads ---
  {thread:'19f04bb7981a9eb7',src:'Cadremploi',kw:'Directeur Financier OR DAF',
   title:null,company:null,loc:null,sal:null,url:null,ct:null,en:false,
   st:'puppeteer_pending',notes:'Known HTML-only source — queued for Puppeteer extraction',
   snip:'Votre profil interesse ces entreprises ! — Directeur Financier OR DAF...',
   body:'Cadremploi — Subject: "Votre profil interesse ces entreprises !" | Snippet: Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR'},
  {thread:'19f037878cd22558',src:'Cadremploi',kw:'Credit Manager OR RAF OR CDG',
   title:null,company:null,loc:null,sal:null,url:null,ct:null,en:false,
   st:'puppeteer_pending',notes:'Known HTML-only source — queued for Puppeteer extraction',
   snip:'Et si vous modifiez vos criteres de recherche ? — 3 messages (Credit Manager / RAF / CDG)',
   body:'Cadremploi — Subject: "Et si vous modifiez vos criteres de recherche ?" | 3 messages. Snippets: Credit Manager OR Responsable Recouvrement; RAF OR Responsable Financier; Controleur de Gestion OR Pilote Financier'},
  {thread:'19f030d7014c9a03',src:'Cadremploi',kw:'RAF OR Directeur Financier',
   title:null,company:null,loc:null,sal:null,url:null,ct:null,en:false,
   st:'puppeteer_pending',notes:'Known HTML-only source — queued for Puppeteer extraction',
   snip:'2 offres a ne rater sous aucun pretexte ! — RAF / Directeur Financier',
   body:'Cadremploi — Subject: "2 offres a ne rater sous aucun pretexte !" | 2 messages: RAF / Directeur Financier alerts'},
  {thread:'19f02f2520263b02',src:'Cadremploi',kw:'Supply Chain OR Acheteur',
   title:null,company:null,loc:null,sal:null,url:null,ct:null,en:false,
   st:'puppeteer_pending',notes:'Known HTML-only source — queued for Puppeteer extraction',
   snip:'1 offre a ne rater sous aucun pretexte — RESPONSABLE SUPPLY CHAIN HF H/F CONNEX',
   body:'Cadremploi — Subject: "1 offre a ne rater sous aucun pretexte" | Supply Chain / Acheteur alerts | Snippet: RESPONSABLE SUPPLY CHAIN HF H/F CONNEX'},
  {thread:'19f0231a0b0a7b4b',src:'Cadremploi',kw:'Controleur de Gestion OR Finance Business Partner',
   title:null,company:null,loc:null,sal:null,url:null,ct:null,en:false,
   st:'puppeteer_pending',notes:'Known HTML-only source — queued for Puppeteer extraction',
   snip:'Une nouvelle offre a ete publiee hier — CDG OR Finance Business Partner',
   body:'Cadremploi — Subject: "Une nouvelle offre a ete publiee hier" | Snippet: Controleur de Gestion OR Responsable Controle de Gestion OR Finance Business Partner'},
  // --- MANUAL_CHECK: APEC ---
  {thread:'19f02c3a04db64b7',src:'APEC',kw:'APEC',
   title:null,company:null,loc:null,sal:null,url:null,ct:null,en:false,
   st:'manual_check',notes:'APEC: 2 offres — HTML-only — check apec.fr manually',
   snip:'2 offres Apec du 26/06/2026',
   body:'APEC — Subject: "2 offres Apec du 26/06/2026" | Snippet: 1 offre correspond a votre recherche'},
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
