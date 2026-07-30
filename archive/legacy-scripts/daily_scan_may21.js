'use strict';
process.on('unhandledRejection', e => { console.error(e.message); process.exit(1); });

const {Client} = require(process.env.PG_MODULE);

// ── Routing tables (all 86 pending + 30 manual_check rows) ───────────────────

const DISMISS_MAP = {
  609: {flags:['Low salary'], note:'Auto-dismissed: ~30K/yr well below €40K floor'},
  610: {flags:['Low salary'], note:'Auto-dismissed: ~30K/yr well below €40K floor'},
  611: {flags:['Off-topic'], note:'Auto-dismissed: restaurant/food distribution operational director'},
  612: {flags:['Off-topic'], note:'Auto-dismissed: IT systems director'},
  613: {flags:['Off-topic'], note:'Auto-dismissed: catering director'},
  614: {flags:['Off-topic'], note:'Auto-dismissed: childcare director'},
  615: {flags:['Off-topic'], note:'Auto-dismissed: medical staffing agency director'},
  616: {flags:['Off-topic'], note:'Auto-dismissed: medical staffing agency director'},
  617: {flags:['Off-topic','Low salary'], note:'Auto-dismissed: leisure center adjoint director, 1766€/mois'},
  618: {flags:['Off-topic'], note:'Auto-dismissed: medical staffing agency director'},
  619: {flags:['Off-topic','Low salary'], note:'Auto-dismissed: restaurant adjoint director, 2500-2700€/mois'},
  624: {flags:['Far location'], note:'Auto-dismissed: Rillieux-la-Pape (Lyon area, Red zone)'},
  625: {flags:['Far location'], note:'Auto-dismissed: Sarras (Ardèche, >80km, out of zone)'},
  627: {flags:['Far location'], note:'Auto-dismissed: Lyon (Red zone)'},
  628: {flags:['Far location'], note:'Auto-dismissed: Lyon (Red zone)'},
  629: {flags:['Far location'], note:'Auto-dismissed: Villefranche-sur-Saône (Lyon area, Red zone)'},
  630: {flags:['Far location'], note:'Auto-dismissed: Lyon (Red zone)'},
  631: {flags:['Far location'], note:'Auto-dismissed: Montluel (dept 01, ~90km, out of zone)'},
  632: {flags:['Far location'], note:'Auto-dismissed: Carcassonne (south France, >300km)'},
  634: {flags:['Far location'], note:'Auto-dismissed: Lyon (Red zone)'},
  635: {flags:['Far location'], note:'Auto-dismissed: Lyon (Red zone)'},
  638: {flags:['Far location'], note:'Auto-dismissed: Toulouse (>200km)'},
  646: {flags:['Low salary'], note:'Auto-dismissed: ~30K/yr below €40K floor (duplicate of id 610)'},
  648: {flags:['Far location'], note:'Auto-dismissed: Greater Lyon Area (Red zone)'},
  649: {flags:['Far location'], note:'Auto-dismissed: Lyon (Red zone)'},
  650: {flags:['Far location'], note:'Auto-dismissed: Salon-de-Provence (south France)'},
  651: {flags:['Far location'], note:'Auto-dismissed: Nice (>200km)'},
  652: {flags:['Far location'], note:'Auto-dismissed: Rennes (Brittany, >600km)'},
  653: {flags:['Far location'], note:'Auto-dismissed: Levallois-Perret (Paris area, Red zone)'},
  654: {flags:['Off-topic'], note:'Auto-dismissed: restaurant/food distribution director (dup of 611)'},
  656: {flags:['Off-topic','Low salary'], note:'Auto-dismissed: university adjoint director (non-finance), 1944€/mois'},
  657: {flags:['Off-topic'], note:'Auto-dismissed: retail store director'},
  658: {flags:['Off-topic'], note:'Auto-dismissed: leisure/childcare director (public sector)'},
  659: {flags:['Off-topic'], note:'Auto-dismissed: staffing agency director'},
  660: {flags:['Off-topic'], note:'Auto-dismissed: medical staffing agency director'},
  661: {flags:['Off-topic','Low salary'], note:'Auto-dismissed: childcare director, 2500€/mois'},
  662: {flags:['Off-topic','Low salary'], note:'Auto-dismissed: early childhood director, 1100€/mois'},
  663: {flags:['Off-topic'], note:'Auto-dismissed: medical staffing agency director'},
  664: {flags:['Off-topic'], note:'Auto-dismissed: medical staffing agency director'},
  665: {flags:['Off-topic','Low salary'], note:'Auto-dismissed: school leisure director, 1800€/mois'},
  666: {flags:['Off-topic','Low salary'], note:'Auto-dismissed: leisure center adjoint, 1766€/mois'},
  667: {flags:['Off-topic','Low salary'], note:'Auto-dismissed: restaurant adjoint director, 2500-2700€/mois'},
  678: {flags:['Off-topic'], note:'Auto-dismissed: IT project manager'},
  688: {flags:['Far location'], note:'Auto-dismissed: Lyon (Red zone)'},
  689: {flags:['Off-topic','Low salary'], note:'Auto-dismissed: IT/methods project manager, 38K/yr'},
  690: {flags:['Off-topic','Low salary'], note:'Auto-dismissed: public sector operational director, 31.8-38.4K/yr'},
  692: {flags:['Off-topic'], note:'Auto-dismissed: retail store adjoint director'},
  693: {flags:['Off-topic'], note:'Auto-dismissed: automotive dealership director'},
  694: {flags:['Off-topic'], note:'Auto-dismissed: retail store director'},
  711: {flags:['Junior scope'], note:'Auto-dismissed: alternant (apprentice/work-study) position'},
};

