'use strict';
// Batch insert HTML-only sources (Cadremploi, HelloWork, APEC) for Jun 13-17 backfill.
// Cadremploi + HelloWork → puppeteer_pending  |  APEC → manual_check

const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const fs = require('fs');

const cfg  = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const PG   = cfg.supabase_connection_string;
const USER = cfg.user.profile_id;

// ── CADREMPLOI (20 threads, puppeteer_pending) ────────────────────────────────
const CADREMPLOI = [
  // Jun 17
  { id: '19ed6672b59645a6', date: '2026-06-17', keyword: 'Contrôleur de Gestion', subject: '1 offres accessibles en deux clics', snippet: 'Contrôleur de Gestion OR Responsable Contrôle de Gestion OR Contrôleur de Gestion Industriel OR Finance Business Partner' },
  { id: '19ed5f8b7b9d38fe', date: '2026-06-17', keyword: 'Directeur Financier OR DAF', subject: 'Votre profil intéresse ces entreprises !', snippet: 'Directeur Financier OR DAF OR Finance Director OR Head of Finance — Responsable Supply Chain Isère CDI' },
  { id: '19ed5619c4ffb888', date: '2026-06-17', keyword: 'Directeur Financier OR DAF', subject: '1 nouvelle offre a été publiée ce matin', snippet: 'Directeur Financier OR DAF OR Finance Director — Responsable Administratif et Financier OR RAF' },
  { id: '19ed51f133817042', date: '2026-06-17', keyword: 'Financial Controller OR Finance Manager', subject: 'Et si vous modifiez vos critères de recherche ?', snippet: 'Financial Controller OR Finance Manager OR Accounting — 3 offres trouvées avec critères modifiés' },
  { id: '19ed4aafae8a45e4', date: '2026-06-17', keyword: 'Contrôleur de Gestion', subject: '1 offre à ne rater sous aucun prétexte', snippet: 'Contrôleur de Gestion OR Finance Business Partner — Responsable Achats OR Responsable Supply Chain' },
  // Jun 16
  { id: '19ed0d23e8921aad', date: '2026-06-16', keyword: 'Directeur Financier OR DAF', subject: 'Votre profil intéresse ces entreprises !', snippet: 'Directeur Financier OR DAF OR Finance Director OR Head of Finance — Responsable Supply Chain' },
  { id: '19ecff792bf759a6', date: '2026-06-16', keyword: 'RAF OR Contrôleur de Gestion', subject: 'Et si vous modifiez vos critères de recherche ?', snippet: 'Credit Manager OR Responsable Recouvrement OR RAF OR Contrôleur de Gestion OR Pilote Financier — 3 offres trouvées' },
  { id: '19ecf72798219c15', date: '2026-06-16', keyword: 'Contrôleur de Gestion', subject: '1 offre à ne rater sous aucun prétexte', snippet: 'Contrôleur de Gestion OR Responsable Contrôle de Gestion OR Contrôleur de Gestion Industriel OR Finance Business Partner' },
  // Jun 15
  { id: '19ecc19985f0cb70', date: '2026-06-15', keyword: 'Contrôleur de Gestion', subject: '1 offres accessibles en deux clics', snippet: 'Contrôleur de Gestion OR Responsable Contrôle de Gestion OR Contrôleur de Gestion Industriel OR Finance Business Partner' },
  { id: '19ecbb105db08aa9', date: '2026-06-15', keyword: 'Directeur Financier OR DAF', subject: 'Votre profil intéresse ces entreprises !', snippet: 'Directeur Financier OR DAF OR Finance Director OR Head of Finance — Responsable Supply Chain' },
  { id: '19ecad19f6118410', date: '2026-06-15', keyword: 'Financial Controller OR Finance Manager', subject: 'Et si vous modifiez vos critères de recherche ?', snippet: 'Financial Controller OR Finance Manager OR Accounting — 3 offres trouvées avec critères modifiés' },
  { id: '19eca7081d51f597', date: '2026-06-15', keyword: 'Contrôleur de Gestion', subject: '1 offre à ne rater sous aucun prétexte', snippet: 'Contrôleur de Gestion OR Responsable Contrôle de Gestion OR Contrôleur de Gestion Industriel OR Finance Business Partner' },
  { id: '19ec9797810c74c0', date: '2026-06-15', keyword: 'Responsable Achats OR P2P', subject: 'Une nouvelle offre a été publiée la semaine dernière', snippet: 'Responsable Achats OR Acheteur Senior OR Responsable Procure-to-Pay OR Responsable Supply Chain OR Auditeur Interne' },
  // Jun 14
  { id: '19ec69c7f4cd5a53', date: '2026-06-14', keyword: 'Directeur Financier OR DAF', subject: 'Votre profil intéresse ces entreprises !', snippet: 'Directeur Financier OR DAF OR Finance Director OR Head of Finance — Responsable Supply Chain' },
  { id: '19ec5acbda180b27', date: '2026-06-14', keyword: 'RAF OR Contrôleur de Gestion', subject: 'Et si vous modifiez vos critères de recherche ?', snippet: 'Responsable Administratif Financier OR RAF OR Credit Manager OR Contrôleur de Gestion OR Pilote Financier — 3 offres' },
  { id: '19ec58a589e74c03', date: '2026-06-14', keyword: 'Contrôleur de Gestion', subject: '1 offre à ne rater sous aucun prétexte', snippet: 'Contrôleur de Gestion OR Responsable Contrôle de Gestion OR Contrôleur de Gestion Industriel OR Finance Business Partner' },
  // Jun 13
  { id: '19ec163acb4b0eeb', date: '2026-06-13', keyword: 'Directeur Financier OR DAF', subject: 'Votre profil intéresse ces entreprises !', snippet: 'Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable' },
  { id: '19ec08c54e45b862', date: '2026-06-13', keyword: 'Financial Controller OR Finance Manager', subject: 'Et si vous modifiez vos critères de recherche ?', snippet: 'Financial Controller OR Finance Manager OR Accounting — 3 offres trouvées avec critères modifiés' },
  { id: '19ec0488ae9d89f2', date: '2026-06-13', keyword: 'Contrôleur de Gestion', subject: '1 offre à ne rater sous aucun prétexte', snippet: 'Contrôleur de Gestion OR Responsable Contrôle de Gestion OR Contrôleur de Gestion Industriel OR Finance Business Partner' },
  { id: '19ebf6cab9d7da76', date: '2026-06-13', keyword: 'Responsable Achats OR P2P', subject: 'Une nouvelle offre a été publiée hier', snippet: 'Responsable Achats OR Acheteur Senior OR Responsable Procure-to-Pay OR Responsable Supply Chain OR Auditeur Interne' },
];

