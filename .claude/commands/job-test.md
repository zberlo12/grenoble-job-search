---
description: Test version of the daily scan — reads from listing_inbox instead of Gmail. Routes pending rows through the full analysis pipeline, routes manual_check rows (APEC/Cadremploi unreadable) to review_queue as Needs Info with Gmail link. Use to validate listing_inbox logic before migrating the production daily scan. Trigger with /job-test.
argument-hint: MM/DD/YY date to scan (e.g. 04/23/26). Default: yesterday.
allowed-tools: mcp__claude_ai_Indeed__get_job_details, Bash
---

# Job Scan Test — listing_inbox Reader

## Step 0 — Load Config

Run `cat config.json` via Bash. Extract:
- `supabase_connection_string` → PG_CONN
- `pg_module_path` → PG_MODULE
- `user.salary_floor_apply` → salary_floor (default €55K)
- `user.salary_floor_reject` → hard_reject (default €40K)
- `location_zones` → green/yellow/orange/red city lists

**DB query pattern** — substitute actual values in every Bash call:
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

---

## Step 1 — Determine Scan Date

Parse `$ARGUMENTS` for a date in `MM/DD/YY` format (e.g. `04/23/26`):
- month = first two digits, day = middle two, year = `20` + last two
- Convert to `scan_date` in `YYYY-MM-DD` format for SQL

If `$ARGUMENTS` is empty → use yesterday (currentDate − 1 day).

**Catch-up check (informational only):**
```sql
SELECT scan_date FROM scan_archive ORDER BY scan_date DESC LIMIT 1
```
If the most recent scan_date is more than 1 day before scan_date → note "⚠️ Catch-up gap detected ([N] days missed)" in the output. But still scan only the single requested date — no multi-date looping in test mode.

---

## Step 2 — Read listing_inbox

Run two queries in parallel:

**Query A — Pending rows** (readable listings to analyse):
```sql
SELECT * FROM listing_inbox
WHERE parse_date=$1 AND parse_status='pending'
ORDER BY created_at ASC
```

**Query B — Manual check rows** (unreadable — route directly to review_queue):
```sql
SELECT * FROM listing_inbox
WHERE parse_date=$1 AND parse_status='manual_check'
ORDER BY created_at ASC
```

**If both queries return 0 rows**, run:
```sql
SELECT COUNT(*)::int AS total FROM listing_inbox WHERE parse_date=$1
```
- `total > 0` → pre-processor ran but all rows are already processed. Output: "All listing_inbox rows for [date] already processed — nothing to do." and stop.
- `total = 0` → pre-processor never ran for this date. Output: "⚠️ No listing_inbox rows for [date]. Run /job-email-inbox [MM/DD/YY] first." and stop.

---

## Step 3 — Route manual_check rows to review_queue

For each row from Query B:

**Dedup check first:**
```sql
SELECT id FROM review_queue
WHERE gmail_thread_url=$1 AND notes ILIKE '%UNREADABLE%'
LIMIT 1
```
Pass `[row.gmail_thread_url]`. If a row is returned → skip (already queued). Count as `already_queued`.

**If not already queued — INSERT into review_queue:**
```sql
INSERT INTO review_queue
(job_title, company, source, location, salary, priority, status, date_added,
 job_url, gmail_thread_url, red_flags, missing_info, alert_keyword, notes, english)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
RETURNING id
```

Pass:
1. `job_title` = `row.job_title` (e.g. `'APEC alert'`)
2. `company` = `'Not disclosed'`
3. `source` = `row.source`
4. `location` = `null`
5. `salary` = `null`
6. `priority` = `'B'`
7. `status` = `'Needs Info'`
8. `date_added` = `row.parse_date`
9. `job_url` = `row.job_url`
10. `gmail_thread_url` = `row.gmail_thread_url`
11. `red_flags` = `'[]'`
12. `missing_info` = `'["Full JD"]'`
13. `alert_keyword` = `row.alert_keyword`
14. `notes` = `'UNREADABLE: ' + row.parse_notes + ' — open Gmail link to review and paste JD'`
15. `english` = `false`

**After INSERT → mark processed:**
```sql
UPDATE listing_inbox SET parse_status='processed' WHERE id=$1
```

---

## Step 4 — Analyse pending rows

Process each row from Query A one by one.

### 4a — Dedup check

Expand known abbreviations before searching:
- RAF ↔ Responsable Administratif Financier
- DAF ↔ Directeur Administratif Financier
- CDG ↔ Contrôleur de Gestion
- FBP ↔ Finance Business Partner

```sql
SELECT id FROM job_applications
WHERE company ILIKE $1 AND job_title ILIKE $2
  AND date_added >= CURRENT_DATE - INTERVAL '30 days'
UNION
SELECT id FROM review_queue
WHERE company ILIKE $1 AND job_title ILIKE $2
  AND date_added >= CURRENT_DATE - INTERVAL '30 days'
LIMIT 1
```
Pass `['%<company>%', '%<title_root>%']`. If any row returned → duplicate, skip. Count as `duplicate`.

URL confirmation (when title is ambiguous):
- Indeed: extract `jk=` value; LinkedIn: extract numeric job ID
```sql
SELECT id FROM job_applications WHERE job_url ILIKE $1
UNION
SELECT id FROM review_queue WHERE job_url ILIKE $1
LIMIT 1
```
If match → duplicate. Skip.