// Needs Info → review_queue / Needs Info / priority B
const NEEDS_INFO_MAP = {
  626: {missing:['Salary','Hybrid policy'], note:'QUEUED: CDG in Orange zone (Albertville) — confirm salary and hybrid before applying'},
  633: {missing:['Salary','Location','Hybrid policy'], note:'QUEUED: Responsable Comptable at ORISHA — no location or salary'},
  636: {missing:['Salary'], note:'QUEUED: CDG at Grenoble INP-UGA (Grenoble) — confirm salary (public sector risk)'},
  637: {missing:['Salary'], note:'QUEUED: CDG at Korus Group, La Murette (dept 38) — confirm salary'},
  645: {missing:['Salary','Location','Hybrid policy'], note:'QUEUED: Responsable Financier at Everywhere App (startup) — confirm salary and remote policy'},
  668: {missing:['Salary','Company name'], note:'QUEUED: DAF via RC Human Recruitment, Échirolles — confirm underlying company and salary'},
  669: {missing:['Salary','Location','Hybrid policy'], note:'QUEUED: Responsable Comptable Interne at In Extenso — confirm location and salary'},
  671: {missing:['Salary','Scope'], note:'QUEUED: Expert-comptable/Responsable de bureau, Saint-Marcellin (Yellow) — confirm scope and salary'},
  681: {missing:['Salary'], note:'QUEUED: RAF at Grenoble INP-UGA, Grenoble — confirm salary (public sector risk)'},
  682: {missing:['Salary','Location','Hybrid policy'], note:'QUEUED: CDG at PROLIANS — no location or salary'},
  684: {missing:['Salary'], note:'QUEUED: Financial Analyst at BD, Le Pont-de-Claix (Green zone, English) — confirm salary'},
  685: {missing:['Salary'], note:'QUEUED: CDG at CEA, Grenoble (Green zone) — confirm salary'},
  686: {missing:['Salary','Hybrid policy'], note:'QUEUED: Global Production Controller at Pfeiffer Vacuum, Annecy (Orange, English) — confirm salary and hybrid'},
  687: {missing:['Salary'], note:"QUEUED: CDG at L'Usine Nouvelle, Vinay (Yellow zone ~40km) — confirm salary"},
  696: {missing:['Salary','Scope'], note:'QUEUED: "Responsable H/F" at France Travail, Le Versoud (Green) — vague title, confirm scope and salary'},
  697: {missing:['Salary','Location','Hybrid policy'], note:'QUEUED: Treasury Manager (Capital) at Revolut, France (English, likely remote) — confirm location and compensation'},
  698: {missing:['Salary'], note:'QUEUED: Gestionnaire financier bureau commandes, Greater Grenoble area — confirm salary'},
  699: {missing:['Salary','Scope'], note:'QUEUED: Manager Expertise comptable at HappyCab, Crolles (Green) — confirm CDI and salary'},
  709: {missing:['Salary','Location'], note:'QUEUED: Manager Comptable at BBM et Associés — confirm location and salary'},
  712: {missing:['Salary'], note:'QUEUED: Gestionnaire Comptable et Achat at CHU Grenoble, Saint-Laurent-du-Pont (Yellow) — confirm salary'},
  716: {missing:['Salary','Hybrid policy'], note:'QUEUED: Country Finance Manager at Deel, France (English, likely remote) — confirm compensation'},
  717: {missing:['Salary','Scope'], note:'QUEUED: DAF Indépendant at Bras Droit des Dirigeants, Bourgoin — confirm CDI vs freelance mission'},
  718: {missing:['Salary','Scope'], note:'QUEUED: DAF Indépendant at Bras Droit des Dirigeants, Grenoble — confirm CDI vs freelance mission'},
  720: {missing:['Salary','Location','Company name'], note:'QUEUED: CDG-Comptable via CG-RH Conseil — confirm placement company, location, salary'},
  721: {missing:['Salary','Location','Scope'], note:'QUEUED: Responsable de Dossiers at Ekko RH — vague title, confirm scope, location, salary'},
};

