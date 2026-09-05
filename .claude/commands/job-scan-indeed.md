---
description: Manual Indeed job search for Grenoble area and/or remote France-wide roles. Asks whether to search locally, remotely, or both, then runs grouped searches, deduplicates against Supabase, analyses each listing, and writes new entries. Use when you want to sweep Indeed directly — separate from the daily Gmail scan.
argument-hint: Optional. Leave empty to be prompted. Or pass "local", "remote", or "both".
allowed-tools: mcp__claude_ai_Indeed__search_jobs, mcp__claude_ai_Indeed__get_job_details, AskUserQuestion, Bash
---

# Indeed Job Search — Grenoble / Remote

## Step 0 — Load Config

Read `.claude/rules/db.md` and use `scripts/db.js` for all database access below.

Run `cat config.json` via Bash and extract `user` → name, base_city, salary_floor_apply, language_preference, profile_id (→ USER_PROFILE), `location_zones` → green/yellow/orange/red city lists, `lifecycle_rules.dedup_window_days` → 30, `job_titles` → french and english title lists (for search groups).

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
WHERE ((company ILIKE $1 AND job_title ILIKE $2 AND date_added >= CURRENT_DATE - 30)
   OR (job_url LIKE $3 AND date_added >= CURRENT_DATE - 30))
  AND user_profile = $4
```
Also check review_queue:
```sql
SELECT id FROM review_queue
WHERE company ILIKE $1 AND job_title ILIKE $2
  AND date_added >= CURRENT_DATE - 30
  AND user_profile = $3
```

If found in either table → discard. If not found → proceed to analysis.

**Pre-dedup title normalisation:** Expand abbreviations before searching:
- RAF ↔ Responsable Administratif Financier
- DAF ↔ Directeur Administratif Financier
- CDG ↔ Contrôleur de Gestion
- FBP ↔ Finance Business Partner

---

## Step 4 — Analyse Each Listing

### Adjacent title recognition (source-specific to Indeed — see scoring.md §6)
Before skipping on title alone, check whether the role content (snippet, job details) suggests a finance leadership function. Watch for: "Responsable de Gestion", "Gestionnaire Financier Senior", "Responsable Performance", "Finance & Operations Manager".

### Rescue gate, location zones, and priority rules
Read `.claude/rules/scoring.md` §1–4 and apply them exactly, using `location_zones` from config for city/department matching. For remote search: location zone defaults to 🌐 Remote.

---

## Step 5 — Write to Supabase

For each surviving listing:

**Needs Info or ranked B/C → `review_queue`:**
```sql
INSERT INTO review_queue
(job_title,company,source,location,salary,priority,status,date_added,
 job_url,red_flags,missing_info,alert_keyword,notes,english,job_description,user_profile)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
RETURNING id
```

**Priority A or Skip → `job_applications`:**
```sql
INSERT INTO job_applications
(job_title,company,source,location,salary,priority,cv_approach,status,
 date_added,job_url,red_flags,missing_info,notes,english,job_description,user_profile)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
RETURNING id
```

Field values:
- `source`: `'Indeed'`
- `user_profile`: `USER_PROFILE` (final param on both INSERTs)
- `status`: `'To Assess'` (ranked B/C → **`review_queue`**), `'To Apply'` (A → `job_applications`), `'Dismissed'` (Skip → `job_applications`), `'Needs Info'` (rescue gate → `review_queue`)
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
