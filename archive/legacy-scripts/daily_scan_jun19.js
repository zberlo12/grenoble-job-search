'use strict';
const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const db = new Client({ connectionString: cfg.supabase_connection_string });
const USER = 'zberlo';
const TODAY = '2026-06-19';

async function dedup(jobUrl, company, titleKeyword) {
  if (jobUrl && jobUrl !== 'Not available') {
    const r = await db.query(
      `SELECT id FROM (
         SELECT id FROM job_applications WHERE job_url=$1 AND user_profile=$2
         UNION ALL
         SELECT id FROM review_queue WHERE job_url=$1 AND user_profile=$2
       ) t LIMIT 1`,
      [jobUrl, USER]
    );
    if (r.rows.length) return 'url';
  }
  const r2 = await db.query(
    `SELECT id FROM (
       SELECT id FROM job_applications WHERE company ILIKE $1 AND job_title ILIKE $2 AND user_profile=$3
       UNION ALL
       SELECT id FROM review_queue WHERE company ILIKE $1 AND job_title ILIKE $2 AND user_profile=$3
     ) t LIMIT 1`,
    [`%${company}%`, `%${titleKeyword}%`, USER]
  );
  if (r2.rows.length) return 'title';
  return null;
}

async function insertNI(r) {
  const res = await db.query(
    `INSERT INTO review_queue
     (job_title,company,source,location,salary,priority,status,date_added,
      job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,
      job_description,listing_inbox_id,user_profile)
     VALUES ($1,$2,$3,$4,$5,'B','Needs Info',$6,$7,$8,$9,$10,$11,$12,$13,null,$14,$15)
     RETURNING id`,
    [r.title,r.company,r.src,r.loc,r.sal,r.dt,r.url,r.gurl,
     JSON.stringify(r.rf||[]),JSON.stringify(r.mi),r.kw,r.notes,r.en,r.liid,USER]
  );
  return res.rows[0].id;
}

async function insertDismissed(r) {
  const res = await db.query(
    `INSERT INTO job_applications
     (job_title,company,source,location,salary,priority,cv_approach,status,date_added,
      job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,
      job_description,listing_inbox_id,user_profile)
     VALUES ($1,$2,$3,$4,$5,'C','Standard','Dismissed',$6,$7,$8,$9,'[]',$10,$11,$12,null,$13,$14)
     RETURNING id`,
    [r.title,r.company,r.src,r.loc,r.sal,r.dt,r.url,r.gurl,
     JSON.stringify(r.rf),r.kw,r.notes,r.en,r.liid,USER]
  );
  return res.rows[0].id;
}

async function markProcessed(ids) {
  await db.query(
    `UPDATE listing_inbox SET parse_status='processed' WHERE id=ANY($1) AND user_profile=$2`,
    [ids, USER]
  );
}