// To Assess Priority C → review_queue / To Assess (salary known but below floor)
const TO_ASSESS_MAP = {
  647: {flags:['Low salary'], note:'CDG at Descours & Cabaud, Échirolles — salary 40-45K below €55K floor, Green zone CDI', priority:'C'},
  655: {flags:['Low salary'], note:'Directeur des Achats at iziwork, Sassenage (Green zone) — salary 40-50K below €55K floor', priority:'C'},
};

// Operational rescue gate → review_queue / Needs Info / priority B
const OPERATIONAL_MAP = {
  670: {note:'OPERATIONAL ROLE — review for fit: supply chain planning/approvisionnement at Groupe elydan', missing:['Salary','Hybrid policy']},
  676: {note:'OPERATIONAL ROLE — review for fit: logistics team leader at Fed Supply', missing:['Salary']},
  677: {note:'OPERATIONAL ROLE — review for fit: logistics control tower manager at Lynkus', missing:['Salary']},
  691: {note:'OPERATIONAL ROLE — review for fit: establishment director at Hermès leather goods facility, Le Grand-Lemps', missing:['Salary']},
  695: {note:'OPERATIONAL ROLE — review for fit: procurement/supply chain support manager at LYNRED, Veurey-Voroize', missing:['Salary']},
  713: {note:'OPERATIONAL ROLE — review for fit: procurement/supply chain support manager at LYNRED (dup listing)', missing:['Salary']},
  714: {note:'OPERATIONAL ROLE — review for fit: Manager Inventory & Planning at Roche, Meylan (English)', missing:['Salary','Hybrid policy']},
  715: {note:'OPERATIONAL ROLE — review for fit: logistics site manager at LD Connexion, Saint-Quentin-Fallavier', missing:['Salary']},
  719: {note:'OPERATIONAL ROLE — review for fit: supply chain support manager at LYNRED (subject-parsed, no URL)', missing:['Salary']},
};

const NEW_COMPANIES = [
  {company:'Descours & Cabaud', tier:'C', location:'Échirolles', notes:'CDG role id 647, salary 40-45K/yr'},
  {company:'PROLIANS', tier:'C', location:null, notes:'CDG role id 682, location not disclosed'},
  {company:'Groupe elydan', tier:'C', location:'Saint-Étienne-de-Saint-Geoirs', notes:'Supply chain planning role id 670'},
];

