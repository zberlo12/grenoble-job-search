const {Client}=require(process.env.PG_MODULE);
const c=new Client({connectionString:process.env.PG_CONN});
const UP='zberlo';

function stripHF(t){
  if(!t) return '';
  return t.replace(/\s*[-–]\s*(H\/F|F\/H|M\/F|H\/(F|M)|multi.?site[s]?|Multisites?).*$/i,'')
          .replace(/\s*\((H\/F|F\/H|H|F|M)\).*$/i,'').trim();
}

// Pre-analyzed routing per listing_inbox id
// a: 'dismissed'|'needs_info'|'to_assess'|'co_title_skip'
// rf: red_flags array, mi: missing_info array, n: notes
const R={
  // DISMISSED → job_applications
  1128:{a:'dismissed',rf:['Low salary','Off-topic'],n:'Auto-dismissed: social sector director (Sauvegarde Isere), 49k below 52k salary floor'},
  1129:{a:'dismissed',rf:['Off-topic'],n:'Auto-dismissed: real estate commercial director (Human Immobilier)'},
  1130:{a:'dismissed',rf:['Off-topic'],n:"Auto-dismissed: restaurant operations manager (McDonald's)"},
  1131:{a:'dismissed',rf:['Off-topic','Low salary'],n:'Auto-dismissed: leisure venue manager (Laser Game), 31-37k below floor'},
  1133:{a:'dismissed',rf:['Off-topic','Far location'],n:'Auto-dismissed: IT/scientific manager at La Defence (Paris area) — red zone location'},
  1134:{a:'dismissed',rf:['Off-topic'],n:'Auto-dismissed: nuclear safety engineer, non-finance role'},
  1156:{a:'dismissed',rf:['Off-topic'],n:"Auto-dismissed: restaurant operations manager (McDonald's) — repeat listing"},
  1158:{a:'dismissed',rf:['Off-topic'],n:'Auto-dismissed: restaurant director (Burger King France)'},
  1159:{a:'dismissed',rf:['Off-topic'],n:'Auto-dismissed: restaurant director (Burger King Saint-Etienne)'},
  1160:{a:'dismissed',rf:['Off-topic'],n:'Auto-dismissed: real estate commercial director (Human Immobilier) — repeat listing'},

  // OPERATIONAL / AMBIGUOUS → review_queue Needs Info B
  1132:{a:'needs_info',mi:['Salary','Scope','Full JD'],n:'OPERATIONAL ROLE — review for fit. Project planner at Framatome, Saint-Vallier (Drome, ~1h). Salary 50-60k stated. Nuclear sector planning, not core finance.'},
  1135:{a:'needs_info',mi:['Salary','Company name','Full JD'],n:'QUEUED: Acheteur F/H via France Travail, Crolles (38, Green). Actual employer not disclosed. P2P/procurement adjacent to profile.'},

  // CADREMPLOI no-data rows (Puppeteer found no listings)
  1138:{a:'needs_info',mi:['Salary','Scope','Full JD','Company name'],n:'Cadremploi HTML — Puppeteer extracted no listing data. Alert: Directeur Financier OR DAF. Check email: https://mail.google.com/mail/u/0/#all/19f04bb7981a9eb7'},
  1139:{a:'needs_info',mi:['Salary','Scope','Full JD','Company name'],n:'Cadremploi HTML — Puppeteer extracted no listing data (3 collapsed threads). Alert: Credit Manager OR RAF OR CDG. Check email: https://mail.google.com/mail/u/0/#all/19f037878cd22558'},
  1140:{a:'needs_info',mi:['Salary','Scope','Full JD','Company name'],n:'Cadremploi HTML — Puppeteer found 2 offres, no data extracted. Alert: RAF OR Directeur Financier. Check email: https://mail.google.com/mail/u/0/#all/19f030d7014c9a03'},
  1141:{a:'needs_info',mi:['Salary','Scope','Full JD','Company name'],n:'OPERATIONAL ROLE — review for fit. Cadremploi snippet: RESPONSABLE SUPPLY CHAIN H/F CONNEX. Alert: Supply Chain OR Acheteur. Check email: https://mail.google.com/mail/u/0/#all/19f02f2520263b02'},
  1142:{a:'needs_info',mi:['Salary','Scope','Full JD','Company name'],n:'Cadremploi HTML — Puppeteer extracted no data. Alert: Controleur de Gestion OR Finance Business Partner. Check email: https://mail.google.com/mail/u/0/#all/19f0231a0b0a7b4b'},

  // Jun 27-28-29 LinkedIn/Indeed rows
  1144:{a:'needs_info',mi:['Salary','Company name','Hybrid policy'],n:'QUEUED: RAF via Comptalents (agency), Heyrieux (38). Actual employer not disclosed. RAF is core target role.'},
  1145:{a:'needs_info',mi:['Salary','Scope'],n:'QUEUED: Manager comptable at Groupe BBM, Montbonnot-Saint-Martin (38, Green). Need salary confirmation and scope.'},
  1146:{a:'co_title_skip'},
  1147:{a:'needs_info',mi:['Salary','Full JD'],n:'QUEUED: Chef de Mission Expertise Comptable at ODAS CONSEIL, Engins (38). Public accounting track — different from industrial finance background. Verify fit.'},
  1148:{a:'needs_info',mi:['Salary','Full JD'],n:'QUEUED: Chef de mission expertise comptable at BDO France, Grenoble area. Audit/public accounting firm. Verify if industrial finance roles also placed.'},
  1149:{a:'needs_info',mi:['Salary','Company name','Hybrid policy'],n:'QUEUED: RAF via Comptalents, Brie-et-Angonnes (38). Actual employer not disclosed. Second Comptalents RAF this week — may be same or different client.'},
  1150:{a:'needs_info',mi:['Salary','Company name','Hybrid policy'],n:'QUEUED: RAF via Talents Executive, Brie-et-Angonnes (38). Same location as 1149/Comptalents — possible same role via competing agencies. Verify.'},
  1151:{a:'needs_info',mi:['Salary','Scope','Full JD'],n:'OPERATIONAL ROLE — review for fit. Chef de projet ERP at Open-Prod (ERP vendor), Echirolles (38, Green). Finance system expertise could be relevant — verify if finance background required.'},
  1152:{a:'to_assess',rf:['Junior scope'],n:'Comptable (unspecified level) at Groupe BBM, Seyssinet-Pariset. Generic accounting title — likely below Finance Director seniority.'},
  1153:{a:'co_title_skip'},
  1154:{a:'needs_info',mi:['Company name','Hybrid policy','Full JD'],rf:['Low salary'],n:'QUEUED: RAF via Actual Talent, Echirolles (38). Salary 45-50k stated — below 52k floor but not hard reject. Actual employer unknown.'},
  1155:{a:'co_title_skip'},
  1157:{a:'co_title_skip'},
  1161:{a:'needs_info',mi:['Salary','Company name','Hybrid policy'],n:'QUEUED: Responsable finances via France Travail, Villefontaine (38 north, ~50 min). Finance manager role — actual employer unknown.'},
  1162:{a:'needs_info',mi:['Salary','Hybrid policy'],n:'QUEUED: Controleur de Gestion at NUVIA (nuclear services), Salaise-sur-Sanne (38/26 border, ~1h). Directly relevant CDG role at serious industrial company.'},
  1163:{a:'to_assess',rf:['Junior scope'],n:'Comptable (generic title) via France Travail, Isere. Likely below Finance Director seniority target without further context.'},
  1164:{a:'to_assess',rf:['Junior scope'],n:'Chef de Cabinet Expert-Comptable (futur associe) at Hommes et Valeurs, Biol (38). Public accounting partner track — different career path from industrial finance target.'},
  1165:{a:'needs_info',mi:['Salary','Scope'],n:'QUEUED: Acheteur services at GE Vernova, Grenoble (Green). Procurement/P2P role at key strategic target. Verify seniority and if finance background required.'},
  1166:{a:'needs_info',mi:['Salary','Scope'],n:'QUEUED: Lead Procurement Specialist - Electrical at GE Vernova, Grenoble (Green). Senior procurement at key strategic target. P2P/Achats Finance relevant.'},
  1167:{a:'needs_info',mi:['Salary','Hybrid policy'],n:'QUEUED: Cost Controller at Parlym, Saint-Paul-les-Romans (26, ~1h orange). Directly relevant cost control role. Parlym is nuclear construction sector.'},
  1168:{a:'co_title_skip'},
  1169:{a:'co_title_skip'},
  1170:{a:'co_title_skip'},
  1171:{a:'co_title_skip'},
  1172:{a:'needs_info',mi:['Salary','Scope','Full JD'],n:"QUEUED: Directeur agence expertise comptable at Fiducial (location: France). Accounting firm leadership. Verify location viability."},
  1173:{a:'needs_info',mi:['Salary','Scope','Full JD'],n:'OPERATIONAL ROLE — review for fit. Responsable Affaires CVC at Eiffage Energie Systemes, Grenoble (Green). HVAC project/business manager — not core finance.'},
};

