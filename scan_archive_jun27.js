const {Client} = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const c = new Client({connectionString: 'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'});

const digest = `Job Scan Digest -- 2026-06-27

45 inbox rows - 33 new entries - 16 dismissed
(+12 duplicate inbox rows skipped; multi-listing rows yielded ~8 additional dedup sub-items)

By Priority
  A -> To Apply:      0
  B -> Needs Info:   16  (finance roles + operational flagged for review)
  C -> To Assess:     1  (SIDAS -- low salary)
  Dismissed:         16  top reasons: Off-topic x11, Far location x3, Junior scope x1

Sources: LinkedIn 8 - Indeed 8 - Direct/HelloWork 4 (multi-listing) - Direct/Cadremploi 2 - career-ops 1

Needs Info Queue -- Finance Roles
  * Analyste financier Senior / M&A @ Waga Energy, Eybens -- missing: Salary, Hybrid, Scope
  * CDG International @ W Executive France, Lyon -- missing: Salary, Hybrid, Full JD, Company name
  * Responsable Administratif et Financier H/F @ [Not disclosed via Fonction:Support] / Grenoble -- CDD 55-65K
  * Responsable Comptable et Administratif H/F @ [Not disclosed via Fonction:Support] / Grenoble -- CDD 55-65K
  * Responsable Controle de Gestion et Finance H/F @ [Not disclosed via Fonction:Support] / Grenoble -- CDD 55-65K
  * Responsable Administratif et Comptable H/F @ Adsearch / Saint-Etienne-de-Saint-Geoirs -- CDI 50-60K
  * Gestionnaire Comptable et RH @ Maison Emploi Voironnais, Voiron

Needs Info Queue -- Operational (review for fit)
  * Manager Achats Indirects @ LYNRED, Grenoble
  * Acheteur/Acheteuse @ Vulcain Engineering Group, Grenoble
  * Project manager @ SGL Group, Saint-Martin-d'Heres
  * Gestionnaire commande publique @ Ville de Chambery
  * Manager Logistique @ DECATHLON FRANCE, Frontonas
  * Manager Logistique @ DECATHLON FITNESS LAB, Frontonas
  * Materials Planner 3 @ Lam Research, Meylan  (English env)
  * Responsable Logistique @ Groupe Piment, Rives
  * Acheteur Projet @ EIMI, Plan (38)

To Assess (C -- low salary)
  * Responsable Comptable H/F @ SIDAS, Voiron -- CDI 42-44K

New companies added to target list: 8
  Waga Energy, Vulcain Engineering Group, SGL Group, Decathlon, Lam Research, EIMI, Groupe Piment, SIDAS

career-ops: 1 new role imported (Hightouch -- auto-dismissed: North America only)

scan_archive: written`;

async function run() {
  await c.connect();
  await c.query(
    `INSERT INTO scan_archive (scan_date,digest_text,total_found,potentially_apply,needs_info,to_assess,dismissed,user_profile)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (scan_date,user_profile) DO UPDATE SET
       digest_text=EXCLUDED.digest_text,
       total_found=EXCLUDED.total_found,
       potentially_apply=EXCLUDED.potentially_apply,
       needs_info=EXCLUDED.needs_info,
       to_assess=EXCLUDED.to_assess,
       dismissed=EXCLUDED.dismissed`,
    ['2026-06-27', digest, 45, 0, 16, 1, 16, 'zberlo']
  );
  console.log('scan_archive written OK');
  await c.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
