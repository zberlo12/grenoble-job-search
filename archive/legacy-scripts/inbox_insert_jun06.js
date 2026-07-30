// inbox_insert_jun06.js — parse_date 2026-06-06, user_profile zberlo
const {Client} = require(process.env.PG_MODULE);
const c = new Client({connectionString: process.env.PG_CONN});

const D = '2026-06-06';
const U = 'zberlo';
const tu = id => `https://mail.google.com/mail/u/0/#all/${id}`;

// [threadId, source, alertKw, title, company, location, salary, url, contract, status, notes, english, snippet, body]
const rows = [
  // Indeed singles (subject-parsed)
  ['19e9f425b296922e','Indeed','Contrôleur de Gestion','Contrôleur de Gestion','VINCI Energies','Grenoble (38)',null,'Not available','CDI','pending',null,false,
   'VINCI Energies vous propose une offre d\'emploi !',
   '1 nouvel emploi Contrôleur de Gestion - Grenoble (38) | VINCI Energies vous propose une offre d\'emploi !'],

  ['19e9f0f8ad1602b5','Indeed','Responsable Administratif Financier','Responsable Administratif Financier','VINCI Energies','Grenoble (38)',null,'Not available',null,'pending',null,false,
   'VINCI Energies vous propose une offre d\'emploi !',
   '1 nouvel emploi Responsable Administratif Financier - Grenoble (38) | VINCI Energies vous propose une offre d\'emploi !'],

  // Indeed multi — no get_thread (cost); featured VINCI RAF likely already in DB from 06-05
  ['19e9e6a86b6631cb','Indeed','finance director',null,null,'Grenoble (38)',null,'Not available',null,'manual_check',
   'Indeed multi 10 offres — featured VINCI RAF débutant (likely dup from 06-05); open Gmail to review remaining jobs',false,
   'VINCI Energies, DAF-ACTIVE et PROD-ACTIVE vous proposent des offres d\'emploi !',
   'VINCI Energies recherche un/e RAF débutant F/H + 10 nouvelles offres finance director Grenoble (38) | VINCI Energies, DAF-ACTIVE et PROD-ACTIVE vous proposent des offres d\'emploi !'],

  // Cadremploi — profile interest alert
  ['19e9d57dbaaa36a1','Cadremploi','Directeur Financier OR DAF OR Finance Director',null,null,null,null,'Not available',null,'manual_check',
   'Cadremploi HTML-only — open Gmail link to review and paste JD',false,
   'Ces entreprises recherchent encore des candidats ! Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR',
   'Votre profil intéresse ces entreprises ! | Ces entreprises recherchent encore des candidats ! Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR'],

  // Cadremploi multi-message "Et si vous modifiez vos critères" — 4 keywords
  ['19e9c7c3c33d78b0','Cadremploi','Credit Manager OR Responsable Recouvrement',null,null,null,null,'Not available',null,'manual_check',
   'Cadremploi HTML-only — open Gmail link to review and paste JD',false,
   '3 offres d\'emploi trouvées. Aucune offre ne correspond à votre recherche. Credit Manager OR Responsable Recouvrement',
   'Et si vous modifiez vos critères de recherche ? | 3 offres. Credit Manager OR Responsable Recouvrement OR'],

  ['19e9c7c3c33d78b0','Cadremploi','Responsable Administratif Financier OR RAF',null,null,null,null,'Not available',null,'manual_check',
   'Cadremploi HTML-only — open Gmail link to review and paste JD',false,
   '3 offres d\'emploi trouvées. Aucune offre ne correspond à votre recherche. Responsable Administratif Financier OR RAF',
   'Et si vous modifiez vos critères de recherche ? | 3 offres. Responsable Administratif Financier OR RAF OR'],

  ['19e9c7c3c33d78b0','Cadremploi','Contrôleur de Gestion OR Pilote Financier',null,null,null,null,'Not available',null,'manual_check',
   'Cadremploi HTML-only — open Gmail link to review and paste JD',false,
   '3 offres d\'emploi trouvées. Aucune offre ne correspond à votre recherche. Contrôleur de Gestion OR Pilote Financier',
   'Et si vous modifiez vos critères de recherche ? | 3 offres. Contrôleur de Gestion OR Pilote Financier OR'],

  ['19e9c7c3c33d78b0','Cadremploi','Responsable Achats OR Acheteur Senior',null,null,null,null,'Not available',null,'manual_check',
   'Cadremploi HTML-only — open Gmail link to review and paste JD',false,
   '3 offres d\'emploi trouvées. Aucune offre ne correspond à votre recherche. Responsable Achats OR Acheteur Senior',
   'Et si vous modifiez vos critères de recherche ? | 3 offres. Responsable Achats OR Acheteur Senior OR'],

  // APEC
  ['19e9c0f35fe58cda','APEC',null,null,null,null,null,'Not available',null,'manual_check',
   'APEC: 13 offres — check apec.fr manually',false,
   'Voici une sélection d\'offres d\'emploi 6 offres correspondent à votre recherche :',
   '13 offres Apec du 06/06/2026 | Voici une sélection d\'offres d\'emploi 6 offres correspondent à votre recherche :'],

  // Cadremploi "1 offre à ne rater" — 2 messages
  ['19e9c0e4f3ac1071','Cadremploi','Responsable Administratif et Financier OR RAF',null,null,null,null,'Not available',null,'manual_check',
   'Cadremploi HTML-only — open Gmail link to review and paste JD',false,
   '1 offre à ne rater sous aucun prétexte Responsable Administratif et Financier OR RAF OR Responsable Consolidation OR Responsable Trésorerie',
   '1 offre à ne rater sous aucun prétexte | Responsable Administratif et Financier OR RAF OR Responsable Consolidation OR Responsable Trésorerie OR Responsable Finance'],

  ['19e9c0e4f3ac1071','Cadremploi','Responsable Supply Chain OR Supply Chain Manager OR Demand Planner','Supply Chain Manager France & Suisse','Not disclosed',null,null,'Not available',null,'manual_check',
   'Cadremploi HTML-only — open Gmail link to review and paste JD',false,
   '1 offre à ne rater sous aucun prétexte Supply Chain Manager France & Suisse',
   '1 offre à ne rater sous aucun prétexte | Supply Chain Manager France & Suisse — Responsable Supply Chain OR Supply Chain Manager OR Demand Planner, Isère, CDI'],

  // HelloWork — subject-parsed, single listing
  ['19e9b97af8e87f8e','Direct','Responsable de Dossiers','Responsable de Dossiers H/F','Ekko RH',null,null,'Not available',null,'pending',
   'Subject-parsed (HTML-only body — verify location/salary)',false,
   'Hello Zachary ! 1 nouvelle offre correspond à votre profil. Responsable de Dossiers H/F',
   'Zachary, Ekko RH recrute un Responsable de Dossiers H/F | Hello Zachary ! 1 nouvelle offre correspond à votre profil. Responsable de Dossiers H/F'],

  // Cadremploi "Une nouvelle offre a été publiée hier"
  ['19e9b292dfdc00c3','Cadremploi','Contrôleur de Gestion OR Contrôleur de Gestion Industriel OR Finance Business',null,null,null,null,'Not available',null,'manual_check',
   'Cadremploi HTML-only — open Gmail link to review and paste JD',false,
   'Soyez le premier à postuler ! Une nouvelle offre a été publiée hier. Contrôleur de Gestion OR Responsable Contrôle de Gestion OR Contrôleur de Gestion Industriel OR Finance Business',
   'Une nouvelle offre a été publiée hier | Contrôleur de Gestion OR Responsable Contrôle de Gestion OR Contrôleur de Gestion Industriel OR Finance Business'],

  // LinkedIn direct job notification — subject-parsed
  ['19e9aa1622628778','LinkedIn','LinkedIn','Responsable Administratif et Financier de transition H/F','Alma scop',null,null,'Not available',null,'pending',
   'Subject-parsed (HTML-only body — verify location/salary)',false,
   'Posted on 5/28/2026',
   'Alma scop is hiring a Responsable Administratif et Financier de transition H/F | Posted on 5/28/2026'],
];

const SQL = `INSERT INTO listing_inbox
  (parse_date,gmail_thread_id,gmail_thread_url,source,alert_keyword,job_title,company,location,salary,job_url,contract_type,parse_status,parse_notes,english,raw_snippet,raw_body,user_profile)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`;

async function run() {
  await c.connect();
  let inserted=0, errors=[];
  for(const r of rows){
    const [tid,src,kw,title,co,loc,sal,url,ct,st,notes,en,snip,body]=r;
    try{
      await c.query(SQL,[D,tid,tu(tid),src,kw,title,co,loc,sal,url,ct,st,notes,en,
        snip?snip.substring(0,200):null, body?body.substring(0,8000):null, U]);
      inserted++;
    }catch(e){ errors.push(`${tid}(${title||'null'}): ${e.message}`); }
  }
  await c.end();
  console.log(JSON.stringify({inserted,errors}));
}
run().catch(e=>{console.error(e.message);process.exit(1);});