async function run() {
  const c = new Client({connectionString: process.env.PG_CONN});
  await c.connect();

  const stats = {dismissed:0, needs_info:0, to_assess:0, operational:0, manual:0, manual_skipped:0, new_companies:0, errors:[]};

  const {rows: pending} = await c.query(
    "SELECT * FROM listing_inbox WHERE parse_status='pending' ORDER BY id ASC"
  );
  const {rows: manuals} = await c.query(
    "SELECT * FROM listing_inbox WHERE parse_status='manual_check' ORDER BY id ASC"
  );
  const {rows: existingCos} = await c.query('SELECT lower(company) AS co FROM target_companies');
  const existingCoSet = new Set(existingCos.map(r => r.co));

  // Process pending rows
  for (const row of pending) {
    const id = row.id;
    try {
      if (DISMISS_MAP[id]) {
        const d = DISMISS_MAP[id];
        await c.query(
          `INSERT INTO job_applications
           (job_title,company,source,location,salary,priority,cv_approach,status,date_added,
            job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
          [row.job_title, row.company, row.source, row.location, row.salary,
           'C', 'Standard', 'Dismissed',
           row.parse_date, row.job_url, row.gmail_thread_url,
           JSON.stringify(d.flags), JSON.stringify([]),
           row.alert_keyword, d.note, row.english, null, id]
        );
        await c.query("UPDATE listing_inbox SET parse_status='processed' WHERE id=$1", [id]);
        stats.dismissed++;
      } else if (NEEDS_INFO_MAP[id]) {
        const n = NEEDS_INFO_MAP[id];
        await c.query(
          `INSERT INTO review_queue
           (job_title,company,source,location,salary,priority,status,date_added,
            job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
          [row.job_title, row.company, row.source, row.location, row.salary,
           'B', 'Needs Info',
           row.parse_date, row.job_url, row.gmail_thread_url,
           JSON.stringify([]), JSON.stringify(n.missing),
           row.alert_keyword, n.note, row.english, null, id]
        );
        await c.query("UPDATE listing_inbox SET parse_status='processed' WHERE id=$1", [id]);
        stats.needs_info++;
      } else if (TO_ASSESS_MAP[id]) {
        const t = TO_ASSESS_MAP[id];
        await c.query(
          `INSERT INTO review_queue
           (job_title,company,source,location,salary,priority,status,date_added,
            job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
          [row.job_title, row.company, row.source, row.location, row.salary,
           t.priority, 'To Assess',
           row.parse_date, row.job_url, row.gmail_thread_url,
           JSON.stringify(t.flags || []), JSON.stringify([]),
           row.alert_keyword, t.note, row.english, null, id]
        );
        await c.query("UPDATE listing_inbox SET parse_status='processed' WHERE id=$1", [id]);
        stats.to_assess++;
      } else if (OPERATIONAL_MAP[id]) {
        const op = OPERATIONAL_MAP[id];
        await c.query(
          `INSERT INTO review_queue
           (job_title,company,source,location,salary,priority,status,date_added,
            job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
          [row.job_title, row.company, row.source, row.location, row.salary,
           'B', 'Needs Info',
           row.parse_date, row.job_url, row.gmail_thread_url,
           JSON.stringify([]), JSON.stringify(op.missing),
           row.alert_keyword, op.note, row.english, null, id]
        );
        await c.query("UPDATE listing_inbox SET parse_status='processed' WHERE id=$1", [id]);
        stats.operational++;
      } else {
        stats.errors.push({id, msg:'No routing decision found'});
      }
    } catch(e) {
      stats.errors.push({id, msg: e.message});
    }
  }

  // Process manual_check rows
  for (const row of manuals) {
    const id = row.id;
    try {
      const threadUrl = row.gmail_thread_url || '';
      let existing = {rows: []};
      if (threadUrl) {
        existing = await c.query(
          "SELECT id FROM review_queue WHERE gmail_thread_url=$1 AND notes ILIKE '%UNREADABLE%' LIMIT 1",
          [threadUrl]
        );
      }
      if (existing.rows.length > 0) {
        await c.query("UPDATE listing_inbox SET parse_status='processed' WHERE id=$1", [id]);
        stats.manual_skipped++;
        continue;
      }
      const notesText = 'UNREADABLE: ' + (row.parse_notes || row.source + ' HTML-only') + ' — open Gmail link to review and paste JD';
      await c.query(
        `INSERT INTO review_queue
         (job_title,company,source,location,salary,priority,status,date_added,
          job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [row.job_title || 'Not disclosed', row.company || 'Not disclosed',
         row.source, row.location, row.salary,
         'B', 'Needs Info',
         row.parse_date, row.job_url || 'Not available', threadUrl || null,
         JSON.stringify([]), JSON.stringify(['Full JD']),
         row.alert_keyword, notesText, row.english || false, null, id]
      );
      await c.query("UPDATE listing_inbox SET parse_status='processed' WHERE id=$1", [id]);
      stats.manual++;
    } catch(e) {
      stats.errors.push({id, msg: e.message});
    }
  }

  // Add new companies
  for (const nc of NEW_COMPANIES) {
    const coLower = nc.company.toLowerCase();
    const alreadyExists = [...existingCoSet].some(ec => ec.includes(coLower) || coLower.includes(ec));
    if (!alreadyExists) {
      try {
        await c.query(
          'INSERT INTO target_companies (company, tier, location, notes) VALUES ($1,$2,$3,$4)',
          [nc.company, nc.tier, nc.location, nc.notes]
        );
        stats.new_companies++;
      } catch(e) {
        stats.errors.push({id:'company:'+nc.company, msg: e.message});
      }
    }
  }

  await c.end();
  console.log(JSON.stringify({
    ...stats,
    pending_processed: pending.length,
    manual_processed: manuals.length,
  }));
}

run().catch(e => { console.error(e.message); process.exit(1); });
