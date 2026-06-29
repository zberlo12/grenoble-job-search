// Insert listing_inbox rows for Jun 27-29, 2026
// URL dedup already confirmed: skip Roche/4423054383, Revolut/4330935425,
//   Edwards/4410374946, Alfa Laval/4395706292
const {Client}=require(process.env.PG_MODULE);
const path=require('path');
const fs=require('fs');

const FILES_DIR='C:/Users/zberl/.claude/projects/C--Users-zberl-OneDrive-Documents-Code-Grenoble-job-search/869a6542-c05c-4b54-908b-99d4fa7f35ca/tool-results';

function readBody(filename){
  try{
    const raw=fs.readFileSync(path.join(FILES_DIR,'mcp-claude_ai_Gmail-get_thread-'+filename+'.txt'),'utf8');
    const j=JSON.parse(raw);
    const b=j.messages[0].plaintextBody||'';
    return b.substring(0,8000);
  }catch(e){return '';}
}

const THREAD_URL=tid=>`https://mail.google.com/mail/u/0/#all/${tid}`;

const bodies={
  '19f0a3d1f0c302dd':readBody('1782729383939'),
  '19f0a35d78a4d6fb':readBody('1782729384456'),
  '19f09c80d4995ee2':readBody('1782729385842'),
  '19f087e8888577b8':readBody('1782729387689'),
  '19f0da4f06eca441':readBody('1782729395513'),
  '19f0e12f69916df6':readBody('1782729395335'),
  '19f0f5c4f95afda4':readBody('1782729390891'),
  '19f0fca00b6d8e39':readBody('1782729390496'),
  '19f125d565da3db6':readBody('1782729897573'),
};

function snip(tid,title){
  const b=bodies[tid]||'';
  const idx=b.indexOf(title);
  if(idx===-1)return b.substring(0,200).trim();
  return b.substring(idx,idx+200).trim();
}

