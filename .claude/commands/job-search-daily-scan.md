---
description: Daily job scan — reads from listing_inbox staging table (populated by /job-email-inbox), analyses all pending rows, routes results to Supabase, sends a Gmail draft digest. Runs automatically each morning at 00:01. Do not invoke manually unless testing.
argument-hint: Optional MM/DD/YY for a single day, or MM/DD/YY+ to catch up from that date through yesterday. Default (no arg) scans yesterday.
allowed-tools: mcp__claude_ai_Gmail__create_draft, Bash
---

# Daily Job Scan

## Step 0 — Load Config

**Choose DB mode based on what credentials are available:**

**pg mode (local sessions):** Run `cat config.json`. Extract `supabase_connection_string` → PG_CONN, `pg_module_path` → PG_MODULE, plus salary floors and location zones.

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
UNION dedup: run two separate GETs (job_applications + review_queue) and treat as found if either returns results.
Auto-expiry notes append: GET matching rows first, then PATCH each with concatenated notes value.

---

## Step 1 — Determine Scan Dates

Parse `$ARGUMENTS`:
- **Empty** → scan yesterday only, then run automatic catch-up check.
- **`MM/DD/YY`** → scan that single date only.
- **`MM/DD/YY+`** → scan from that date through yesterday.

Today's date comes from the `currentDate` context variable. Never scan today itself.

**Automatic catch-up check (when $ARGUMENTS is empty):**
```sql
SELECT scan_date FROM scan_archive ORDER BY scan_date DESC LIMIT 1
```
- If gap between most-recent scan_date and yesterday > 1 day → expand scan range from (most-recent + 1 day) through yesterday. Add "⚠️ Catch-up scan ([N] days missed)" to each date's digest.
- If no rows in scan_archive → scan yesterday only (first run).

**Run Steps 2–4 and Step 6a once per date**, in chronological order. Step 5 (Gmail digest) runs once after all dates complete.

---

## Step 2 — Read listing_inbox

Run two queries in parallel for the current scan_date:

**Query A — Pending rows** (readable listings to analyse):
```sql
SELECT * FROM listing_inbox
WHERE parse_date=$1 AND parse_status='pending'
ORDER BY created_at ASC
```

**Query B — Manual check rows** (HTML-only, route directly to review_queue):
```sql
SELECT * FROM listing_inbox
WHERE parse_date=$1 AND parse_status='manual_check'
ORDER BY created_at ASC
```

**If both return 0 rows:**
```sql
SELECT COUNT(*)::int AS total FROM listing_inbox WHERE parse_date=$1
```
- `total > 0` → all rows already processed. Note "already done" in digest and continue to next date.
- `total = 0` → pre-processor never ran. Note "⚠️ No listing_inbox rows for [date] — run /job-email-inbox [MM/DD/YY]" and continue.

---

## Step 3 — Route manual_check rows to review_queue

For each row from Query B:

**Dedup check:**
```sql
SELECT id FROM review_queue
WHERE gmail_thread_url=$1 AND notes ILIKE '%UNREADABLE%'
LIMIT 1
```
If found → skip (already queued).

**If not queued — INSERT:**
```sql
INSERT INTO review_queue
(job_title,company,source,location,salary,priority,status,date_added,
 job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,listing_inbox_id)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
RETURNING id
```
Values: `job_title`=row.job_title, `company`='Not disclosed', `source`=row.source, `location`=null, `salary`=null, `priority`='B', `status`='Needs Info', `date_added`=row.parse_date, `job_url`=row.job_url, `gmail_thread_url`=row.gmail_thread_url, `red_flags`='[]', `missing_info`='["Full JD"]', `alert_keyword`=row.alert_keyword, `notes`='UNREADABLE: '+row.parse_notes+' — open Gmail link to review and paste JD', `english`=false, `listing_inbox_id`=row.id.

**After INSERT → mark processed:**
```sql
UPDATE listing_inbox SET parse_status='processed' WHERE id=$1
```

---

## Step 4 — Analyse pending rows

### 4a — Dedup check (per-row SQL)

**For each pending row, run two SQL checks before any analysis. Both use direct DB queries — no in-memory matching.**

