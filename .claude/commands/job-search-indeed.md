---
description: Manual Indeed job search for Grenoble area and/or remote France-wide roles. Asks whether to search locally, remotely, or both, then runs grouped searches, deduplicates against Supabase, analyses each listing, and writes new entries. Use when you want to sweep Indeed directly — separate from the daily Gmail scan.
argument-hint: Optional. Leave empty to be prompted. Or pass "local", "remote", or "both".
allowed-tools: mcp__claude_ai_Indeed__search_jobs, mcp__claude_ai_Indeed__get_job_details, AskUserQuestion, Bash
---

# Indeed Job Search — Grenoble / Remote

## Step 0 — Load Config

Run `cat config.json` via Bash. Parse the output and extract:
- `supabase_connection_string` → PG_CONN
- `pg_module_path` → PG_MODULE
- `user` → name, base_city, salary_floor_apply, language_preference
- `location_zones` → green/yellow/orange/red city lists
- `lifecycle_rules.dedup_window_days` → 30
- `job_titles` → french and english title lists (for search groups)

**DB query pattern** — substitute actual `PG_MODULE` and `PG_CONN` values from config in every Bash call:
```bash
PG_MODULE="<pg_module_path>" PG_CONN="<supabase_connection_string>" node -e "
const {Client}=require(process.env.PG_MODULE);
const c=new Client({connectionString:process.env.PG_CONN});
c.connect()
  .then(()=>c.query('<SQL>',[<params>]))
  .then(r=>{console.log(JSON.stringify(r.rows));return c.end();})
  .catch(e=>{console.error(e.message);process.exit(1);});
"
```

**REST API mode (remote triggers):** When `SUPABASE_URL` and `SUPABASE_KEY` are provided via trigger config instead (TCP ports 5432/6543 are blocked in remote environments), skip `cat config.json` and use `curl` for all DB calls:

```bash
# SELECT
curl -s "SUPABASE_URL/rest/v1/<table>?<filters>&select=<cols>&order=<col>.<dir>&limit=<n>" \
  -H "apikey: SUPABASE_KEY" -H "Authorization: Bearer SUPABASE_KEY"

# INSERT (returns inserted row)
curl -s -X POST "SUPABASE_URL/rest/v1/<table>" \
  -H "apikey: SUPABASE_KEY" -H "Authorization: Bearer SUPABASE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '<JSON>'

# UPDATE
curl -s -X PATCH "SUPABASE_URL/rest/v1/<table>?<filter>" \
  -H "apikey: SUPABASE_KEY" -H "Authorization: Bearer SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '<JSON>'

# UPSERT (ON CONFLICT DO UPDATE)
curl -s -X POST "SUPABASE_URL/rest/v1/<table>" \
  -H "apikey: SUPABASE_KEY" -H "Authorization: Bearer SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates,return=representation" \
  -d '<JSON>'
```

Filter operators: `col=eq.val` · `col=ilike.*val*` · `col=gte.val` · `col=lt.val` · `col=in.(a,b)` · `col=not.in.(a,b)` — multiple filters ANDed with `&`.
UNION queries: run two separate GETs and treat as found if either returns results.

---

## Step 1 — Determine Scope

If `$ARGUMENTS` is "local", "remote", or "both" — use that. Otherwise ask:

> "Search locally (Grenoble ~50km), remotely (France-wide), or both?"

- **local** → run Local searches only (Step 2A)
- **remote** → run Remote searches only (Step 2B)
- **both** → run both

---

## Step 2A — Local Searches (Grenoble ~50km)

Run **5 search groups** with `location: "Grenoble, France"`, `country_code: "FR"`, `job_type: "fulltime"`.

Then run groups 1 and 2 again with `location: "Chambéry, France"` to capture Yellow-zone roles.

**Group 1 — FP&A / Controller / CDG:**
`"Contrôleur de Gestion OR Financial Controller OR FP&A Manager OR Finance Business Partner OR Responsable Contrôle de Gestion OR Responsable FP&A OR Responsable Planification Financière OR Contrôleur de Gestion Senior OR Pilote Financier"`

**Group 2 — RAF / DAF / Finance Director:**
`"Responsable Administratif Financier OR RAF OR Directeur Financier OR Directeur Administratif et Financier OR DAF OR Finance Manager OR Finance Director OR Head of Finance OR Finance Lead OR Responsable Finance et Comptabilité"`

**Group 3 — Cost Control / Comptabilité / Consolidation / Trésorerie:**
`"Cost Controller OR Contrôleur de Gestion Industriel OR Responsable Comptabilité OR Chef Comptable OR Business Controller OR Consolidation Manager OR Responsable Consolidation OR Responsable Trésorerie OR Trésorier d'Entreprise"`

**Group 4 — P2P / Procurement / Achats:**
`"Responsable P2P OR Responsable Procure-to-Pay OR P2P Manager OR Procurement Manager OR Responsable Achats OR Acheteur Senior OR Directeur Achats OR Responsable Achats Indirects"`

**Group 5 — Supply Chain / Planning / S&OP:**
`"Demand Planner OR Supply Chain Planner OR Responsable Supply Chain OR Supply Chain Manager OR Senior Buyer OR S&OP Manager OR Responsable S&OP OR Supply Chain Finance"`

Total: 7 API calls (5 × Grenoble + 2 × Chambéry for groups 1–2). Run all in parallel where possible.

---

## Step 2B — Remote Searches (France-wide)

