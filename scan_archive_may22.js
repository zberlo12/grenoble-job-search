'use strict';
const {Client} = require(process.env.PG_MODULE);

const digest = `Job Scan Digest — 2026-05-22
================================

116 new listings · 2 pursued · 50 dismissed
(+14 unreadable duplicates skipped)

By Priority
  A → To Apply:      0
  B/C → To Assess:   2  (Descours & Cabaud CDG; iziwork Directeur Achats)
  Needs Info:        50  (25 finance + 9 operational + 16 unreadable APEC/Cadremploi)
  Dismissed:         50  top reasons: Off-topic 33, Far location 14, Low salary 7

Sources (pending): Indeed 33 · LinkedIn 47 · Direct 6
Manual-check: APEC 3 · Cadremploi 26 · Direct (Kforce) 1

Needs Info Queue (backlog May 17-21)
  Finance roles:
  • Financial Analyst @ BD, Le Pont-de-Claix (Green, English) — missing: Salary
  • Controleur de Gestion @ CEA, Grenoble (Green) — missing: Salary
  • DAF @ RC Human Recruitment, Echirolles — missing: Salary, Company name
  • Responsable Administratif et Financier @ Grenoble INP-UGA, Grenoble — missing: Salary
  • Controleur de Gestion @ Korus Group, La Murette (dept 38) — missing: Salary
  • Country Finance Manager @ Deel, France (English, remote) — missing: Salary, Hybrid policy
  • Controleur de Gestion @ PROLIANS — missing: Salary, Location, Hybrid policy
  • Treasury Manager (Capital) @ Revolut, France (English) — missing: Salary, Location
  • Global Production Controller @ Pfeiffer Vacuum, Annecy (Orange, English) — missing: Salary, Hybrid
  • Responsable Comptable Interne @ In Extenso — missing: Salary, Location
  Operational (rescue gate - review for finance fit):
  • Manager Inventory & Planning @ Roche, Meylan (Green, English) — missing: Salary
  • MANAGER SUPPORT ACHATS & SUPPLY CHAIN @ LYNRED, Veurey-Voroize — missing: Salary
  • Responsable planning & approvisionnement @ Groupe elydan — missing: Salary
  • Responsable de Site Logistique @ LD Connexion — missing: Salary
  APEC/Cadremploi: 16 UNREADABLE — open Gmail threads to review

New companies added to target list: 3  (Descours & Cabaud, PROLIANS, Groupe elydan)

scan_archive: written`;

const c = new Client({connectionString: process.env.PG_CONN});
c.connect()
  .then(() => c.query(
    `INSERT INTO scan_archive (scan_date,digest_text,total_found,potentially_apply,needs_info,to_assess,dismissed)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (scan_date) DO UPDATE SET
       digest_text=EXCLUDED.digest_text,
       total_found=EXCLUDED.total_found,
       potentially_apply=EXCLUDED.potentially_apply,
       needs_info=EXCLUDED.needs_info,
       to_assess=EXCLUDED.to_assess,
       dismissed=EXCLUDED.dismissed`,
    ['2026-05-22', digest, 116, 0, 50, 2, 50]
  ))
  .then(() => { console.log('ok'); return c.end(); })
  .catch(e => { console.error(e.message); process.exit(1); });
