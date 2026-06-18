'use strict';
// Batch insert listing_inbox rows for Jun 13-17 backfill.
// Handles thread dedup, URL dedup, and multi-listing threads.

const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const fs = require('fs');

const cfg    = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const PG     = cfg.supabase_connection_string;
const USER   = cfg.user.profile_id;

const LISTINGS = [
  // ── PENDING (will be picked up by next /job-search-daily-scan) ───────────

  // Jun 13 — KURIBAY DAF — LinkedIn direct alert
  {
    gmail_thread_id:  '19ebff77d140be27',
    parse_date:       '2026-06-13',
    gmail_thread_url: 'https://mail.google.com/mail/u/0/#all/19ebff77d140be27',
    source: 'LinkedIn', alert_keyword: 'Finance Business Partner',
    job_title: 'DAF', company: 'KURIBAY',
    location: 'Greater Grenoble Metropolitan Area',
    salary: null, job_url: 'https://www.linkedin.com/jobs/view/4425305692/',
    contract_type: null, english: false,
    parse_status: 'pending', parse_notes: null,
    raw_snippet: 'DAF at KURIBAY — Greater Grenoble Metropolitan Area',
    raw_body:    'DAF at KURIBAY — Greater Grenoble Metropolitan Area | LinkedIn job alert: Finance Business Partner in Grenoble',
  },

  // Jun 16 — Inria Chargé d'affaires — LinkedIn Pilote Financier alert
  {
    gmail_thread_id:  '19ed231a5c6b799a',
    parse_date:       '2026-06-16',
    gmail_thread_url: 'https://mail.google.com/mail/u/0/#all/19ed231a5c6b799a',
    source: 'LinkedIn', alert_keyword: 'Pilote Financier',
    job_title: "Chargé d'affaires mobilières et patrimoniales H/F",
    company: 'Inria', location: 'Grenoble',
    salary: null, job_url: 'Not available',
    contract_type: null, english: false,
    parse_status: 'pending',
    parse_notes: 'Public research institute — salary not stated — DAFP role',
    raw_snippet: "Chargé d'affaires mobilières et patrimoniales H/F — Inria — Grenoble",
    raw_body:    "Inria — Chargé d'affaires mobilières et patrimoniales H/F — Grenoble | Pilote Financier LinkedIn alert Jun 16",
  },

  // Jun 17 — VINCI Energies RAF — LinkedIn direct alert (1 new job)
  {
    gmail_thread_id:  '19ed649380c041f6',
    parse_date:       '2026-06-17',
    gmail_thread_url: 'https://mail.google.com/mail/u/0/#all/19ed649380c041f6',
    source: 'LinkedIn', alert_keyword: 'Directeur Financier OR DAF',
    job_title: 'Responsable Administratif et Financier (F/H)',
    company: 'VINCI Energies France Industrie Centre Est Méditerranée',
    location: 'Saint-Jean-de-Moirans',
    salary: null, job_url: 'https://www.linkedin.com/jobs/view/4426489863/',
    contract_type: null, english: false,
    parse_status: 'pending', parse_notes: null,
    raw_snippet: 'Responsable Administratif et Financier (F/H) — VINCI Energies — Saint-Jean-de-Moirans',
    raw_body:    'VINCI Energies France Industrie Centre Est Méditerranée — RAF (F/H) — Saint-Jean-de-Moirans | LinkedIn alert: Directeur Financier OR DAF',
  },

  // Jun 17 — Upward Responsable comptabilité clients — LinkedIn direct alert
  {
    gmail_thread_id:  '19ed4fec959ce5f6',
    parse_date:       '2026-06-17',
    gmail_thread_url: 'https://mail.google.com/mail/u/0/#all/19ed4fec959ce5f6',
    source: 'LinkedIn', alert_keyword: 'Responsable Trésorerie OR Responsable P2P',
    job_title: 'Responsable comptabilité clients',
    company: 'Upward', location: 'Greater Grenoble Metropolitan Area',
    salary: null, job_url: 'https://www.linkedin.com/jobs/view/4426843992/',
    contract_type: null, english: false,
    parse_status: 'pending', parse_notes: null,
    raw_snippet: 'Responsable comptabilité clients at Upward — Greater Grenoble Metropolitan Area',
    raw_body:    'Responsable comptabilité clients at Upward — Greater Grenoble Metropolitan Area | LinkedIn alert: Responsable Trésorerie OR Responsable P2P',
  },

  // Jun 17 — JEAN LAIN MOBILITÉS JYMBII digest (3 listings, same thread)
  {
    gmail_thread_id:  '19ed7241c6f98a8a',
    parse_date:       '2026-06-17',
    gmail_thread_url: 'https://mail.google.com/mail/u/0/#all/19ed7241c6f98a8a',
    source: 'LinkedIn', alert_keyword: 'LinkedIn JYMBII',
    job_title: 'Adjoint Directeur Administratif et Financier H/F',
    company: 'JEAN LAIN MOBILITÉS', location: 'Chambéry',
    salary: null, job_url: 'https://www.linkedin.com/jobs/view/4428048887/',
    contract_type: null, english: false,
    parse_status: 'pending', parse_notes: 'Multi-listing JYMBII digest',
    raw_snippet: 'Adjoint Directeur Administratif et Financier H/F — JEAN LAIN MOBILITÉS — Chambéry',
    raw_body:    'JEAN LAIN MOBILITÉS is hiring a Adjoint Directeur Administratif et Financier H/F | LinkedIn JYMBII digest Jun 17',
  },
  {
    gmail_thread_id:  '19ed7241c6f98a8a',
    parse_date:       '2026-06-17',
    gmail_thread_url: 'https://mail.google.com/mail/u/0/#all/19ed7241c6f98a8a',
    source: 'LinkedIn', alert_keyword: 'LinkedIn JYMBII',
    job_title: 'Responsable de la gestion administrative et financière (H/F)',
    company: 'CNRS', location: 'Greater Grenoble Metropolitan Area',
    salary: null, job_url: 'https://www.linkedin.com/jobs/view/4416881585/',
    contract_type: null, english: false,
    parse_status: 'pending', parse_notes: 'Multi-listing JYMBII digest — public research institution',
    raw_snippet: 'Responsable de la gestion administrative et financière (H/F) — CNRS — Greater Grenoble',
    raw_body:    'CNRS — Responsable gestion administrative et financière | LinkedIn JYMBII digest Jun 17',
  },
  {
    gmail_thread_id:  '19ed7241c6f98a8a',
    parse_date:       '2026-06-17',
    gmail_thread_url: 'https://mail.google.com/mail/u/0/#all/19ed7241c6f98a8a',
    source: 'LinkedIn', alert_keyword: 'LinkedIn JYMBII',
    job_title: 'Financial Controller',
    company: 'INTERPOL', location: 'Lyon',
    salary: null, job_url: 'https://www.linkedin.com/jobs/view/4422759690/',
    contract_type: null, english: true,
    parse_status: 'pending', parse_notes: 'Multi-listing JYMBII digest — Lyon (orange zone)',
    raw_snippet: 'Financial Controller — INTERPOL — Lyon',
    raw_body:    'INTERPOL — Financial Controller — Lyon | LinkedIn JYMBII digest Jun 17',
  },

  // ── PROCESSED (all dismissed during parse — no daily scan needed) ─────────

  // Jun 13 — Indeed "finance director" Grenoble multi-listing (all 8 dismissed)
  {
    gmail_thread_id:  '19ec2207b2ed65b5',
    parse_date:       '2026-06-13',
    gmail_thread_url: 'https://mail.google.com/mail/u/0/#all/19ec2207b2ed65b5',
    source: 'Indeed', alert_keyword: 'finance director',
    job_title: '[Multi-listing — all dismissed]', company: 'Various',
    location: 'Grenoble (38)', salary: null, job_url: 'Not available',
    contract_type: null, english: false,
    parse_status: 'processed',
    parse_notes: 'All 8 listings dismissed: DGA Ressources public sector, Banque Populaire surveillance, Directeur opérations ARaymond, UGA gestionnaire €1,867/mo, CER Sauvegarde Isère, EVADE périscolaire, Halte Garderie crèche, MrNettoyage cleaning',
    raw_snippet: 'Finance director Grenoble (38) — Indeed multi-listing digest Jun 13',
    raw_body:    'Indeed alert finance director Grenoble (38) Jun 13 — 8 listings all dismissed',
  },

  // Jun 14 — Indeed "finance director" — TRIALP + 8 (all 8 dismissed)
  {
    gmail_thread_id:  '19ec7991a8b04858',
    parse_date:       '2026-06-14',
    gmail_thread_url: 'https://mail.google.com/mail/u/0/#all/19ec7991a8b04858',
    source: 'Indeed', alert_keyword: 'finance director',
    job_title: 'Responsable Administratif et Financier H/F',
    company: 'TRIALP', location: 'Chambéry (73)',
    salary: '45000-55000', job_url: 'Not available',
    contract_type: null, english: false,
    parse_status: 'processed',
    parse_notes: 'All 8 listings dismissed: TRIALP RAF €45-55K below apply floor; Banque Populaire surveillance, ARaymond Directeur opérations, UGA gestionnaire €1,867/mo, UGA adjoint €1,801/mo, EVADE périscolaire, Halte Garderie crèche CDD — all wrong function or below floor',
    raw_snippet: 'TRIALP RAF Chambéry + 8 offres "finance director" Grenoble (38) Jun 14',
    raw_body:    'Indeed job alert: 8 emplois finance director Grenoble (38) Jun 14 — all 8 dismissed',
  },

  // Jun 17 — Indeed "Pilote Financier" — ZADIENT/Framatome/EOLYA/Laser Game (all dismissed)
  {
    gmail_thread_id:  '19ed74f1ffabaa3b',
    parse_date:       '2026-06-17',
    gmail_thread_url: 'https://mail.google.com/mail/u/0/#all/19ed74f1ffabaa3b',
    source: 'Indeed', alert_keyword: 'Pilote Financier',
    job_title: 'Comptable H/F', company: 'ZADIENT Technologies SAS',
    location: 'Sainte-Hélène-du-Lac (73)', salary: '30000-40000',
    job_url: 'Not available', contract_type: null, english: false,
    parse_status: 'processed',
    parse_notes: 'All listings dismissed: ZADIENT Comptable €30-40K below floor, Framatome Manager production OPERATIONAL, EOLYA CVC OPERATIONAL, Laser Game Manager €31-38K below floor',
    raw_snippet: 'Pilote Financier digest — ZADIENT, Framatome, EOLYA, Laser Game — all dismissed',
    raw_body:    'Indeed alert Pilote Financier Jun 17 — ZADIENT Comptable €30-40K, Framatome production, EOLYA CVC, Laser Game all dismissed',
  },

  // Jun 17 — Indeed "CDG" — TRIALP/Pays Voironnais/MasterGrid/MBway (all dismissed)
  {
    gmail_thread_id:  '19ed7b0c15a31a9d',
    parse_date:       '2026-06-17',
    gmail_thread_url: 'https://mail.google.com/mail/u/0/#all/19ed7b0c15a31a9d',
    source: 'Indeed', alert_keyword: 'Contrôleur de Gestion',
    job_title: 'Responsable Administratif et Financier H/F',
    company: 'TRIALP', location: 'Chambéry (73)',
    salary: '45000-55000', job_url: 'Not available',
    contract_type: null, english: false,
    parse_status: 'processed',
    parse_notes: 'All listings dismissed: TRIALP RAF €45-55K below apply floor, Pays Voironnais CDG €688/mo public sector, MasterGrid alternance, MBway alternance',
    raw_snippet: 'TRIALP RAF + Pays Voironnais CDG + MasterGrid alternance + MBway — all dismissed',
    raw_body:    'Indeed alert CDG Grenoble Jun 17 — TRIALP, Pays Voironnais, MasterGrid, MBway — all dismissed',
  },

  // Jun 17 — Indeed single TRIALP RAF (dismissed)
  {
    gmail_thread_id:  '19ece1ea20768512',
    parse_date:       '2026-06-17',
    gmail_thread_url: 'https://mail.google.com/mail/u/0/#all/19ece1ea20768512',
    source: 'Indeed', alert_keyword: 'Contrôleur de Gestion',
    job_title: 'Responsable Administratif et Financier H/F',
    company: 'TRIALP', location: 'Chambéry (73)',
    salary: '45000-55000', job_url: 'Not available',
    contract_type: null, english: false,
    parse_status: 'processed',
    parse_notes: 'TRIALP RAF €45-55K — below apply floor of €65K',
    raw_snippet: 'TRIALP RAF Chambéry €45-55K — below apply floor',
    raw_body:    'Indeed alert Jun 17 — TRIALP Chambéry €45-55K below floor — dismissed',
  },
];