Run **3 search groups** with `location: "France"`, `country_code: "FR"`, `job_type: "fulltime"`.

**Group 1 — Finance Director / FP&A / Head of Finance / CFO:**
`"Finance Director OR Directeur Financier OR Directeur Administratif et Financier OR DAF OR Financial Controller OR FP&A Manager OR Finance Manager OR Head of Finance OR CFO OR Finance Lead OR Responsable FP&A OR VP Finance"`

> **CFO note**: For any CFO result, verify company size before ranking — appropriate only where CFO = sole Finance Director (typically ≤€100M revenue). Skip if clearly large-cap.

**Group 2 — Finance Business Partner / Reporting / Consolidation / Trésorerie:**
`"Finance Business Partner OR Finance Transformation OR Responsable Budget et Reporting OR Consolidation Manager OR Responsable Consolidation OR Responsable Trésorerie OR Responsable Planification Financière OR Group Finance Manager"`

**Group 3 — P2P / Procurement / S&OP:**
`"P2P Manager OR Responsable P2P OR Procurement Manager OR Finance Governance OR Responsable Procure-to-Pay OR S&OP Manager OR Responsable S&OP OR Directeur Achats"`

---

## Step 3 — Deduplicate Against Supabase

Collect all results from Steps 2A/2B. Deduplicate across searches first (same job ID = one entry). Then for each unique listing:

**Check dedup window (last 30 days):**
```sql
SELECT id FROM job_applications
WHERE (company ILIKE $1 AND job_title ILIKE $2 AND date_added >= CURRENT_DATE - 30)
   OR (job_url LIKE $3 AND date_added >= CURRENT_DATE - 30)
```
Also check review_queue:
```sql
SELECT id FROM review_queue
WHERE company ILIKE $1 AND job_title ILIKE $2
  AND date_added >= CURRENT_DATE - 30
```

If found in either table → discard. If not found → proceed to analysis.

**Pre-dedup title normalisation:** Expand abbreviations before searching:
- RAF ↔ Responsable Administratif Financier
- DAF ↔ Directeur Administratif Financier
- CDG ↔ Contrôleur de Gestion
- FBP ↔ Finance Business Partner

---

## Step 4 — Analyse Each Listing

### Adjacent title recognition
Before skipping on title alone, check whether the role content (snippet, job details) suggests a finance leadership function. Watch for: "Responsable de Gestion", "Gestionnaire Financier Senior", "Responsable Performance", "Finance & Operations Manager".

### Rescue gate (apply FIRST)
If ALL true:
1. Title family matches (Finance Director, FP&A, Controlling, P2P, Supply Chain Finance at senior level)
2. Location is 🟢 Green, 🟡 Yellow, 🌐 Remote, or unspecified for remote search
3. No hard disqualifier (Paris on-site, explicitly junior, salary stated below €45K)

...AND any of Salary, Hybrid policy, Full scope, or Company name is missing → route to review_queue:
- `status = 'Needs Info'`, `priority = 'B'` (provisional)

**Tiebreaker**: When genuinely unclear, always route to Needs Info.

### Location zones (local search)
- 🟢 Green: Grenoble, Échirolles, Meylan, Saint-Égrève, Pont-de-Claix, Montbonnot, Crolles, Voreppe, Bernin, Saint-Martin-d'Hères, dept 38 core towns
- 🟡 Yellow: Voiron, Moirans, Chambéry, Saint-Marcellin, Pontcharra
- 🟠 Orange: Valence, Annecy, Ugine, Faverges, Cluses, Bourg-en-Bresse, Albertville
- 🔴 Red: Lyon, La Tour-en-Maurienne, Paris, Luxembourg

For remote search: location zone defaults to 🌐 Remote.

### Priority rules
- 🟢 A: Senior finance/FP&A/controlling, Green/Yellow/Remote, CDI, English exposure, ≥€55K
- 🟡 B: Good fit on 3/4 criteria; or Tier A company with one weakness
- 🔴 C: Multiple mismatches or one disqualifying factor
- ⛔ Skip: Definitive disqualifier

---

## Step 5 — Write to Supabase

For each surviving listing:

**Needs Info → `review_queue`:**
```sql
INSERT INTO review_queue
(job_title,company,source,location,salary,priority,status,date_added,
 job_url,red_flags,missing_info,alert_keyword,notes,english,job_description)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
RETURNING id
```

**Ranked (To Assess/To Apply/Dismissed) → `job_applications`:**
```sql
INSERT INTO job_applications
(job_title,company,source,location,salary,priority,cv_approach,status,
 date_added,job_url,red_flags,missing_info,notes,english,job_description)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
RETURNING id
```

Field values:
- `source`: `'Indeed'`
- `status`: `'To Assess'` (ranked B/C), `'To Apply'` (A), `'Dismissed'` (Skip), `'Needs Info'` (rescue gate → review_queue only)
- `red_flags`: `JSON.stringify([...])`, `missing_info`: `JSON.stringify([...])`
- `english`: boolean `true`/`false`
- `date_added`: today as `'YYYY-MM-DD'`

---

## Step 6 — Summary

```
Indeed Sweep — [Local / Remote / Both]
Results: [N] found · [N] skipped (already in Supabase) · [N] written

By Priority:
🟢 A: [N] — [titles if any]
🟡 B: [N] — [titles if any]
🔴 C: [N]
⏸️ Needs Info: [N]
⛔ Skip: [N]

Notable: [2–3 bullets for any Priority A or interesting B listings]
```
