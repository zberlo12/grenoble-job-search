// Jun 18 listing_inbox batch insert — standalone one-time script (see inbox_insert_may21.js pattern)
// Covers: Indeed threads 1/2/3/4 + LinkedIn subject-parsed + Cadremploi + HelloWork + APEC
const {Client} = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const c = new Client({connectionString:'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'});
const D='2026-06-18', U='zberlo', BASE='https://mail.google.com/mail/u/0/#all/';

async function ins(r) {
  await c.query(
    `INSERT INTO listing_inbox
     (parse_date,gmail_thread_id,gmail_thread_url,source,alert_keyword,
      job_title,company,location,salary,job_url,contract_type,
      parse_status,parse_notes,english,raw_snippet,raw_body,user_profile)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [D,r.tid,BASE+r.tid,r.src,r.kw,r.title,r.co,r.loc,r.sal,r.url,r.ct,
     r.st,r.notes,r.eng||false,r.snip,r.body,U]
  );
}

async function main() {
  await c.connect();

  // Bulk URL dedup check for all jk-based URLs across all 4 threads
  const jkUrls=[
    'https://fr.indeed.com/viewjob?jk=m8a437d46987dec',   // Radiall CdG
    'https://fr.indeed.com/viewjob?jk=B981bb10019a7fe',   // Elydan CdG
    'https://fr.indeed.com/viewjob?jk=5af84b656261407',   // Pays Voironnais (corrected from raw)
    'https://fr.indeed.com/viewjob?jk=a00e43630e6449',    // MasterGrid alternant
    'https://fr.indeed.com/viewjob?jk=Q8ef4e74da1ab83',   // EOLYA CVC
    'https://fr.indeed.com/viewjob?jk=38e1775ca55c07',    // Laser Game
    'https://fr.indeed.com/viewjob?jk=bed51e9d7c68d5',    // Banque de Savoie
    'https://fr.indeed.com/viewjob?jk=056d4a249a4871',    // Banque Populaire AURA
    'https://fr.indeed.com/viewjob?jk=5e284dfe3c9250',    // Emeis (healthcare)
    'https://fr.indeed.com/viewjob?jk=a798f5750a4bc4',    // Jean Lain Mobilités
    'https://fr.indeed.com/viewjob?jk=b38021d6d7e81f',    // CEVEO (tourism)
    'https://fr.indeed.com/viewjob?jk=907867290e7661',    // EVADE (education)
    'https://fr.indeed.com/viewjob?jk=1a764f0add525d',    // Mairie de Bernin
  ];
  const dr=await c.query(
    `SELECT DISTINCT job_url FROM (
       SELECT job_url FROM listing_inbox WHERE job_url=ANY($1) AND parse_date>=CURRENT_DATE-7 AND user_profile=$2
       UNION ALL
       SELECT job_url FROM job_applications WHERE job_url=ANY($1) AND user_profile=$2
     ) t`,
    [jkUrls,U]
  );
  const seen=new Set(dr.rows.map(r=>r.job_url));
  console.log('URL dedup hits ('+seen.size+'):',[...seen].join(', ')||'none');

  const rows=[
    // ── THREAD 1: Indeed "6 nouveaux emplois Contrôleur de Gestion" (19edcfe31cd87b0e) ──
    {tid:'19edcfe31cd87b0e',src:'Indeed',kw:'Contrôleur de Gestion',
     title:'Responsable Administratif et Financier F/H',co:'Actual Talent',
     loc:'Échirolles (38)',sal:'45000-50000',url:'Not available',ct:'CDI',
     st:'pending',notes:'Indeed multi-listing (CdG alert); pagead URL only',
     snip:'Actual Talent - Échirolles (38) - De 45 000 € à 50 000 € par an',
     body:'Indeed CdG alert 2026-06-18 | Actual Talent - Responsable Administratif et Financier F/H - Échirolles (38) - De 45 000 € à 50 000 € par an - CDI'},
    {tid:'19edcfe31cd87b0e',src:'Indeed',kw:'Contrôleur de Gestion',
     title:'Responsable Administratif et Financier H/F',co:'TRIALP',
     loc:'Chambéry (73)',sal:'45000-55000',url:'Not available',ct:'CDI',
     st:'pending',notes:'Indeed multi-listing (CdG alert); pagead URL only',
     snip:'TRIALP - Chambéry (73) - De 45 000 € à 55 000 € par an',
     body:'Indeed CdG alert 2026-06-18 | TRIALP - Responsable Administratif et Financier H/F - Chambéry (73) - De 45 000 € à 55 000 € par an - CDI'},
    {tid:'19edcfe31cd87b0e',src:'Indeed',kw:'Contrôleur de Gestion',
     title:'Contrôleur de Gestion - R&D et Fonctions Corporate (H/F)',co:'Radiall',
     loc:'Voreppe (38)',sal:null,url:'https://fr.indeed.com/viewjob?jk=m8a437d46987dec',ct:'CDI',
     st:'pending',notes:null,
     snip:'Radiall - Voreppe (38) - CdG business partner des fonctions R&T, SI, Dev Tech',
     body:'Indeed CdG alert 2026-06-18 | Radiall - Contrôleur de Gestion R&D et Fonctions Corporate (H/F) - Voreppe (38) - CDI'},
    {tid:'19edcfe31cd87b0e',src:'Indeed',kw:'Contrôleur de Gestion',
     title:'Controleur de Gestion Industriel H/F',co:'Groupe Elydan',
     loc:'Saint-Étienne-de-Saint-Geoirs (38)',sal:null,url:'https://fr.indeed.com/viewjob?jk=B981bb10019a7fe',ct:'CDI',
     st:'pending',notes:null,
     snip:'Groupe Elydan - Saint-Étienne-de-Saint-Geoirs (38) - analyses de rentabilité',
     body:'Indeed CdG alert 2026-06-18 | Groupe Elydan - Controleur de Gestion Industriel H/F - Saint-Étienne-de-Saint-Geoirs (38)'},
    {tid:'19edcfe31cd87b0e',src:'Indeed',kw:'Contrôleur de Gestion',
     title:"Chargé d'études budgétaires et contrôle de gestion H/F",co:'Pays Voironnais',
     loc:'Voiron (38)',sal:'8256',url:'https://fr.indeed.com/viewjob?jk=5af84b656261407',ct:null,
     st:'pending',notes:null,
     snip:'Pays Voironnais - Voiron (38) - 688€/mois - collectivité publique',
     body:'Indeed CdG alert 2026-06-18 | Pays Voironnais - Chargé études budgétaires H/F - Voiron (38) - 688€/mois (8 256€/an)'},
    {tid:'19edcfe31cd87b0e',src:'Indeed',kw:'Contrôleur de Gestion',
     title:'Alternant Contrôleur de gestion (F/H)',co:'MasterGrid',
     loc:'Grenoble (38)',sal:null,url:'https://fr.indeed.com/viewjob?jk=a00e43630e6449',ct:null,
     st:'pending',notes:'Alternance/apprentissage',
     snip:'MasterGrid - Grenoble (38) - alternant Master contrôle de gestion',
     body:'Indeed CdG alert 2026-06-18 | MasterGrid - Alternant Contrôleur de gestion (F/H) - Grenoble (38) - alternance'},

    // ── THREAD 2: Indeed "2 nouveaux emplois RAF" (19edc85dfb89dde4) — overlaps with thread 1 ──
    {tid:'19edc85dfb89dde4',src:'Indeed',kw:'Responsable Administratif Financier',
     title:'Responsable Administratif et Financier F/H',co:'Actual Talent',
     loc:'Échirolles (38)',sal:'45000-50000',url:'Not available',ct:'CDI',
     st:'pending',notes:'Indeed multi-listing (RAF alert); pagead URL only; same job as CdG alert thread',
     snip:'Actual Talent - Échirolles (38) - De 45 000 € à 50 000 € par an',
     body:'Indeed RAF alert 2026-06-18 | Actual Talent - Responsable Administratif et Financier F/H - Échirolles (38) - De 45 000 € à 50 000 € par an'},
    {tid:'19edc85dfb89dde4',src:'Indeed',kw:'Responsable Administratif Financier',
     title:'Responsable Administratif et Financier H/F',co:'TRIALP',
     loc:'Chambéry (73)',sal:'45000-55000',url:'Not available',ct:'CDI',
     st:'pending',notes:'Indeed multi-listing (RAF alert); pagead URL only; same job as CdG alert thread',
     snip:'TRIALP - Chambéry (73) - De 45 000 € à 55 000 € par an',
     body:'Indeed RAF alert 2026-06-18 | TRIALP - Responsable Administratif et Financier H/F - Chambéry (73) - De 45 000 € à 55 000 € par an'},

    // ── THREAD 3: Indeed "4 nouveaux emplois Pilote Financier" (19edc2cd99510131) ──
    {tid:'19edc2cd99510131',src:'Indeed',kw:'Pilote Financier',
     title:'Comptable H/F',co:'ZADIENT Technologies SAS',
     loc:'Sainte-Hélène-du-Lac (73)',sal:'30000-40000',url:'Not available',ct:null,
     st:'pending',notes:'Indeed multi-listing (Pilote Financier alert); pagead URL only',
     snip:'ZADIENT Technologies SAS - Sainte-Hélène-du-Lac (73) - 30 000 à 40 000€/an',
     body:'Indeed Pilote Financier alert 2026-06-18 | ZADIENT Technologies SAS - Comptable H/F - Sainte-Hélène-du-Lac (73) - 30-40K'},
    {tid:'19edc2cd99510131',src:'Indeed',kw:'Pilote Financier',
     title:'Manager de production équipe ICTSMMA (MRU/FAB/CTL) F/H',co:'Framatome',
     loc:'Grenoble (38)',sal:'65000-70000',url:'Not available',ct:null,
     st:'pending',notes:'Indeed multi-listing; pagead URL only; production manager role in finance alert',
     snip:'Framatome - Grenoble (38) - 65 000 à 70 000€/an - BU I&C',
     body:'Indeed Pilote Financier alert 2026-06-18 | Framatome - Manager production ICTSMMA F/H - Grenoble (38) - 65-70K'},
    {tid:'19edc2cd99510131',src:'Indeed',kw:'Pilote Financier',
     title:"Chargé d'Affaires travaux CVC F/H",co:'EOLYA',
     loc:'Saint-Martin-le-Vinoux (38)',sal:null,url:'https://fr.indeed.com/viewjob?jk=Q8ef4e74da1ab83',ct:null,
     st:'pending',notes:'CVC (heating/cooling) role in finance alert',
     snip:'EOLYA - Saint-Martin-le-Vinoux (38) - services énergétiques CVC',
     body:'Indeed Pilote Financier alert 2026-06-18 | EOLYA - Chargé Affaires CVC F/H - Saint-Martin-le-Vinoux (38)'},
    {tid:'19edc2cd99510131',src:'Indeed',kw:'Pilote Financier',
     title:'Manager/Responsable Laser Game Evolution H/F',co:'Laser Game Evolution',
     loc:'La Ravoire (73)',sal:'31000-37800',url:'https://fr.indeed.com/viewjob?jk=38e1775ca55c07',ct:null,
     st:'pending',notes:'Non-finance role in finance alert',
     snip:'Laser Game Evolution - La Ravoire (73) - 31 000 à 37 800€/an',
     body:'Indeed Pilote Financier alert 2026-06-18 | Laser Game Evolution - Manager Laser Game H/F - La Ravoire (73) - 31-37.8K'},

    // ── THREAD 4: Indeed "finance director +11 offres" (19edc299dd61dbf8) ──
    // Actual Talent RAF F/H duplicate — skipped (same job as thread 1, pagead URL, no dedup possible)
    // Pays Voironnais duplicate — will URL-dedup via jk=5af84b656261407
    {tid:'19edc299dd61dbf8',src:'Indeed',kw:'finance director',
     title:"Directeur adjoint de groupe d'agence F/H",co:'Banque de Savoie',
     loc:'Saint-Alban-Leysse (73)',sal:null,url:'https://fr.indeed.com/viewjob?jk=bed51e9d7c68d5',ct:null,
     st:'pending',notes:'Banking sector; management role, not pure FP&A',
     snip:"Banque de Savoie - Saint-Alban-Leysse (73) - Directeur adjoint de groupe d'agence",
     body:"Indeed finance director alert 2026-06-18 | Banque de Savoie - Directeur adjoint de groupe d'agence F/H - Saint-Alban-Leysse (73)"},
    {tid:'19edc299dd61dbf8',src:'Indeed',kw:'finance director',
     title:'Directeur Département Surveillance F/H',co:'Banque Populaire Auvergne Rhône Alpes',
     loc:'Corenc (38)',sal:null,url:'https://fr.indeed.com/viewjob?jk=056d4a249a4871',ct:null,
     st:'pending',notes:'Banking risk/surveillance management role',
     snip:'Banque Populaire AURA - Corenc (38) - Directeur Département Surveillance F/H',
     body:'Indeed finance director alert 2026-06-18 | Banque Populaire Auvergne Rhône Alpes - Directeur Département Surveillance F/H - Corenc (38)'},
    {tid:'19edc299dd61dbf8',src:'Indeed',kw:'finance director',
     title:'Directeur.trice Adjoint.e',co:'Emeis',
     loc:'Seyssins (38)',sal:null,url:'https://fr.indeed.com/viewjob?jk=5e284dfe3c9250',ct:null,
     st:'pending',notes:'Healthcare facility director — non-finance',
     snip:'Emeis - Seyssins (38) - Directeur Adjoint (healthcare)',
     body:'Indeed finance director alert 2026-06-18 | Emeis - Directeur.trice Adjoint.e - Seyssins (38) - healthcare sector'},
    {tid:'19edc299dd61dbf8',src:'Indeed',kw:'finance director',
     title:'Directeur(trice) Commercial(e)',co:'Jean Lain Mobilités',
     loc:'Chambéry (73)',sal:'69000-90000',url:'https://fr.indeed.com/viewjob?jk=a798f5750a4bc4',ct:null,
     st:'pending',notes:'Commercial director — car dealership group; non-finance',
     snip:'Jean Lain Mobilités - Chambéry (73) - Directeur Commercial - 69-90K',
     body:'Indeed finance director alert 2026-06-18 | Jean Lain Mobilités - Directeur Commercial - Chambéry (73) - 69 000 à 90 000€/an'},
    {tid:'19edc299dd61dbf8',src:'Indeed',kw:'finance director',
     title:'Directeur de site automobile VO F/H',co:'Actual Talent',
     loc:'Seyssinet-Pariset (38)',sal:'60000-100000',url:'Not available',ct:null,
     st:'pending',notes:'Car dealership site director — non-finance; pagead URL only',
     snip:'Actual Talent - Seyssinet-Pariset (38) - Directeur site automobile VO - 60-100K',
     body:'Indeed finance director alert 2026-06-18 | Actual Talent - Directeur de site automobile VO F/H - Seyssinet-Pariset (38) - 60-100K'},
    {tid:'19edc299dd61dbf8',src:'Indeed',kw:'finance director',
     title:"Directeur d'agence d'intérim et de recrutement indépendant H/F",co:'Lynx RH',
     loc:'Chambéry (73)',sal:'30-55€/hr',url:'Not available',ct:null,
     st:'pending',notes:'Recruitment agency director — non-finance; pagead URL only',
     snip:'Lynx RH - Chambéry (73) - Directeur agence intérim/recrutement',
     body:"Indeed finance director alert 2026-06-18 | Lynx RH - Directeur d'agence d'intérim H/F - Chambéry (73)"},
    {tid:'19edc299dd61dbf8',src:'Indeed',kw:'finance director',
     title:"Directeur adjoint de village vacances H/F",co:'CEVEO',
     loc:'Allevard (38)',sal:'27216',url:'https://fr.indeed.com/viewjob?jk=b38021d6d7e81f',ct:null,
     st:'pending',notes:'Tourism/leisure director — non-finance; 2 268€/mois',
     snip:'CEVEO - Allevard (38) - Directeur adjoint village vacances - 2 268€/mois',
     body:'Indeed finance director alert 2026-06-18 | CEVEO - Directeur adjoint village vacances H/F - Allevard (38) - 2 268€/mois'},
    {tid:'19edc299dd61dbf8',src:'Indeed',kw:'finance director',
     title:'Directeur ou Directrice en périscolaire et ALSH',co:'EVADE',
     loc:'Échirolles (38)',sal:'28488',url:'https://fr.indeed.com/viewjob?jk=907867290e7661',ct:null,
     st:'pending',notes:'Education/youth services director — non-finance',
     snip:'EVADE - Échirolles (38) - Directeur périscolaire et ALSH - ≥2 374€/mois',
     body:'Indeed finance director alert 2026-06-18 | EVADE - Directeur périscolaire et ALSH - Échirolles (38)'},
    {tid:'19edc299dd61dbf8',src:'Indeed',kw:'finance director',
     title:"Directeur/trice accueils de mineurs périscolaires",co:'Mairie de Bernin',
     loc:'Bernin (38)',sal:null,url:'https://fr.indeed.com/viewjob?jk=1a764f0add525d',ct:null,
     st:'pending',notes:'Municipal children services director — non-finance; hourly rate 13.50€/hr',
     snip:'Mairie de Bernin - Bernin (38) - Directeur accueils mineurs périscolaires',
     body:'Indeed finance director alert 2026-06-18 | Mairie de Bernin - Directeur accueils de mineurs - Bernin (38) - 13.50€/hr'},

    // ── LinkedIn subject-parsed (HTML-only bodies — subject line extraction) ──
    {tid:'19edcb8468283538',src:'LinkedIn',kw:'RAF',
     title:'Responsable Administratif et Financier (F/H)',
     co:'VINCI Energies France Industrie Centre Est Méditerranée',
     loc:'Saint-Jean-de-Moirans (38)',sal:null,url:'Not available',ct:null,
     st:'pending',notes:'Subject-parsed (HTML-only body — verify location/salary)',
     snip:'LinkedIn: RAF at VINCI Energies France Industrie Centre Est Méditerranée posted 6/16/26',
     body:'LinkedIn alert 2026-06-18 | Responsable Administratif et Financier (F/H) at VINCI Energies France Industrie Centre Est Méditerranée posted on 6/16/26'},
    {tid:'19edc4c6061878c2',src:'LinkedIn',kw:'Supply Chain',
     title:'Responsable Supply Chain Usine F/H',co:'Candia (Coopérative Sodiaal)',
     loc:null,sal:null,url:'Not available',ct:null,
     st:'pending',notes:'Subject-parsed (HTML-only body — verify location/salary); supply chain role',
     snip:'LinkedIn: RSC Usine at Candia (Coopérative Sodiaal) posted 6/17/26',
     body:'LinkedIn alert 2026-06-18 | Responsable Supply Chain Usine F/H at Candia (Coopérative Sodiaal) posted on 6/17/26'},
    {tid:'19edc0d8bcef27b4',src:'LinkedIn',kw:'FP&A',
     title:'Senior FP&A Analytics & Automation Engineer',co:'BD',
     loc:'Grenoble (38)',sal:null,url:'Not available',ct:null,eng:true,
     st:'pending',notes:'Subject-parsed (HTML-only body — verify location/salary); English role',
     snip:'LinkedIn: Senior FP&A Analytics & Automation Engineer at BD posted 6/17/26',
     body:'LinkedIn alert 2026-06-18 | BD - Senior FP&A Analytics & Automation Engineer posted on 6/17/26'},
    {tid:'19edb8e13938b3a9',src:'LinkedIn',kw:'Finance SI',
     title:'Responsable application SI Finance - domaine Trésorerie (F/H)',co:'Artelia',
     loc:null,sal:'60000',url:'Not available',ct:null,
     st:'pending',notes:'Subject-parsed (HTML-only body — verify location/salary)',
     snip:'LinkedIn: Resp. SI Finance Trésorerie at Artelia: up to €60K/year',
     body:'LinkedIn alert 2026-06-18 | Responsable application SI Finance - domaine Trésorerie (F/H) at Artelia: up to €60K/year'},
    {tid:'19edb36ed6893437',src:'LinkedIn',kw:'Planification',
     title:'Gestionnaire planification H/F',co:'Groupe elydan',
     loc:null,sal:null,url:'Not available',ct:null,
     st:'pending',notes:'Subject-parsed (HTML-only body — verify location/salary); planning/scheduling role',
     snip:'LinkedIn: Gestionnaire planification H/F at Groupe elydan',
     body:'LinkedIn alert 2026-06-18 | Gestionnaire planification H/F at Groupe elydan'},
    {tid:'19eda93183630ebc',src:'LinkedIn',kw:'Contrôleur de Gestion',
     title:'Contrôleur de gestion industrielle (H/F)',co:'Talents Finance',
     loc:null,sal:'48000',url:'Not available',ct:null,
     st:'pending',notes:'Subject-parsed (HTML-only body — verify location/salary); below salary floor',
     snip:'LinkedIn: Contrôleur de gestion industrielle at Talents Finance: up to €48K/year',
     body:'LinkedIn alert 2026-06-18 | Contrôleur de gestion industrielle (H/F) at Talents Finance: up to €48K/year'},

    // ── Cadremploi — HTML-only, puppeteer_pending (5 threads) ──
    {tid:'19edb8c66ce39daf',src:'Cadremploi',kw:'Cadremploi',
     title:null,co:null,loc:null,sal:null,url:'Not available',ct:null,
     st:'puppeteer_pending',notes:'Known HTML-only source — queued for Puppeteer extraction',
     snip:null,body:'Cadremploi alert 2026-06-18 | thread 19edb8c66ce39daf'},
    {tid:'19edb1ef6a5b5197',src:'Cadremploi',kw:'Cadremploi',
     title:null,co:null,loc:null,sal:null,url:'Not available',ct:null,
     st:'puppeteer_pending',notes:'Known HTML-only source — queued for Puppeteer extraction',
     snip:null,body:'Cadremploi: Votre profil intéresse ces entreprises | 2026-06-18 | thread 19edb1ef6a5b5197'},
    {tid:'19eda44a93f79dcb',src:'Cadremploi',kw:'Cadremploi',
     title:null,co:null,loc:null,sal:null,url:'Not available',ct:null,
     st:'puppeteer_pending',notes:'Known HTML-only source — queued for Puppeteer extraction',
     snip:null,body:'Cadremploi: Et si vous modifiez vos critères | 2026-06-18 | thread 19eda44a93f79dcb'},
    {tid:'19ed9c843cb24f28',src:'Cadremploi',kw:'Cadremploi',
     title:null,co:null,loc:null,sal:null,url:'Not available',ct:null,
     st:'puppeteer_pending',notes:'Known HTML-only source — queued for Puppeteer extraction',
     snip:null,body:'Cadremploi: 1 offre à ne rater | 2026-06-18 | thread 19ed9c843cb24f28'},
    {tid:'19ed935b63b9e706',src:'Cadremploi',kw:'Cadremploi',
     title:null,co:null,loc:null,sal:null,url:'Not available',ct:null,
     st:'puppeteer_pending',notes:'Known HTML-only source — queued for Puppeteer extraction',
     snip:null,body:'Cadremploi: Une nouvelle offre a été publiée hier | 2026-06-18 | thread 19ed935b63b9e706'},

    // ── HelloWork — HTML-only, puppeteer_pending (2 threads) ──
    {tid:'19edb6b6e68bd4d1',src:'HelloWork',kw:'Contrôleur de Gestion',
     title:null,co:null,loc:null,sal:null,url:'Not available',ct:null,
     st:'puppeteer_pending',notes:'Known HTML-only source — queued for Puppeteer extraction',
     snip:null,body:'HelloWork: 2 nouvelles offres Contrôleur de Gestion | 2026-06-18 | thread 19edb6b6e68bd4d1'},
    {tid:'19ed94c8d62f42ec',src:'HelloWork',kw:'Supply Chain',
     title:null,co:null,loc:null,sal:null,url:'Not available',ct:null,
     st:'puppeteer_pending',notes:'Known HTML-only source — queued for Puppeteer extraction',
     snip:null,body:'HelloWork: 8 offres emploi (Candia RSC + 7) | 2026-06-18 | thread 19ed94c8d62f42ec'},

    // ── APEC — manual_check (1 thread) ──
    {tid:'19ed98be7b119624',src:'APEC',kw:'APEC',
     title:null,co:null,loc:null,sal:null,url:'Not available',ct:null,
     st:'manual_check',notes:'APEC: 13 offres du 18/06/2026 — HTML-only — check apec.fr manually',
     snip:null,body:'APEC: 13 offres Apec du 18/06/2026 | thread 19ed98be7b119624'},
  ];

  let ok=0,skip=0,err=0;
  const errs=[];
  for(const r of rows){
    if(r.url!=='Not available' && seen.has(r.url)){
      console.log('DEDUP:',r.url,'-',r.co,r.title);skip++;continue;
    }
    try{await ins(r);ok++;}
    catch(e){console.error('ERR:',r.tid,r.title||'(html-only)',e.message);err++;errs.push({tid:r.tid,err:e.message});}
  }

  await c.end();
  console.log(JSON.stringify({inserted:ok,url_deduped:skip,errors:err,error_threads:errs}));
}
main().catch(e=>{console.error(e.message);process.exit(1);});