// ── HELLOWORK (7 job alert threads — newsletter thread 19ecb78096d47057 skipped) ──
// sender: notification@emails.hellowork.com (HTML-only — add to config html_only_sources)
const HELLOWORK = [
  { id: '19ed5b0ac407cadb', date: '2026-06-17', keyword: 'Expert Comptable',         subject: 'Zachary, Achil recrute un Expert Comptable Mémorialiste H/F',           snippet: '1 nouvelle offre correspond à votre profil. Expert Comptable Mémorialiste H/F' },
  { id: '19ed436fd55ad755', date: '2026-06-17', keyword: 'Responsable Comptable',     subject: 'Zachary, Menway Emploi recrute un Responsable Comptable H/F',            snippet: '4 nouvelles offres correspondent à votre profil. Responsable Comptable H/F' },
  { id: '19ed1346270570d9', date: '2026-06-16', keyword: 'Responsable Comptable',     subject: 'Zachary, Geco Recrutement recrute un Responsable Comptable H/F',         snippet: '4 nouvelles offres correspondent à votre profil. Responsable Comptable H/F' },
  { id: '19ecf2c0b65feed3', date: '2026-06-16', keyword: 'Comptable Général CDI',     subject: 'Zachary, Lynx RH recrute un Comptable Général en CDI H/F',              snippet: '3 nouvelles offres correspondent à votre profil. Comptable Général en CDI H/F' },
  { id: '19ecb502ce7100b6', date: '2026-06-15', keyword: 'Consultant ERP',            subject: 'Zachary, Everwin recrute un Consultant Fonctionnel ERP H/F',             snippet: '1 nouvelle offre correspond à votre profil. Consultant Fonctionnel ERP H/F' },
  { id: '19ec9e90740b6f5e', date: '2026-06-15', keyword: 'Comptable',                 subject: 'Zachary, Slash Intérim recrute un Comptable H/F',                        snippet: '1 nouvelle offre correspond à votre profil. Comptable H/F Slash Intérim' },
  { id: '19ebf60799c0c7ee', date: '2026-06-13', keyword: 'Responsable Comptable',     subject: 'Zachary, Initial recrute un Responsable Comptable Multi Societe H/F',    snippet: '7 nouvelles offres correspondent à votre profil. Responsable Comptable Multi Societe H/F' },
];