**Check 1 — URL match (hard dedup):**
```sql
SELECT id FROM (
  SELECT id FROM job_applications WHERE job_url=$1
  UNION ALL
  SELECT id FROM review_queue WHERE job_url=$1
) t LIMIT 1
```
Pass `[row.job_url]`. If any row returned → definite duplicate. Mark `parse_status='processed'`, increment duplicate counter, skip to next row.

**Check 2 — Company + title match (ILIKE):**
Extract the core role phrase from `row.job_title`: strip H/F, (multi-sites), Multisites, seniority suffixes, and parenthetical qualifiers. Keep the primary role noun phrase (e.g. "Responsable Administratif Financier", "Contrôleur de Gestion", "Directeur Financier").
```sql
SELECT id FROM (
  SELECT id FROM job_applications
  WHERE company ILIKE $1
    AND job_title ILIKE $2
    AND status NOT IN ('Dismissed', 'Rejected')
  UNION ALL
  SELECT id FROM review_queue
  WHERE company ILIKE $1
    AND job_title ILIKE $2
) t LIMIT 1
```
Pass `['%<company>%', '%<core_role_phrase>%']`. If any row returned → duplicate (same company, same role family, re-post from different source). Mark `parse_status='processed'`, increment duplicate counter, skip to next row.

If both checks return empty → not a duplicate. Proceed with analysis (Step 4b onward).

### 4b — Rescue gate (apply BEFORE standard ranking)

**Operational/non-finance gate (check first):**
If the role is operational, logistics, supply chain, manufacturing, or non-finance project management (i.e. not primarily a finance/accounting/controlling title) → always route to `status='Needs Info'`, `priority='B'`, `notes` starts with `'OPERATIONAL ROLE — review for fit'`. Do not apply standard ranking. Do not dismiss.

**Standard rescue gate:**
If ALL of the following are true:
1. Title family matches (Finance Director, FP&A, Controlling, P2P, Supply Chain Finance, Procurement at senior level, Financial Analyst, CDG, RAF, DAF, Chef Comptable, Trésorerie, Audit, SSC, Project Manager Finance/ERP)
2. Location is Green, Yellow, or Remote
3. No hard disqualifier (Paris on-site, explicitly entry-level ≤3 yrs required, salary stated below €45K)

…AND any of Salary, Hybrid policy, Full scope, or Company name is missing:
→ `status='Needs Info'`, `priority='B'`, `missing_info`=list of missing fields, `notes` starts with `'QUEUED:'`

**Tiebreaker:** When genuinely unclear, always route to Needs Info. Only assign Dismissed when a disqualifier is unambiguous.

### 4c — Standard priority criteria (fully-populated listings only)

**Location zones** (from config):
- Green (0–25 min): Grenoble, Échirolles, Meylan, Saint-Égrève, Pont-de-Claix, Montbonnot, Crolles, Voreppe, Bernin, Saint-Martin-d'Hères, dept 38 core towns
- Yellow (30–50 min): Voiron, Moirans, Chambéry, Saint-Marcellin, Pontcharra
- Orange (1h–1h45): Valence, Annecy, Ugine, Faverges, Cluses, Bourg-en-Bresse, Albertville
- Red (1h15+ / no hybrid): Lyon, Paris, Luxembourg

**Priority rules:**
- **A**: Senior finance/FP&A/controlling, Green or Yellow, CDI, English exposure, ≥€55K → `job_applications` `To Apply`
- **B**: Good fit on 3/4 criteria → `review_queue` `To Assess`
- **C**: Multiple mismatches or one disqualifying factor → `review_queue` `To Assess`
- **Dismissed**: Definitive disqualifier (Paris on-site, explicitly entry-level with ≤3 years required, <€40K stated, truly unrelated role — IT development, medical, marketing, HR professional, legal, education) → `job_applications` `Dismissed`, populate `red_flags`, `notes='Auto-dismissed: [reason]'`. Operational/logistics/supply chain/PM roles are NEVER auto-dismissed — see rescue gate above.

### 4d — Write to Supabase

| Outcome | Table | Status |
|---|---|---|
| Priority A | `job_applications` | `To Apply` |
| Priority B/C | `review_queue` | `To Assess` |
| Rescue gate (Needs Info) | `review_queue` | `Needs Info` |
| Dismissed | `job_applications` | `Dismissed` |

**For review_queue rows:**
```sql
INSERT INTO review_queue
(job_title,company,source,location,salary,priority,status,date_added,
 job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
RETURNING id
```

