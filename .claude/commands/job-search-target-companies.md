---
description: Checks Target Companies careers pages for open finance roles. Fetches Tier A and B companies from Supabase, visits each careers URL, looks for relevant listings, deduplicates against Job Applications, and writes new entries. Trigger with /job-search-target-companies.
argument-hint: Optional. Pass "A" to check only Tier A, "B" for only Tier B. Default checks both.
allowed-tools: mcp__claude_ai_Indeed__search_jobs, mcp__claude_ai_Indeed__get_job_details, WebFetch, Bash
---

# Target Companies Careers Sweep

## Step 0 — Load Config

Run `cat config.json` via Bash. Parse the output and extract:
- `supabase_connection_string` → PG_CONN
- `pg_module_path` → PG_MODULE
- `user` → name, salary_floor_apply, language_preference
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

## Step 1 — Fetch Target Companies

Parse `$ARGUMENTS`:
- `"A"` → only Tier A
- `"B"` → only Tier B
- blank → both Tier A and B

```sql
SELECT id, company, tier, sector, location, careers_url, last_checked
FROM target_companies
WHERE tier = ANY($1)
ORDER BY tier ASC, last_checked ASC NULLS FIRST
```
Pass `[['A','B']]` (or `[['A']]` / `[['B']]` for filtered runs).

---

## Step 2 — Check Each Company

For each company, work through this ladder in order. Stop as soon as you get usable results.

**Rung 1 — WebFetch on careers URL**
If `careers_url` is set and is a direct careers/jobs page:
- Call WebFetch: "List all open finance, controlling, FP&A, procurement, supply chain finance, or accounting roles. For each: job title, location, contract type (CDI/CDD), any salary info. Return as a structured list. If no relevant roles found, say 'No finance roles'."
- If page is JavaScript-heavy or returns no content → fall through to Rung 2.
- If the URL is LinkedIn → skip Rung 1 entirely, go to Rung 2.

**Rung 2 — Indeed company search**
Call `mcp__claude_ai_Indeed__search_jobs` with:
- `search`: `"[Company Name]"`
- `location`: `"Grenoble, France"` (or `"France"` if company is remote-friendly / national)
- `country_code`: `"FR"`
- `job_type`: `"fulltime"`

Filter results to finance-relevant titles only.

**Rung 3 — Flag for manual check**
If both rungs fail, note the company in the manual check list.

---

## Step 3 — Assess Roles Found

Apply standard analysis to each finance role identified:
- Is the title senior enough? (Finance Director, FP&A, Controller, P2P, RAF, DAF — yes. Junior analyst, assistant comptable — skip.)
- Location zone assessment (Green/Yellow/Remote = yes; Orange = hybrid required; Red = skip)
- Rescue gate: if title and company are strong but salary/hybrid missing → Needs Info

Do not write roles that are clearly junior, wrong function, or hard disqualifiers.

---

## Step 4 — Deduplicate Against Supabase

For each role passing Step 3:
```sql
SELECT id FROM job_applications
WHERE company ILIKE $1 AND job_title ILIKE $2
  AND date_added >= CURRENT_DATE - 30
```
Also:
```sql
SELECT id FROM review_queue
WHERE company ILIKE $1 AND job_title ILIKE $2
  AND date_added >= CURRENT_DATE - 30
```
If found in either → skip.

---

## Step 5 — Write New Roles to Supabase

**Needs Info → `review_queue`:**
```sql
INSERT INTO review_queue
(job_title,company,source,location,salary,priority,status,date_added,
 job_url,red_flags,missing_info,notes,english,job_description)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
RETURNING id
```

**Ranked → `job_applications`:**
```sql
INSERT INTO job_applications
(job_title,company,source,location,salary,priority,cv_approach,status,
 date_added,job_url,red_flags,missing_info,notes,english,job_description)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
RETURNING id
```

Field values:
- `source`: `'Direct'`
- `status`: `'To Assess'` (B/C), `'To Apply'` (A), `'Dismissed'` (skip), `'Needs Info'` (rescue gate → review_queue)
- `red_flags`: `JSON.stringify([...])`, `missing_info`: `JSON.stringify([...])`
- `english`: `true`/`false`
- `date_added`: today as `'YYYY-MM-DD'`

---

## Step 6 — Update last_checked in target_companies

After processing each company (regardless of whether roles were found):
```sql
UPDATE target_companies SET last_checked = CURRENT_DATE WHERE id = $1
```

---

## Step 7 — Summary

```
Target Companies Sweep — [date]
Companies checked: [N] Tier A, [N] Tier B
Finance roles found: [N total]  ·  Already in Supabase: [N]  ·  Written: [N]

By Priority:
🟢 A: [N] — [titles @ companies]
🟡 B: [N] — [titles @ companies]
🔴 C: [N]
⏸️ Needs Info: [N]

Manual check needed (blocked/JS-heavy):
- [Company] — [reason]

No roles found:
- [Company list]
```

---

## Notes on Limitations

- **LinkedIn careers pages** — require login; always fall through to Indeed Rung 2.
- **JavaScript-heavy ATS** — WebFetch returns empty; fall through to Indeed or flag for manual check.
- **No credentials stored** — only publicly available pages accessed.
