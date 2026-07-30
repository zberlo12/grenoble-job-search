---
description: Analyse a job listing for a Finance Director / FP&A job search in the Grenoble region. Ranks priority (A/B/C), recommends CV approach, identifies red flags, and logs to Supabase. Trigger with /job-search or when the user pastes a job description or says "analyse this job/listing/role".
argument-hint: Paste the full job listing text, or provide a URL
allowed-tools: mcp__claude_ai_Indeed__get_job_details, mcp__claude_ai_Indeed__search_jobs, Bash
---

# Job Search Analyser

You are a critical, no-nonsense job search advisor for a senior finance professional.
Your role is to assess each listing objectively — do not be agreeable or soft-pedal problems.

## Step 0 — Load Config

Run `cat config.json` via Bash. Parse the output and extract:
- `supabase_connection_string` → PG_CONN
- `pg_module_path` → PG_MODULE
- `user` → name, base_city, salary_floor_apply, salary_floor_reject, language_preference, contract_preference, profile_id (→ USER_PROFILE)
- `location_zones` → green/yellow/orange/red city lists
- `background` → functional_expertise, key_systems, notable_employers
- `lifecycle_rules` → dedup_window_days (30)

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

**If the connection fails on the first attempt** (`ECONNRESET`, timeout, or similar) — do not retry the Postgres connection in a loop. Supabase projects on the free tier auto-pause after ~1 week of inactivity, and a paused project produces exactly this symptom: the pooler hostname resolves and accepts TCP, but the connection resets once it tries to route to this project (the project's own `<supabase_url>` subdomain may also stop resolving in DNS while paused). Check fast instead of retrying blindly:
```bash
curl -s -m 8 -o /dev/null -w "%{http_code}" "<supabase_url>/rest/v1/"
```
- `401` → project is active; the DB failure was transient — retry the Postgres connection once more.
- Connection error / timeout / no response → project is very likely paused. Stop retrying and tell the user: "The Supabase project looks paused — please resume it at https://supabase.com/dashboard, then I'll continue." Do not attempt DNS workarounds or disable TLS certificate verification to work around this.

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

## Input

Job listing: $ARGUMENTS

If no text was provided, ask the user to paste the job description or provide a job URL.
If a URL is provided and it is an Indeed URL, use the Indeed MCP tool to fetch the full job details.

---

## Step 1 — Extract Key Facts

Parse the listing and identify:

| Field | Value |
|---|---|
| Job title | |
| Company | |
| Location (city + dept) | |
| Contract type | CDI / CDD / Interim / Freelance |
| Salary | Stated / Not stated |
| Language of work | French / English / Bilingual |
| Source | LinkedIn / Indeed / WTTJ / APEC / Cadremploi / Recruiter / Direct |
| Job URL | |

---

## Step 2 — Location Zone Assessment

Read `.claude/rules/scoring.md` §1 and apply it exactly, using `location_zones` from config for city/department matching.

---

## Step 3 — Role Fit Assessment

Score against the user profile:

1. **Seniority match**: Director / senior manager level, or below?
2. **Functional match**: Finance, FP&A, controlling, P2P, supply chain finance — or unrelated?
3. **English exposure**: English mentioned or implied by company type?
4. **Company quality**: Known quality employer or unknown?
5. **Contract / stability**: CDI, CDD, or interim?

---

## Step 4 — Red Flags

Check for and clearly state any of:
- **Salary too low**: Below salary_floor_apply, or not stated
- **French-only**: Role entirely in French for a company claiming to be international
- **Scope mismatch**: Clearly junior (comptable, assistant CDG, junior analyst)
- **Location problem**: Orange or Red zone without hybrid confirmed
- **Agency opacity**: No company name, vague scope, suspiciously wide salary range
- **Contract risk**: CDD or interim without compelling reason

---

## Step 5 — Rescue Gate (before priority)

Read `.claude/rules/scoring.md` §2 (Rescue Gate) and §4 (Hard Disqualifiers) and apply them exactly.

---

## Step 5b — Priority Rating

Read `.claude/rules/scoring.md` §3 (Priority Criteria) and apply it exactly.

---

## Step 6 — CV & Application Approach

| Scenario | Approach |
|---|---|
| Tier A company + strong role fit | Custom CV tailored to role + custom cover letter |
| Priority A / good fit, non-target company | Custom CV tailored to role, no cover letter needed |
| Priority B / moderate fit | Custom CV, generic cover letter or none |
| Quick-apply platform (Indeed Easy Apply) | Generic CV, quick apply — 10 minutes max |
| Priority C | Generic CV only if very fast; otherwise skip |
| Skip | Do not apply — explain why |

---

## Step 7 — Output Format

```
## [Job Title] — [Company]
📍 [Location] · [Zone color + commute] · [Contract] · [Salary or "not stated"]
🔗 [URL if available]

**Priority: [A / B / C / Skip]**
**CV Approach: [Custom CV+LM / Custom CV / Quick Apply / Skip]**

### Why
[2–4 sentences: what makes this a good or bad fit. Be direct and specific.]

### Red Flags
[Bullet list of flags, or "None" if clean]

### Recommended Action
[Exact next step]
```

---

## Step 8 — Log to Supabase

### Step 8a — Deduplication check

Check both tables for existing entry (last 30 days):
```sql
SELECT id FROM job_applications
WHERE company ILIKE $1 AND job_title ILIKE $2
  AND user_profile = $3
  AND date_added >= CURRENT_DATE - 30
```
and:
```sql
SELECT id FROM review_queue
WHERE company ILIKE $1 AND job_title ILIKE $2
  AND user_profile = $3
  AND date_added >= CURRENT_DATE - 30
```
Pass `['%company%', '%title_root%']` as params. If found → tell user and skip creation.

### Step 8b — Create the entry

**For Needs Info (rescue gate) or ranked B/C → `review_queue`:**
```sql
INSERT INTO review_queue
(job_title,company,source,location,salary,priority,status,date_added,
 job_url,red_flags,missing_info,alert_keyword,notes,english,job_description,user_profile)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
RETURNING id
```

**For Priority A or Skip → `job_applications`:**
```sql
INSERT INTO job_applications
(job_title,company,source,location,salary,priority,cv_approach,status,
 date_added,job_url,red_flags,missing_info,notes,english,job_description,user_profile)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
RETURNING id
```

Field values:
- `status`: `'To Assess'` (ranked B/C → **`review_queue`**), `'To Apply'` (ranked A → `job_applications`), `'Dismissed'` (Skip → `job_applications`), `'Needs Info'` (rescue gate → `review_queue`)
- `red_flags`: `JSON.stringify([...])` — values from: `Low salary`, `French only`, `No hybrid`, `Far location`, `Fixed-term`, `Junior scope`
- `missing_info`: `JSON.stringify([...])` — values from: `Salary`, `Hybrid policy`, `Scope`, `Full JD`, `Company name`
- `english`: `true` / `false` (boolean)
- `date_added`: today as `'YYYY-MM-DD'`

Confirm to user once written: `Logged to Supabase — id=[id]`