// ── APEC (4 threads, manual_check — no Jun 14 alert received) ────────────────
const APEC = [
  { id: '19ebfee127289c0b', date: '2026-06-13', subject: '22 offres Apec du 13/06/2026', snippet: '5 offres correspondent à votre recherche', count: '22 offres (5 matchs)' },
  { id: '19ec993d5dcad18e', date: '2026-06-15', subject: '3 offres Apec du 15/06/2026',  snippet: '1 offre correspond à votre recherche',    count: '3 offres (1 match)'  },
  { id: '19ecf49f3ebea5b0', date: '2026-06-16', subject: '13 offres Apec du 16/06/2026', snippet: '3 offres correspondent à votre recherche', count: '13 offres (3 matchs)' },
  { id: '19ed4505b5dae25d', date: '2026-06-17', subject: '9 offres Apec du 17/06/2026',  snippet: '3 offres correspondent à votre recherche', count: '9 offres (3 matchs)'  },
];

async function insertThread(db, id, date, source, keyword, subject, snippet, status, notes) {
  const dup = await db.query(
    `SELECT id FROM listing_inbox WHERE gmail_thread_id=$1 AND parse_date=$2 AND user_profile=$3 LIMIT 1`,
    [id, date, USER]
  );
  if (dup.rows.length > 0) {
    console.log(`  DUP (li=${dup.rows[0].id}): ${id.substring(0,12)}… ${date}`);
    return 'dup';
  }
  const threadUrl  = `https://mail.google.com/mail/u/0/#all/${id}`;
  const rawBody    = `${subject} | ${snippet}`.substring(0, 500);
  const rawSnippet = snippet.substring(0, 200);
  const { rows } = await db.query(
    `INSERT INTO listing_inbox
     (parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
      job_title, company, location, salary, job_url, contract_type,
      parse_status, parse_notes, english, raw_snippet, raw_body, user_profile)
     VALUES ($1,$2,$3,$4,$5,NULL,NULL,NULL,NULL,NULL,NULL,$6,$7,false,$8,$9,$10)
     RETURNING id`,
    [date, id, threadUrl, source, keyword, status, notes, rawSnippet, rawBody, USER]
  );
  console.log(`  ✓ [li=${rows[0].id}] ${status}: ${source} ${date} "${subject.substring(0,50)}"`);
  return 'inserted';
}

async function run() {
  const db = new Client({ connectionString: PG });
  await db.connect();
  let inserted = 0, duped = 0;

  for (const t of CADREMPLOI) {
    const r = await insertThread(db, t.id, t.date, 'Cadremploi', t.keyword, t.subject, t.snippet,
      'puppeteer_pending', 'Known HTML-only source — queued for Puppeteer extraction');
    r === 'inserted' ? inserted++ : duped++;
  }

  for (const t of HELLOWORK) {
    const r = await insertThread(db, t.id, t.date, 'Direct', t.keyword, t.subject, t.snippet,
      'puppeteer_pending', 'HelloWork HTML-only (notification@emails.hellowork.com) — queued for Puppeteer. Add sender to html_only_sources in config.');
    r === 'inserted' ? inserted++ : duped++;
  }

  for (const t of APEC) {
    const r = await insertThread(db, t.id, t.date, 'APEC', t.count, t.subject, t.snippet,
      'manual_check', `APEC: ${t.count} — HTML-only — check apec.fr manually`);
    r === 'inserted' ? inserted++ : duped++;
  }

  console.log(`\nTotal: ${inserted} inserted, ${duped} thread-dups`);
  await db.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