// cols: parse_date, tid, source, alert_keyword, job_title, company, location, salary, job_url, contract_type, parse_status, parse_notes, english
const LI_ROWS=[
  // JUN 27 LINKEDIN
  ['2026-06-27','19f0a3d1f0c302dd','LinkedIn','Responsable Administratif et Financier OR RAF','Responsable Administratif et Financier H/F','Comptalents','Heyrieux',null,'https://www.linkedin.com/jobs/view/4433884117/',null,'pending',null,false],
  ['2026-06-27','19f0a3d1f0c302dd','LinkedIn','Responsable Administratif et Financier OR RAF','Manager comptable - H/F','Groupe BBM','Montbonnot-Saint-Martin',null,'https://www.linkedin.com/jobs/view/4430289836/',null,'pending',null,false],
  ['2026-06-27','19f0a3d1f0c302dd','LinkedIn','Responsable Administratif et Financier OR RAF','Manager comptable - H/F','Groupe BBM','Seyssinet-Pariset',null,'https://www.linkedin.com/jobs/view/4430289837/',null,'pending',null,false],
  ['2026-06-27','19f0a3d1f0c302dd','LinkedIn','Responsable Administratif et Financier OR RAF','Chef de Mission Expertise Comptable (H/F)','ŌDAS CONSEIL','Engins',null,'https://www.linkedin.com/jobs/view/4433514850/',null,'pending',null,false],
  ['2026-06-27','19f0a3d1f0c302dd','LinkedIn','Responsable Administratif et Financier OR RAF','Chef de mission expertise comptable - F/H','BDO France','Greater Grenoble Metropolitan Area',null,'https://www.linkedin.com/jobs/view/4433818071/',null,'pending',null,false],
  ['2026-06-27','19f0a35d78a4d6fb','LinkedIn','Financial Controller OR Finance Manager','Responsable Administratif et Financier (H/F).','Comptalents','Brié-et-Angonnes',null,'https://www.linkedin.com/jobs/view/4434044192/',null,'pending',null,false],
  ['2026-06-27','19f0a35d78a4d6fb','LinkedIn','Financial Controller OR Finance Manager','Responsable Administratif et Financier (H/F).','Talents Executive','Brié-et-Angonnes',null,'https://www.linkedin.com/jobs/view/4430630470/',null,'pending',null,false],
  ['2026-06-27','19f09c80d4995ee2','LinkedIn','Responsable Supply Chain OR Supply Chain Manager','Chef de projet ERP H/F','ERP Open-Prod','Échirolles',null,'https://www.linkedin.com/jobs/view/4432956060/',null,'pending',null,false],
  ['2026-06-27','19f087e8888577b8','LinkedIn','Responsable Administratif Financier OR RAF','Comptable - H/F','Groupe BBM','Seyssinet-Pariset',null,'https://www.linkedin.com/jobs/view/4430609651/',null,'pending',null,false],
  ['2026-06-27','19f087e8888577b8','LinkedIn','Responsable Administratif Financier OR RAF','Comptable - H/F','Groupe BBM','Seyssinet-Pariset',null,'https://www.linkedin.com/jobs/view/4430610641/',null,'pending',null,false],
  // JUN 27 INDEED
  ['2026-06-27','19f0b7a0e0a2f3c8','Indeed','Contrôleur de Gestion','RAF F/H','Actual Talent','Échirolles (38)','45 000-50 000 EUR brut','Not available',null,'pending',null,false],
  ['2026-06-27','19f0b3c6654b671b','Indeed','Responsable Administratif Financier','RAF F/H','Actual Talent','Échirolles (38)','45 000-50 000 EUR brut','Not available',null,'pending',null,false],
  ['2026-06-27','19f0a7adb7560b2b','Indeed','Pilote Financier','Manager F/H',"McDonald's",'Les Abrets (38)',null,'Not available',null,'pending',null,false],
  ['2026-06-27','19f0a6f83ecfa60d','Indeed','finance director','RAF F/H','Actual Talent','Échirolles (38)','45 000-50 000 EUR brut','Not available',null,'pending',null,false],
  ['2026-06-27','19f0a6f83ecfa60d','Indeed','finance director','Directeur de restaurant - H/F','Burger King France','Chambéry (73)',null,'https://fr.indeed.com/viewjob?jk=b9886404a7e197',null,'pending',null,false],
  ['2026-06-27','19f0a6f83ecfa60d','Indeed','finance director','Directeur de restaurant H/F','Burger King St Etienne de St Geoirs','Saint-Étienne-de-Saint-Geoirs (38)',null,'Not available',null,'pending',null,false],
  ['2026-06-27','19f0a6f83ecfa60d','Indeed','finance director','Directeur Commercial Immobilier H/F - CDI H/F','Human Immobilier','Grenoble (38)','35 000-130 000 EUR brut','https://fr.indeed.com/viewjob?jk=re394f7983223e3',null,'pending',null,false],
  // JUN 28 LINKEDIN
  ['2026-06-28','19f0da4f06eca441','LinkedIn','Directeur Financier OR DAF OR Finance Director','Responsable finances (H/F)','France Travail','Villefontaine',null,'https://www.linkedin.com/jobs/view/4433201824/',null,'pending',null,false],
  ['2026-06-28','19f0e12f69916df6','LinkedIn','Responsable Administratif et Financier OR RAF','Contrôleur de Gestion H/F','NUVIA','Salaise-sur-Sanne',null,'https://www.linkedin.com/jobs/view/4434213729/',null,'pending',null,false],
  ['2026-06-28','19f0e12f69916df6','LinkedIn','Responsable Administratif et Financier OR RAF','Comptable (h/f) (H/F)','France Travail','Isère',null,'https://www.linkedin.com/jobs/view/4434043786/',null,'pending',null,false],
  ['2026-06-28','19f0e12f69916df6','LinkedIn','Responsable Administratif et Financier OR RAF','Chef de Cabinet Expert-Comptable (futur associé) H/F','Hommes et Valeurs','Biol',null,'https://www.linkedin.com/jobs/view/4430686273/',null,'pending',null,false],
  ['2026-06-28','19f0f5c4f95afda4','LinkedIn','Responsable Achats OR Acheteur Senior OR P2P Manager','Acheteur services (H/F)','GE Vernova','Grenoble',null,'https://www.linkedin.com/jobs/view/4374121972/',null,'pending',null,false],
  ['2026-06-28','19f0f5c4f95afda4','LinkedIn','Responsable Achats OR Acheteur Senior OR P2P Manager','Lead Procurement Specialist - Electrical (Chargé de projets achats électrique H/F)','GE Vernova','Grenoble',null,'https://www.linkedin.com/jobs/view/4343936155/',null,'pending',null,false],
  ['2026-06-28','19f0fca00b6d8e39','LinkedIn','Cost Controller','Cost Controller','Parlym','26700',null,'https://www.linkedin.com/jobs/view/4426894835/',null,'pending',null,false],
  ['2026-06-28','19f0fca00b6d8e39','LinkedIn','Cost Controller','Cost Controller H/F','Parlym','26700',null,'https://www.linkedin.com/jobs/view/4427307810/',null,'pending',null,false],
  // JUN 28 INDEED
  ['2026-06-28','19f104725f37a023','Indeed','Contrôleur de Gestion','RAF F/H','Actual Talent','Échirolles (38)','45 000-50 000 EUR brut','Not available',null,'pending',null,false],
  ['2026-06-28','19f10400f0abc133','Indeed','Responsable Administratif Financier','RAF F/H','Actual Talent','Échirolles (38)','45 000-50 000 EUR brut','Not available',null,'pending',null,false],
  ['2026-06-28','19f0fdb4608fa4a4','Indeed','finance director','RAF F/H','Actual Talent','Échirolles (38)','45 000-50 000 EUR brut','Not available',null,'pending',null,false],
  ['2026-06-28','19f0fdb4608fa4a4','Indeed','finance director',"Directeur d'agence expertise comptable H/F",'Fiducial','France',null,'Not available',null,'pending',null,false],
  // JUN 29 LINKEDIN
  ['2026-06-29','19f125d565da3db6','LinkedIn','Financial Controller OR Finance Manager',"Responsable d'Affaires CVC",'Eiffage Énergie Systèmes','Grenoble',null,'https://www.linkedin.com/jobs/view/4180274377/',null,'pending',null,false],
];