async function run() {
  await db.connect();

  let ni = 0, dismissed = 0, dups = 0;
  const newNI = [];
  const newDismissed = [];
  const processedIds = [];

  // ── NEEDS INFO ────────────────────────────────────────────────────────────

  // [987] DAF — KURIBAY, LinkedIn, Greater Grenoble, Jun 12
  {
    const d = await dedup('https://www.linkedin.com/jobs/view/4425305692/', 'KURIBAY', 'DAF');
    if (d) { dups++; processedIds.push(987); console.log('[987] DEDUP:' + d); }
    else {
      await insertNI({ title:'DAF', company:'KURIBAY', src:'LinkedIn',
        loc:'Greater Grenoble Metropolitan Area', sal:null, dt:'2026-06-12',
        url:'https://www.linkedin.com/jobs/view/4425305692/',
        gurl:'https://mail.google.com/mail/u/0/#all/19ebff77d140be27',
        rf:[], mi:['Salary','Hybrid policy','Scope'], kw:'Finance Business Partner', en:false, liid:987,
        notes:'QUEUED: DAF at KURIBAY — Greater Grenoble area, missing salary and hybrid details' });
      ni++; processedIds.push(987);
      newNI.push({ title:'DAF', company:'KURIBAY', mi:'Salary, Hybrid policy, Scope', gurl:'https://mail.google.com/mail/u/0/#all/19ebff77d140be27' });
      console.log('[987] NI: DAF @ KURIBAY');
    }
  }

  // [988] Chargé d'affaires mobilières — Inria, LinkedIn, Grenoble, Jun 15
  {
    const d = await dedup(null, 'Inria', 'affaires mobilières');
    if (d) { dups++; processedIds.push(988); console.log('[988] DEDUP:' + d); }
    else {
      await insertNI({ title:"Chargé d'affaires mobilières et patrimoniales H/F", company:'Inria', src:'LinkedIn',
        loc:'Grenoble', sal:null, dt:'2026-06-15', url:'Not available',
        gurl:'https://mail.google.com/mail/u/0/#all/19ed231a5c6b799a',
        rf:[], mi:['Salary','Scope'], kw:'Pilote Financier', en:false, liid:988,
        notes:"OPERATIONAL ROLE — review for fit; asset/property management at Inria (public research institute) — verify if finance governance scope" });
      ni++; processedIds.push(988);
      newNI.push({ title:"Chargé d'affaires mobilières", company:'Inria', mi:'Salary, Scope', gurl:'https://mail.google.com/mail/u/0/#all/19ed231a5c6b799a' });
      console.log('[988] NI: Chargé affaires mobilières @ Inria');
    }
  }

  // [989] RAF (F/H) — VINCI Energies France Industrie, LinkedIn, Saint-Jean-de-Moirans, Jun 16
  {
    const d = await dedup('https://www.linkedin.com/jobs/view/4426489863/', 'VINCI Energies', 'Responsable Administratif');
    if (d) { dups++; processedIds.push(989); console.log('[989] DEDUP:' + d); }
    else {
      await insertNI({ title:'Responsable Administratif et Financier (F/H)',
        company:'VINCI Energies France Industrie Centre Est Méditerranée', src:'LinkedIn',
        loc:'Saint-Jean-de-Moirans', sal:null, dt:'2026-06-16',
        url:'https://www.linkedin.com/jobs/view/4426489863/',
        gurl:'https://mail.google.com/mail/u/0/#all/19ed649380c041f6',
        rf:[], mi:['Salary','Hybrid policy'], kw:'Directeur Financier OR DAF', en:false, liid:989,
        notes:'QUEUED: RAF at VINCI Energies — Saint-Jean-de-Moirans (Green zone ~25 min), prestigious employer, missing salary' });
      ni++; processedIds.push(989);
      newNI.push({ title:'RAF (F/H)', company:'VINCI Energies France Industrie', mi:'Salary, Hybrid policy', gurl:'https://mail.google.com/mail/u/0/#all/19ed649380c041f6' });
      console.log('[989] NI: RAF @ VINCI Energies');
    }
  }

  // [990] Responsable comptabilité clients — Upward, LinkedIn, Greater Grenoble, Jun 16
  {
    const d = await dedup('https://www.linkedin.com/jobs/view/4426843992/', 'Upward', 'comptabilité clients');
    if (d) { dups++; processedIds.push(990); console.log('[990] DEDUP:' + d); }
    else {
      await insertNI({ title:'Responsable comptabilité clients', company:'Upward', src:'LinkedIn',
        loc:'Greater Grenoble Metropolitan Area', sal:null, dt:'2026-06-16',
        url:'https://www.linkedin.com/jobs/view/4426843992/',
        gurl:'https://mail.google.com/mail/u/0/#all/19ed4fec959ce5f6',
        rf:[], mi:['Salary','Hybrid policy','Scope'], kw:'Responsable Trésorerie OR Responsable P2P', en:false, liid:990,
        notes:'QUEUED: AR/customer accounting manager at Upward — Grenoble area, check company profile and if scope matches senior finance' });
      ni++; processedIds.push(990);
      newNI.push({ title:'Responsable comptabilité clients', company:'Upward', mi:'Salary, Hybrid policy, Scope', gurl:'https://mail.google.com/mail/u/0/#all/19ed4fec959ce5f6' });
      console.log('[990] NI: Resp compta clients @ Upward');
    }
  }

  // [991] Adjoint DAF H/F — JEAN LAIN MOBILITÉS, LinkedIn, Chambéry, Jun 16
  {
    const d = await dedup('https://www.linkedin.com/jobs/view/4428048887/', 'JEAN LAIN', 'Adjoint');
    if (d) { dups++; processedIds.push(991); console.log('[991] DEDUP:' + d); }
    else {
      await insertNI({ title:'Adjoint Directeur Administratif et Financier H/F',
        company:'JEAN LAIN MOBILITÉS', src:'LinkedIn',
        loc:'Chambéry', sal:null, dt:'2026-06-16',
        url:'https://www.linkedin.com/jobs/view/4428048887/',
        gurl:'https://mail.google.com/mail/u/0/#all/19ed7241c6f98a8a',
        rf:[], mi:['Salary','Hybrid policy'], kw:'LinkedIn JYMBII', en:false, liid:991,
        notes:'QUEUED: Deputy DAF at JEAN LAIN MOBILITÉS (auto dealer group) — Chambéry (Yellow ~45 min), missing salary' });
      ni++; processedIds.push(991);
      newNI.push({ title:'Adjoint DAF H/F', company:'JEAN LAIN MOBILITÉS', mi:'Salary, Hybrid policy', gurl:'https://mail.google.com/mail/u/0/#all/19ed7241c6f98a8a' });
      console.log('[991] NI: Adjoint DAF @ Jean Lain Mobilités');
    }
  }

  // [992] Financial Controller — INTERPOL, LinkedIn, Lyon, Jun 16
  {
    const d = await dedup('https://www.linkedin.com/jobs/view/4422759690/', 'INTERPOL', 'Financial Controller');
    if (d) { dups++; processedIds.push(992); console.log('[992] DEDUP:' + d); }
    else {
      await insertNI({ title:'Financial Controller', company:'INTERPOL', src:'LinkedIn',
        loc:'Lyon', sal:null, dt:'2026-06-16',
        url:'https://www.linkedin.com/jobs/view/4422759690/',
        gurl:'https://mail.google.com/mail/u/0/#all/19ed7241c6f98a8a',
        rf:['Far location'], mi:['Salary','Hybrid policy'], kw:'LinkedIn JYMBII', en:true, liid:992,
        notes:'QUEUED: Financial Controller at INTERPOL (Lyon, Orange zone) — highly international, English required; hybrid essential given distance' });
      ni++; processedIds.push(992);
      newNI.push({ title:'Financial Controller', company:'INTERPOL', mi:'Salary, Hybrid policy', gurl:'https://mail.google.com/mail/u/0/#all/19ed7241c6f98a8a' });
      console.log('[992] NI: Financial Controller @ INTERPOL');
    }
  }

  // [1016] CDG Industriel H/F — TALENTS FINANCE, Cadremploi, Voreppe, Jun 12
  // Same role repeated in IDs: 998, 1005, 1006, 1009, 1013, 1016
  {
    const d = await dedup(null, 'TALENTS FINANCE', 'Contrôleur de gestion industrielle');
    if (d) { dups++; console.log('[1016] DEDUP:' + d); }
    else {
      await insertNI({ title:'Contrôleur de gestion industrielle (H/F)', company:'TALENTS FINANCE', src:'Cadremploi',
        loc:'Voreppe', sal:null, dt:'2026-06-12', url:'Not available',
        gurl:'https://mail.google.com/mail/u/0/#all/19ec0488ae9d89f2',
        rf:[], mi:['Salary','Company name','Hybrid policy'], kw:'Contrôleur de Gestion', en:false, liid:1016,
        notes:'QUEUED: CDG Industriel via TALENTS FINANCE — Voreppe (Green zone), employer hidden, missing salary' });
      ni++;
      newNI.push({ title:'CDG Industriel H/F', company:'TALENTS FINANCE', mi:'Salary, Company name, Hybrid policy', gurl:'https://mail.google.com/mail/u/0/#all/19ec0488ae9d89f2' });
      console.log('[1016] NI: CDG Industriel @ TALENTS FINANCE (Voreppe)');
    }
    processedIds.push(998, 1005, 1006, 1009, 1013, 1016);
  }

  // [1017] RESPONSABLE SUPPLY CHAIN — CONNEX'IA, Cadremploi, Isère, Jun 12
  // Same role repeated in IDs: 1002, 1010, 1017
  {
    const d = await dedup(null, 'CONNEX', 'Supply Chain');
    if (d) { dups++; console.log('[1017] DEDUP:' + d); }
    else {
      await insertNI({ title:"RESPONSABLE SUPPLY CHAIN HF H/F", company:"CONNEX'IA", src:'Cadremploi',
        loc:'Isère', sal:null, dt:'2026-06-12', url:'Not available',
        gurl:'https://mail.google.com/mail/u/0/#all/19ebf6cab9d7da76',
        rf:[], mi:['Location','Salary'], kw:'Responsable Achats OR P2P', en:false, liid:1017,
        notes:"OPERATIONAL ROLE — review for fit; Supply Chain Manager at CONNEX'IA (Isère CDI) — verify finance/procurement governance scope" });
      ni++;
      newNI.push({ title:"Resp. Supply Chain", company:"CONNEX'IA", mi:'Location, Salary', gurl:'https://mail.google.com/mail/u/0/#all/19ebf6cab9d7da76' });
      console.log("[1017] NI: Resp Supply Chain @ CONNEX'IA");
    }
    processedIds.push(1002, 1010, 1017);
  }

  // [1011] Supply Chain Manager France & Suisse — PERSONAE RECRUTEMENT, Cadremploi, Montbonnot, Jun 13
  // Same role repeated in IDs: 999, 1003, 1011
  {
    const d = await dedup(null, 'PERSONAE', 'Supply Chain Manager');
    if (d) { dups++; console.log('[1011] DEDUP:' + d); }
    else {
      await insertNI({ title:'Supply Chain Manager France & Suisse (F/H)', company:'PERSONAE RECRUTEMENT', src:'Cadremploi',
        loc:'Montbonnot-Saint-Martin', sal:null, dt:'2026-06-13', url:'Not available',
        gurl:'https://mail.google.com/mail/u/0/#all/19ec69c7f4cd5a53',
        rf:[], mi:['Salary','Hybrid policy'], kw:'Directeur Financier OR DAF', en:false, liid:1011,
        notes:'OPERATIONAL ROLE — review for fit; Supply Chain Manager France & Suisse via PERSONAE RECRUTEMENT — Montbonnot (Green zone), France+Switzerland footprint suggests senior scope' });
      ni++;
      newNI.push({ title:'Supply Chain Manager F&S', company:'PERSONAE RECRUTEMENT', mi:'Salary, Hybrid policy', gurl:'https://mail.google.com/mail/u/0/#all/19ec69c7f4cd5a53' });
      console.log('[1011] NI: Supply Chain Manager @ PERSONAE');
    }
    processedIds.push(999, 1003, 1011);
  }

  // [1014] DAF Retail h/f — LHH, Cadremploi, Voiron, Jun 12
  // Same role in IDs: 1007, 1014
  {
    const d = await dedup(null, 'LHH', 'DAF Retail');
    if (d) { dups++; console.log('[1014] DEDUP:' + d); }
    else {
      await insertNI({ title:'DAF Retail (h/f)', company:'LHH', src:'Cadremploi',
        loc:'Voiron', sal:null, dt:'2026-06-12', url:'Not available',
        gurl:'https://mail.google.com/mail/u/0/#all/19ec163acb4b0eeb',
        rf:[], mi:['Salary','Company name','Hybrid policy'], kw:'Directeur Financier OR DAF', en:false, liid:1014,
        notes:'QUEUED: DAF Retail via LHH — Voiron (Yellow zone ~35 min), employer undisclosed, missing salary' });
      ni++;
      newNI.push({ title:'DAF Retail (h/f)', company:'LHH', mi:'Salary, Company name, Hybrid policy', gurl:'https://mail.google.com/mail/u/0/#all/19ec163acb4b0eeb' });
      console.log('[1014] NI: DAF Retail @ LHH (Voiron)');
    }
    processedIds.push(1007, 1014);
  }

  // [1020] CDG Industriel Senior H/F — RÉSEAU TALENTS, Direct, Satolas-et-Bonce, Jun 15
  {
    const d = await dedup(null, 'RÉSEAU TALENTS', 'Contrôleur de Gestion');
    if (d) { dups++; processedIds.push(1020); console.log('[1020] DEDUP:' + d); }
    else {
      await insertNI({ title:'Contrôleur de Gestion Industriel Senior H/F', company:'RÉSEAU TALENTS', src:'Direct',
        loc:'Satolas-et-Bonce', sal:null, dt:'2026-06-15', url:'Not available',
        gurl:'https://mail.google.com/mail/u/0/#all/19ed1346270570d9',
        rf:[], mi:['Salary','Hybrid policy'], kw:'Responsable Comptable', en:false, liid:1020,
        notes:'QUEUED: CDG Industriel Senior via RÉSEAU TALENTS — Satolas-et-Bonce (38, ~50 min), missing salary; hybrid essential given distance' });
      ni++; processedIds.push(1020);
      newNI.push({ title:'CDG Industriel Senior H/F', company:'RÉSEAU TALENTS', mi:'Salary, Hybrid policy', gurl:'https://mail.google.com/mail/u/0/#all/19ed1346270570d9' });
      console.log('[1020] NI: CDG Industriel Senior @ RÉSEAU TALENTS');
    }
  }

  // [1000] RAF H/F futur DAF — KURIBAY HR CONSULTING, Cadremploi, Isère, Jun 16
  // Likely same role as [987]; dedup on KURIBAY
  {
    const d = await dedup(null, 'KURIBAY', 'Responsable Administratif');
    if (d) { dups++; console.log('[1000] DEDUP:' + d + ' (same as KURIBAY DAF)'); }
    else {
      await insertNI({ title:'Responsable Administratif et Financier H/F futur/e DAF',
        company:'KURIBAY HR CONSULTING', src:'Cadremploi',
        loc:'Isère', sal:null, dt:'2026-06-16', url:'Not available',
        gurl:'https://mail.google.com/mail/u/0/#all/19ed5619c4ffb888',
        rf:[], mi:['Salary','Hybrid policy','Company name'], kw:'Directeur Financier OR DAF', en:false, liid:1000,
        notes:'QUEUED: RAF/futur DAF via KURIBAY HR CONSULTING — Isère CDI, missing salary and employer; likely same role as LinkedIn KURIBAY posting' });
      ni++;
      newNI.push({ title:'RAF H/F futur DAF', company:'KURIBAY HR CONSULTING', mi:'Salary, Hybrid policy, Company name', gurl:'https://mail.google.com/mail/u/0/#all/19ed5619c4ffb888' });
      console.log('[1000] NI: RAF futur DAF @ KURIBAY HR CONSULTING');
    }
    processedIds.push(1000);
  }

  // ── DISMISSED ─────────────────────────────────────────────────────────────

  // Nacimut - Responsable trésorerie groupe - Poitiers (from ID 1004)
  {
    const d = await dedup(null, 'Nacimut', 'trésorerie');
    if (d) { dups++; console.log('[1004a] DEDUP'); }
    else {
      await insertDismissed({ title:'Responsable trésorerie groupe (H/F)', company:'Nacimut', src:'Cadremploi',
        loc:'Poitiers', sal:null, dt:'2026-06-15', url:'Not available',
        gurl:'https://mail.google.com/mail/u/0/#all/19ecff792bf759a6',
        rf:['Far location'], kw:'RAF OR Contrôleur de Gestion', en:false, liid:1004,
        notes:'Auto-dismissed: Far location — Poitiers (>4h from Grenoble)' });
      dismissed++;
      newDismissed.push('Responsable trésorerie groupe @ Nacimut (Poitiers) — far location');
      console.log('[1004a] DISMISSED: Nacimut trésorerie Poitiers');
    }
  }

  // Robert Walters - Trésorier - Paris (from ID 1004)
  {
    const d = await dedup(null, 'ROBERT WALTERS', 'Trésorier');
    if (d) { dups++; console.log('[1004b] DEDUP'); }
    else {
      await insertDismissed({ title:'Trésorier H/F', company:'ROBERT WALTERS COMMERCE', src:'Cadremploi',
        loc:'Paris', sal:null, dt:'2026-06-15', url:'Not available',
        gurl:'https://mail.google.com/mail/u/0/#all/19ecff792bf759a6',
        rf:['Far location'], kw:'RAF OR Contrôleur de Gestion', en:false, liid:1004,
        notes:'Auto-dismissed: Paris on-site' });
      dismissed++;
      newDismissed.push('Trésorier H/F @ Robert Walters (Paris) — Paris on-site');
      console.log('[1004b] DISMISSED: Robert Walters Trésorier Paris');
    }
    processedIds.push(1004);
  }

  // Robert Half - Chef Comptable - Moirans - 48-52K (from ID 1024)
  {
    const d = await dedup(null, 'Robert Half', 'Chef Comptable');
    if (d) { dups++; console.log('[1024] DEDUP'); }
    else {
      await insertDismissed({ title:'Chef Comptable - Comptable Général Expérimenté H/F', company:'Robert Half', src:'Direct',
        loc:'Moirans', sal:'48000-52000', dt:'2026-06-12', url:'Not available',
        gurl:'https://mail.google.com/mail/u/0/#all/19ebf60799c0c7ee',
        rf:['Low salary'], kw:'Responsable Comptable', en:false, liid:1024,
        notes:'Auto-dismissed: salary below floor (48-52K brut vs €65K floor), accounting scope' });
      dismissed++;
      newDismissed.push('Chef Comptable @ Robert Half (Moirans) — low salary 48-52K');
      console.log('[1024] DISMISSED: Robert Half Chef Comptable Moirans');
    }
    processedIds.push(1024);
  }

  // ── MARK BATCH EMAILS WITH NO ACTIONABLE CONTENT PROCESSED ───────────────
  processedIds.push(1001, 1008, 1012, 1015, 1018, 1019, 1021, 1022, 1023);

  // Mark all processed
  const uniqueIds = [...new Set(processedIds)];
  await markProcessed(uniqueIds);
  console.log(`Marked ${uniqueIds.length} listing_inbox rows as processed`);

  // ── TARGET COMPANIES ──────────────────────────────────────────────────────
  const newCos = [
    { company: 'KURIBAY', location: 'Isère' },
    { company: 'Inria', location: 'Grenoble' },
    { company: 'Upward', location: 'Greater Grenoble' },
    { company: 'JEAN LAIN MOBILITÉS', location: 'Chambéry' },
    { company: 'INTERPOL', location: 'Lyon' },
  ];
  let newCoCount = 0;
  for (const co of newCos) {
    const r = await db.query(
      `INSERT INTO target_companies (company,tier,location,notes,user_profile)
       VALUES ($1,'C',$2,'Auto-added from daily scan Jun 19',$3)
       ON CONFLICT DO NOTHING RETURNING id`,
      [co.company, co.location, USER]
    );
    if (r.rowCount > 0) { newCoCount++; console.log('NEW_CO: ' + co.company); }
  }

  // ── SCAN ARCHIVE + DIGEST ─────────────────────────────────────────────────
  const niList = newNI.map(r => `  • ${r.title} @ ${r.company} — missing: ${r.mi}  (Gmail: ${r.gurl})`).join('\n');
  const dimList = newDismissed.map(d => `  • ${d}`).join('\n');

  const digestText = [
    `Job Scan Digest — ${TODAY}`,
    `════════════════════════════`,
    ``,
    `${ni + dismissed} new listings · ${ni} queued (Needs Info) · ${dismissed} dismissed`,
    `(+${dups} duplicates/repeats skipped)`,
    ``,
    `By Priority`,
    `  A → To Apply:      0`,
    `  B/C → To Assess:   0`,
    `  Needs Info:        ${ni}`,
    `  Dismissed:         ${dismissed}  top reason: Far location / Low salary`,
    ``,
    `Sources: LinkedIn 6 (IDs 987-992) · Cadremploi 20 batch emails · Direct 7 batch emails`,
    `Period covered: Jun 12–16 (backfill from trip absence)`,
    ``,
    `Needs Info Queue (added today)`,
    niList,
    ``,
    `Dismissed`,
    dimList,
    ``,
    `New companies → target list: ${newCoCount}  (run /job-search-target-companies C to check careers pages)`,
    `career-ops: 0 new roles`,
    `scan_archive: written ✅`,
  ].join('\n');

  await db.query(
    `INSERT INTO scan_archive
     (scan_date,digest_text,total_found,potentially_apply,needs_info,to_assess,dismissed,user_profile)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (scan_date,user_profile) DO UPDATE SET
       digest_text=EXCLUDED.digest_text,total_found=EXCLUDED.total_found,
       potentially_apply=EXCLUDED.potentially_apply,needs_info=EXCLUDED.needs_info,
       to_assess=EXCLUDED.to_assess,dismissed=EXCLUDED.dismissed`,
    [TODAY, digestText, ni+dismissed, 0, ni, 0, dismissed, USER]
  );

  console.log('\n=== FINAL COUNTS ===');
  console.log(`NI:${ni}  DISMISSED:${dismissed}  DUPS:${dups}  NEW_COS:${newCoCount}`);
  console.log('\n' + digestText);

  await db.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
