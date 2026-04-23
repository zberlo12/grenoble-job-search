---
description: Pipeline health dashboard showing funnel metrics, source quality, response rates, and red flag patterns across your job search. Read-only — no updates. Trigger with /job-analytics.
argument-hint: Optional time window in days: "7", "30", or "90". Default: 30.
allowed-tools: Bash
---

# Job Search Analytics

## Step 0 — Load Config

Run `cat config.json` via Bash. Parse the output and extract:
- `supabase_connection_string` → PG_CONN
- `pg_module_path` → PG_MODULE
- `user.name` → name
- `location_zones` → green/yellow/orange/red city lists

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

---

## Step 1 — Fetch Data

Parse `$ARGUMENTS` for a time window (7, 30, or 90 days). Default: 30.

Run three queries in sequence (use the DB query pattern, substituting actual connection values):

**Query 1 — Window rows:**
```sql
SELECT id, job_title, company, source, location, salary, priority, status,
       date_added, date_applied, date_response, alert_keyword, red_flags, english
FROM job_applications
WHERE date_added >= CURRENT_DATE - $1::int
ORDER BY date_added
```
Pass `[window_days]` as params.

**Query 2 — Pipeline snapshot (active rows only, both tables):**
```sql
SELECT status, count(*)::int AS count FROM job_applications
WHERE status NOT IN ('Dismissed', 'Rejected')
GROUP BY status
UNION ALL
SELECT status, count(*)::int AS count FROM review_queue GROUP BY status
ORDER BY status
```

**Query 3 — Speed metrics:**
```sql
SELECT
  ROUND(AVG(date_applied - date_added)) AS avg_days_to_apply,
  ROUND(AVG(date_response - date_applied)) AS avg_days_to_response
FROM job_applications
WHERE date_applied IS NOT NULL
```

**Query 4 — Alert performance (window):**
```sql
SELECT
  alert_keyword,
  COUNT(*)::int AS total,
  COUNT(*) FILTER (WHERE status != 'Dismissed')::int AS pursued
FROM job_applications
WHERE date_added >= CURRENT_DATE - $1::int
  AND alert_keyword IS NOT NULL AND alert_keyword != ''
GROUP BY alert_keyword
ORDER BY total DESC
```
Pass `[window_days]` as params.

**Query 5 — Dismiss reasons by alert keyword (window):**
```sql
SELECT
  alert_keyword,
  flag,
  COUNT(*)::int AS cnt
FROM job_applications,
     jsonb_array_elements_text(red_flags) AS flag
WHERE date_added >= CURRENT_DATE - $1::int
  AND status = 'Dismissed'
  AND alert_keyword IS NOT NULL AND alert_keyword != ''
GROUP BY alert_keyword, flag
ORDER BY alert_keyword, cnt DESC
```
Pass `[window_days]` as params.

---

## Step 2 — Compute Metrics

Using the fetched rows, compute in-context:

### Volume (window rows)
- Total listings found
- By source: LinkedIn / Indeed / Direct / Other
- By priority assigned: A / B / C / Needs Info / Dismissed

For Needs Info counts in the window, also run:
```sql
SELECT COUNT(*)::int AS count FROM review_queue
WHERE date_added >= CURRENT_DATE - $1::int AND status = 'Needs Info'
```

### Pipeline snapshot (active rows only)
Use Query 2 results. Count rows in each active status: Needs Info, To Assess (from review_queue) + Potentially Apply, To Apply, Docs Ready, Applied, Interview, Offer, On Hold (from job_applications). Dismissed and Rejected are excluded from this view.

### Funnel conversion
- **Application rate** = (Applied+Interview+Offer+Rejected) / (To Apply+Applied+Interview+Offer+Rejected)
- **Interview rate** = (Interview+Offer) / (Applied+Interview+Offer+Rejected)
- **Offer rate** = Offer / (Interview+Offer) — show only if > 0

### Speed
From Query 3 results.

### Top red flags (window rows)
`red_flags` is a JSONB array. Parse each row's red_flags array and count occurrences of each flag. Show top 3.

### Zone breakdown (window rows)
Derive zone from Location field using location_zones from config. Count: Green / Yellow / Orange / Red / Remote.

### Pass rate and dismiss reasons (window rows — computed from Volume data)
- Pass rate = Pursued / Total × 100%  (add to Volume output line)
- Top dismiss reasons = count red_flags values on all Dismissed rows in window. Show top 3. Add under Volume section.

### Alert performance
From Query 4 and Query 5 results. For each keyword:
- pass rate = pursued / total
- dismiss reasons = join Query 5 rows for that keyword, take top 2 by count, format as "Flag (N), Flag (N)"
- If all rows were pursued (no dismissed): show "—" in dismiss reasons column
- If pursued = 0: mark pass rate in bold as a problem signal

---

## Step 3 — Output

```
## Job Search Analytics — Last [N] days  ([start] to [today])

### Volume (last [N] days)
[N] listings found  ·  [N] pursued ([N]%)  ·  [N] dismissed ([N]%)

Sources:  LinkedIn [N]  ·  Indeed [N]  ·  Direct [N]  ·  Other [N]
Priority: A [N]  ·  B [N]  ·  C [N]  ·  Needs Info [N]  ·  Unranked [N]

Top dismiss reasons:
1. [flag] — [N]
2. [flag] — [N]
3. [flag] — [N]

### Pipeline (active — all time)
Needs Info [N]  →  To Assess [N]  →  Potentially Apply [N]  →  To Apply [N]
→  Docs Ready [N]  →  Applied [N]  →  Interview [N]  →  Offer [N]
On Hold [N]

### Conversion
Application rate:  [N]%
Interview rate:    [N]%
[Offer rate: [N]% — only if applicable]
Avg days to apply:    [N]
Avg days to response: [N]

### By Zone (last [N] days)
Green [N]  ·  Yellow [N]  ·  Orange [N]  ·  Red [N]  ·  Remote [N]

### Alert Performance (last [N] days)
| Alert Keyword | Found | Pursued | Pass rate | Top dismiss reasons |
|---|---|---|---|---|
| [keyword] | [N] | [N] | [N]% | [Flag (N), Flag (N)] |

[If any keyword has 0% pass rate: "⚠️ '[keyword]' — 0% pass rate. Top reasons: [dismiss reasons]. Consider pausing or refining this alert."]
[If no Alert Keyword data yet: "Alert performance data will appear after the first daily scan runs."]

### Insight
[1–2 sentence observation]
```