### 4b — Rescue gate (apply BEFORE standard ranking)

If ALL of the following are true:
1. Title family matches (Finance Director, FP&A, Controlling, P2P, Supply Chain Finance, Procurement at senior level)
2. Location is Green, Yellow, or Remote
3. No hard disqualifier (Paris on-site, explicitly junior, wrong function, salary stated below €45K)

…AND any of Salary, Hybrid policy, Full scope, or Company name is missing:
→ Route to review_queue: `status = 'Needs Info'`, `priority = 'B'`, `missing_info` = list of missing fields, `notes` starts with `'QUEUED:'`

**Tiebreaker:** When genuinely unclear, always route to Needs Info. Only assign Dismissed when a disqualifier is unambiguous.

### 4c — Standard priority criteria (for fully-populated listings only)

**Location zones** (from config):
- Green (0–25 min): Grenoble, Échirolles, Meylan, Saint-Égrève, Pont-de-Claix, Montbonnot, Crolles, Voreppe, Bernin, Saint-Martin-d'Hères, dept 38 core towns
- Yellow (30–50 min): Voiron, Moirans, Chambéry, Saint-Marcellin, Pontcharra
- Orange (1h–1h45): Valence, Annecy, Ugine, Faverges, Cluses, Bourg-en-Bresse, Albertville
- Red (1h15+ / no hybrid): Lyon, Paris, Luxembourg

**Priority rules:**
- **A**: Senior finance/FP&A/controlling, Green or Yellow, CDI, English exposure, ≥€55K → `job_applications` `To Apply`
- **B**: Good fit on 3/4 criteria → `review_queue` `To Assess`
- **C**: Multiple mismatches or one disqualifying factor → `review_queue` `To Assess`
- **Dismissed**: Definitive disqualifier (Paris on-site, clearly junior, <€40K stated, unrelated role) → `job_applications` `Dismissed`, populate `red_flags`, `notes = 'Auto-dismissed: [reason]'`

**Red flags:** Low salary, French only, No hybrid, Far location, Fixed-term, Junior scope, Off-topic

### 4d — Pre-write enrichment (Needs Info rows only)

Skip for ranked and Dismissed listings.

- **Rung 1 — Indeed API**: if `job_url` contains `jk=`, call `mcp__claude_ai_Indeed__get_job_details` with the jk value. If successful → extract salary, contract type, hybrid/remote, seniority, scope, language. Re-rank if all gaps filled.
- **Rung 2 — WebFetch**: if `job_url` exists and is not LinkedIn, fetch it. Extract structured fields only. Re-rank if gaps filled.
- **Rung 3 — LinkedIn short-circuit**: if `job_url` is LinkedIn → skip enrichment, write as Needs Info unchanged.
- **Rung 4 — No URL / all failed**: write as Needs Info unchanged.

Context-hygiene: discard full JD text after extracting fields.

### 4e — Write to Supabase

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
 job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
RETURNING id
```

**For job_applications rows:**
```sql
INSERT INTO job_applications
(job_title,company,source,location,salary,priority,cv_approach,status,date_added,
 job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
RETURNING id
```

Field notes:
- `date_added` = `row.parse_date` (the original email date, not today)
- `source` = `row.source` (from listing_inbox)
- `red_flags` = `JSON.stringify([...])` — valid values: `"Low salary"`, `"French only"`, `"No hybrid"`, `"Far location"`, `"Fixed-term"`, `"Junior scope"`, `"Off-topic"`
- `missing_info` = `JSON.stringify([...])` — valid values: `"Salary"`, `"Hybrid policy"`, `"Scope"`, `"Full JD"`, `"Company name"`
- `english` = boolean (not string)
- `cv_approach` (job_applications only): `'FP&A Focus'` / `'Cost Control Focus'` / `'Standard'` / `'Transformation Focus'`
- `job_description` = full JD text truncated to ~4000 chars; null only if nothing obtainable

### 4f — Mark processed in listing_inbox

After each successful INSERT:
```sql
UPDATE listing_inbox SET parse_status='processed' WHERE id=$1
```

---

## Step 5 — Write scan_archive

Build a digest summary string from all counts. Then:

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

`total_new` = all rows written (excluding duplicates). `needs_info_count` includes both rescue gate rows AND manual_check rows routed from Step 3.

---

## Step 6 — Output

```
/job-test complete — [scan_date]

listing_inbox rows:
  pending:       [N]  (analysed)
  manual_check:  [N]  (routed to review_queue)
  already done:  [N]  (skipped — already processed)

Results:
  Duplicates skipped:          [N]
  Priority A → To Apply:       [N]
  Priority B/C → To Assess:    [N]
  Needs Info (rescue gate):    [N]
  Unreadable → Needs Info:     [N]
  Dismissed:                   [N]

Review queue additions:
[For each row added to review_queue:]
  • [job_title] @ [company] — [status] ([reason e.g. "UNREADABLE: APEC HTML-only" or "missing: Salary, Hybrid policy"])
    🔗 Gmail: [gmail_thread_url]

scan_archive: ✅ written for [scan_date]

Run /job-review to process the queue.
```