async function run() {
  const db = new Client({ connectionString: PG });
  await db.connect();

  let inserted = 0, threadDup = 0, urlDup = 0, errors = 0;

  // Group by (thread_id, parse_date) for correct dedup per thread
  const byThread = new Map();
  for (const l of LISTINGS) {
    const key = `${l.gmail_thread_id}|${l.parse_date}`;
    if (!byThread.has(key)) byThread.set(key, []);
    byThread.get(key).push(l);
  }

  for (const [key, rows] of byThread.entries()) {
    const [threadId, parseDate] = key.split('|');

    // Thread dedup: skip if this thread already recorded for this parse_date
    const { rows: dup } = await db.query(
      `SELECT id FROM listing_inbox WHERE gmail_thread_id=$1 AND parse_date=$2 AND user_profile=$3 LIMIT 1`,
      [threadId, parseDate, USER]
    );
    if (dup.length > 0) {
      console.log(`  THREAD DUP (li=${dup[0].id}): ${threadId.substring(0, 12)}… ${parseDate}`);
      threadDup += rows.length;
      continue;
    }

    for (const l of rows) {
      // URL dedup for pending rows with a real URL
      if (l.parse_status === 'pending' && l.job_url && l.job_url !== 'Not available') {
        const { rows: udup } = await db.query(
          `SELECT id FROM (
             SELECT id FROM listing_inbox WHERE job_url=$1 AND parse_date >= CURRENT_DATE - 7 AND user_profile=$2
             UNION ALL
             SELECT id FROM job_applications WHERE job_url=$1 AND user_profile=$2
           ) t LIMIT 1`,
          [l.job_url, USER]
        );
        if (udup.length > 0) {
          console.log(`  URL DUP (id=${udup[0].id}): ${l.company} — ${l.job_title}`);
          urlDup++;
          continue;
        }
      }

      try {
        const { rows: ins } = await db.query(
          `INSERT INTO listing_inbox
           (parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
            job_title, company, location, salary, job_url, contract_type,
            parse_status, parse_notes, english, raw_snippet, raw_body, user_profile)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
           RETURNING id`,
          [
            l.parse_date, l.gmail_thread_id, l.gmail_thread_url, l.source, l.alert_keyword,
            l.job_title, l.company, l.location, l.salary, l.job_url, l.contract_type,
            l.parse_status, l.parse_notes, l.english, l.raw_snippet, l.raw_body, USER,
          ]
        );
        console.log(`  ✓ [li=${ins[0].id}] ${l.parse_status}: ${l.company} — ${l.job_title}`);
        inserted++;
      } catch (e) {
        console.error(`  ✗ ERROR ${l.company} — ${l.job_title}: ${e.message}`);
        errors++;
      }
    }
  }

  console.log(`\nDone: ${inserted} inserted, ${threadDup} thread-dups, ${urlDup} url-dups, ${errors} errors`);
  await db.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