// New companies to add to target_companies
const NEW_COS=[
  {co:'Groupe BBM',loc:'Montbonnot-Saint-Martin (38)',n:'Accounting/finance management roles in Grenoble metro — Manager comptable posted Jun 27'},
  {co:'BDO France',loc:'Grenoble',n:'Audit and public accounting firm — Chef de mission expertise comptable posted Jun 27'},
  {co:'NUVIA',loc:'Salaise-sur-Sanne (38)',n:'Nuclear services company — CDG role posted Jun 28'},
  {co:'Parlym',loc:'Saint-Paul-les-Romans (26)',n:'Nuclear construction — Cost Controller role posted Jun 28'},
  {co:'Fiducial',loc:'France (national)',n:'Accounting and financial services firm — Directeur agence role posted Jun 28'},
  {co:'Eiffage Energie Systemes',loc:'Grenoble',n:'Energy construction — operational role in Grenoble Jun 29'},
];

async function main(){
  await c.connect();
  const {rows}=await c.query(
    `SELECT id,parse_date,gmail_thread_id,gmail_thread_url,source,alert_keyword,job_title,company,
     location,salary,job_url,contract_type,parse_status,parse_notes,english,raw_snippet,raw_body,user_profile
     FROM listing_inbox WHERE parse_status='pending' AND user_profile=$1 ORDER BY id ASC`,
    [UP]
  );
  console.log(`Loaded ${rows.length} pending rows`);

  let cntDismissed=0,cntRQ=0,cntSkip=0,cntErr=0;
  const jaIds=[],rqIds=[];

  for(const row of rows){
    const r=R[row.id];
    if(!r){console.log(`[${row.id}] NO_ROUTING`);cntSkip++;continue;}

    try{
      if(r.a==='co_title_skip'){
        await c.query(`UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2`,[row.id,UP]);
        console.log(`[${row.id}] CO_TITLE_SKIP`);
        cntSkip++;
        continue;
      }

      if(row.job_url && row.job_url!=='Not available'){
        const d=await c.query(
          `SELECT id FROM (SELECT id FROM job_applications WHERE job_url=$1 AND user_profile=$2 UNION ALL SELECT id FROM review_queue WHERE job_url=$1 AND user_profile=$2) t LIMIT 1`,
          [row.job_url,UP]
        );
        if(d.rows.length>0){
          await c.query(`UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2`,[row.id,UP]);
          console.log(`[${row.id}] URL_DEDUP | ${row.job_title||'?'} @ ${row.company||'?'}`);
          cntSkip++;
          continue;
        }
      }

      if(row.company && row.job_title){
        const core=stripHF(row.job_title);
        if(core){
          const d=await c.query(
            `SELECT id FROM (SELECT id FROM job_applications WHERE company ILIKE $1 AND job_title ILIKE $2 AND user_profile=$3 UNION ALL SELECT id FROM review_queue WHERE company ILIKE $1 AND job_title ILIKE $2 AND user_profile=$3) t LIMIT 1`,
            [`%${row.company}%`,`%${core}%`,UP]
          );
          if(d.rows.length>0){
            await c.query(`UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2`,[row.id,UP]);
            console.log(`[${row.id}] CO_TITLE_DEDUP | ${row.job_title} @ ${row.company}`);
            cntSkip++;
            continue;
          }
        }
      }

      const pd=row.parse_date instanceof Date
        ?row.parse_date.toISOString().split('T')[0]
        :String(row.parse_date).split('T')[0];
      const rf=JSON.stringify(r.rf||[]);
      const mi=JSON.stringify(r.mi||[]);
      const jd=((row.raw_body||row.raw_snippet||'')).substring(0,3000);
      const eng=row.english||false;

      if(r.a==='dismissed'){
        const res=await c.query(
          `INSERT INTO job_applications (job_title,company,source,location,salary,priority,cv_approach,status,date_added,job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id,user_profile) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14,$15,$16,$17,$18,$19) RETURNING id`,
          [row.job_title,row.company,row.source,row.location,row.salary,'C','Standard','Dismissed',pd,row.job_url,row.gmail_thread_url,rf,mi,row.alert_keyword,r.n,eng,jd,row.id,UP]
        );
        await c.query(`UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2`,[row.id,UP]);
        console.log(`[${row.id}] DISMISSED ja.id=${res.rows[0].id} | ${row.job_title||'?'} @ ${row.company||'?'}`);
        jaIds.push(res.rows[0].id);
        cntDismissed++;

      }else if(r.a==='needs_info'){
        const res=await c.query(
          `INSERT INTO review_queue (job_title,company,source,location,salary,priority,status,date_added,job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id,user_profile) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13,$14,$15,$16,$17,$18) RETURNING id`,
          [row.job_title,row.company,row.source,row.location,row.salary,'B','Needs Info',pd,row.job_url,row.gmail_thread_url,rf,mi,row.alert_keyword,r.n,eng,jd,row.id,UP]
        );
        await c.query(`UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2`,[row.id,UP]);
        console.log(`[${row.id}] NEEDS_INFO rq.id=${res.rows[0].id} | ${row.job_title||'(no title)'} @ ${row.company||'(unknown)'}`);
        rqIds.push(res.rows[0].id);
        cntRQ++;

      }else if(r.a==='to_assess'){
        const res=await c.query(
          `INSERT INTO review_queue (job_title,company,source,location,salary,priority,status,date_added,job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id,user_profile) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13,$14,$15,$16,$17,$18) RETURNING id`,
          [row.job_title,row.company,row.source,row.location,row.salary,'C','To Assess',pd,row.job_url,row.gmail_thread_url,rf,mi,row.alert_keyword,r.n,eng,jd,row.id,UP]
        );
        await c.query(`UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2`,[row.id,UP]);
        console.log(`[${row.id}] TO_ASSESS rq.id=${res.rows[0].id} | ${row.job_title||'?'} @ ${row.company||'?'}`);
        rqIds.push(res.rows[0].id);
        cntRQ++;
      }

    }catch(e){
      console.error(`[${row.id}] ERR: ${e.message}`);
      cntErr++;
    }
  }

  let newCoCount=0;
  for(const nc of NEW_COS){
    try{
      const r=await c.query(
        `INSERT INTO target_companies (company,tier,location,notes,user_profile) VALUES ($1,'C',$2,$3,$4) ON CONFLICT DO NOTHING RETURNING id`,
        [nc.co,nc.loc,nc.n,UP]
      );
      if(r.rows.length>0){console.log(`NEW_CO: ${nc.co}`);newCoCount++;}
    }catch(e){console.error(`CO_ERR ${nc.co}: ${e.message}`);}
  }

  await c.end();
  console.log('\n=== SCAN COMPLETE ===');
  console.log(`Total pending: ${rows.length}`);
  console.log(`Dismissed (job_applications): ${cntDismissed}`);
  console.log(`Review queue (needs_info + to_assess): ${cntRQ}`);
  console.log(`Skipped (dedup / co-title): ${cntSkip}`);
  console.log(`Errors: ${cntErr}`);
  console.log(`New target companies: ${newCoCount}`);
  console.log(`JA ids: ${jaIds.join(',')}`);
  console.log(`RQ ids: ${rqIds.join(',')}`);
}

main().catch(e=>{console.error(e.message);process.exit(1);});