// Cadremploi threads (puppeteer_pending) - 13 threads Jun 27-29
// APEC thread (manual_check) - 1 thread Jun 27
const HTML_ROWS=[
  // CADREMPLOI JUN 27
  ['2026-06-27','19f08581e5df6f90','Cadremploi','Responsable Supply Chain','1 offre à ne rater sous aucun prétexte',null,null,null,'Not available',null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction',false],
  ['2026-06-27','19f087d0abd83b25','Cadremploi','Responsable Administratif et Financier OR RAF','2 offres à ne rater sous aucun prétexte !',null,null,null,'Not available',null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction',false],
  ['2026-06-27','19f089dfd73453f1','Cadremploi','Financial Controller OR Finance Manager','Et si vous modifiez vos critères de recherche ?',null,null,null,'Not available',null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction',false],
  ['2026-06-27','19f097ba961808ff','Cadremploi','Directeur Financier OR DAF','Votre profil intéresse ces entreprises !',null,null,null,'Not available',null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction',false],
  ['2026-06-27','19f09e92e7dcb977','Cadremploi','Responsable Administratif et Financier OR RAF','1 nouvelle offre a été publiée cet après-midi',null,null,null,'Not available',null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction',false],
  // CADREMPLOI JUN 28
  ['2026-06-28','19f0cc7ab96f0bcf','Cadremploi','Responsable Administratif et Financier OR RAF','2 nouvelles offres ont été publiées hier',null,null,null,'Not available',null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction',false],
  ['2026-06-28','19f0d756ae3edb0b','Cadremploi','Directeur Financier OR DAF','2 offres à ne rater sous aucun prétexte !',null,null,null,'Not available',null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction',false],
  ['2026-06-28','19f0dc68a7969a90','Cadremploi','Responsable Administratif Financier OR RAF','Et si vous modifiez vos critères de recherche ?',null,null,null,'Not available',null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction',false],
  ['2026-06-28','19f0ec81b38710e0','Cadremploi','Directeur Financier OR DAF','Votre profil intéresse ces entreprises !',null,null,null,'Not available',null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction',false],
  // CADREMPLOI JUN 29
  ['2026-06-29','19f11e50ccc24b82','Cadremploi','Responsable Administratif et Financier OR RAF','2 nouvelles offres ont été publiées la semaine dernière',null,null,null,'Not available',null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction',false],
  ['2026-06-29','19f11e5156d7b72e','Cadremploi','Contrôleur de Gestion','Une nouvelle offre a été publiée la semaine dernière',null,null,null,'Not available',null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction',false],
  ['2026-06-29','19f1264fe51dcec1','Cadremploi','Directeur Financier OR DAF','2 offres à ne rater sous aucun prétexte !',null,null,null,'Not available',null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction',false],
  ['2026-06-29','19f12ea436a00c75','Cadremploi','Financial Controller OR Finance Manager','Et si vous modifiez vos critères de recherche ?',null,null,null,'Not available',null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction',false],
  // APEC JUN 27
  ['2026-06-27','19f08052d63987a8','APEC','offres APEC','1 offre Apec du 27/06/2026',null,null,null,'Not available',null,'manual_check','APEC: 1 offres — offres APEC — HTML-only — check apec.fr manually',false],
];

const SQL=`INSERT INTO listing_inbox
(parse_date,gmail_thread_id,gmail_thread_url,source,alert_keyword,job_title,company,location,salary,job_url,contract_type,parse_status,parse_notes,english,raw_snippet,raw_body,user_profile)
VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
ON CONFLICT DO NOTHING`;

async function run(){
  const c=new Client({connectionString:process.env.PG_CONN});
  await c.connect();
  let inserted=0,errors=0;

  for(const r of LI_ROWS){
    const [pd,tid,src,ak,title,co,loc,sal,url,ct,ps,pn,en]=r;
    const turl=THREAD_URL(tid);
    const raw_body=bodies[tid]||(title+' | '+co+' | '+loc+' | '+(sal||''));
    const raw_snip=src==='LinkedIn'?snip(tid,title):(title+' | '+co+' | '+loc).substring(0,200);
    try{
      const res=await c.query(SQL,[pd,tid,turl,src,ak,title,co,loc,sal,url,ct,ps,pn,en,raw_snip,raw_body,'zberlo']);
      if(res.rowCount>0){console.log('INS '+pd+' | '+src+' | '+title+' | '+co);inserted++;}
      else{console.log('SKIP(conflict) '+title+' | '+co);}
    }catch(e){console.error('ERR '+title+' | '+co+': '+e.message);errors++;}
  }

  for(const r of HTML_ROWS){
    const [pd,tid,src,ak,subj,title,co,loc,sal,url,ct,ps,pn,en]=r;
    const turl=THREAD_URL(tid);
    const raw_body=subj+' | alert: '+ak;
    try{
      const res=await c.query(SQL,[pd,tid,turl,src,ak,title,co,loc,sal,url,ct,ps,pn,en,subj.substring(0,200),raw_body,'zberlo']);
      if(res.rowCount>0){console.log('INS '+pd+' | '+src+' | '+subj);inserted++;}
      else{console.log('SKIP(conflict) '+src+' | '+subj);}
    }catch(e){console.error('ERR '+src+' | '+subj+': '+e.message);errors++;}
  }

  await c.end();
  console.log('\n--- DONE: inserted='+inserted+' errors='+errors+' ---');
}
run().catch(e=>{console.error(e.message);process.exit(1);});