**For job_applications rows:**
```sql
INSERT INTO job_applications
(job_title,company,source,location,salary,priority,cv_approach,status,date_added,
 job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
RETURNING id
```

Field notes:
- `date_added` = `row.parse_date` (the email date, not today)
- `source` = `row.source` (from listing_inbox)
- `red_flags` = `JSON.stringify([...])` — valid values: `"Low salary"`, `"French only"`, `"No hybrid"`, `"Far location"`, `"Fixed-term"`, `"Junior scope"`, `"Off-topic"`
- `missing_info` = `JSON.stringify([...])` — valid values: `"Salary"`, `"Hybrid policy"`, `"Scope"`, `"Full JD"`, `"Company name"`
- `english` = boolean
- `cv_approach` (job_applications only): `'FP&A Focus'` / `'Cost Control Focus'` / `'Standard'` / `'Transformation Focus'`
- `job_description` = full JD text truncated to ~4000 chars; null if unobtainable

### 4e — Mark processed

After each successful INSERT:
```sql
UPDATE listing_inbox SET parse_status='processed' WHERE id=$1
```

### 4f — Capture company to target list (batch, silent)

**Run once per scan_date before the row loop — load existing companies:**

```sql
SELECT company FROM target_companies
```

Store as `existingCompanies` (in-memory). Check new companies against this list rather than querying per row.

**Skip if company matches any of:** `'Not disclosed'`, `'DAF-ACTIVE'`, blank, or a string that contains `Agence`, `Cabinet de recrutement`, `Recruteur indépendant`, `RH Partenaires`, or `Bras Droit` (known agency/freelance-network placeholders that are not real employer targets).

**During Step 4:** After each non-Dismissed INSERT, add company to `newCompanies[]` if not in `existingCompanies` (case-insensitive partial match).

**After all rows processed — INSERT all new companies:**

```sql
INSERT INTO target_companies (company, tier, location, notes)
VALUES ($1, 'C', $2, $3)
RETURNING id
```

Run one INSERT per new company. Track total inserted for the digest.

---

## Step 5 — Write scan_archive + send Gmail draft digest

### 5a — scan_archive

**Runs once per scan_date (inside the per-date loop).** Write one row per date — do not batch all dates into a single write.

```sql
INSERT INTO scan_archive
(scan_date, digest_text, total_found, potentially_apply, needs_info, to_assess, dismissed)
VALUES ($1,$2,$3,$4,$5,$6,$7)
ON CONFLICT (scan_date) DO UPDATE SET
  digest_text=EXCLUDED.digest_text,
  total_found=EXCLUDED.total_found,
  potentially_apply=EXCLUDED.potentially_apply,
  needs_info=EXCLUDED.needs_info,
  to_assess=EXCLUDED.to_assess,
  dismissed=EXCLUDED.dismissed
```
Pass `[scan_date, digest_text, total_new, priority_a_count, needs_info_count, to_assess_count, dismissed_count]`.

`total_new` = all rows written (excluding duplicates). `needs_info_count` includes rescue gate rows + manual_check rows routed in Step 3.

### 5b — Gmail draft digest

Call `mcp__claude_ai_Gmail__create_draft` with:
- `to`: `zberlo12@gmail.com`
- `subject`: `Job Scan Digest — [scan_date]` (if multiple dates: `Job Scan Digest — [first_date] to [last_date]`)
- `body`: plain text, one section per scan date:

```
Job Scan Digest — YYYY-MM-DD
════════════════════════════

[N] new listings · [N] pursued · [N] dismissed
(+[N] duplicates skipped)

By Priority
  A → To Apply:      [N]  [titles if any]
  B/C → To Assess:   [N]
  Needs Info:        [N]
  Dismissed:         [N]  top reason: [most common red flag]

Sources: LinkedIn [N] · Indeed [N] · APEC [N] · Cadremploi [N] · Direct [N]

Needs Info Queue (added today)
  • [title] @ [company] — missing: [fields]  (Gmail: [url])
  • [title] @ [company] — UNREADABLE: [source]  (Gmail: [url])

[If Priority A rows:]
Notable
  • [title] @ [company] — [one-line reason]

[If new companies captured > 0:]
New companies → target list: [N]  (run /job-search-target-companies C to check careers pages)

scan_archive: written ✅
```

If no listings were found for a date, write: `No new listings for YYYY-MM-DD.`
