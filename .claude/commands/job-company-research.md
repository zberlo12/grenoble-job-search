---
description: Research a company before applying or before an interview. Fetches company overview, finance team signals, open roles, and saves a summary to Target Companies in Supabase. Trigger with /job-company-research or when the user says "research [company]".
argument-hint: Company name (e.g. "Schneider Electric"). Required — will ask if not provided.
allowed-tools: mcp__claude_ai_Indeed__search_jobs, mcp__claude_ai_Indeed__get_job_details, WebFetch, Bash
---

# Company Research

## Step 0 — Load Config

Run `cat config.json` via Bash. Parse the output and extract:
- `supabase_connection_string` → PG_CONN
- `pg_module_path` → PG_MODULE
- `user.base_city` → base location
- `background` → functional_expertise (for relevance assessment)

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

## Step 1 — Identify the company

If `$ARGUMENTS` is provided: use it as the company name.
Otherwise ask: "Which company would you like to research?"

---

## Step 2 — Check existing Supabase data

```sql
SELECT id, company, tier, sector, location, careers_url, last_checked, notes
FROM target_companies
WHERE company ILIKE $1
```
Pass `['%company_name%']`. If found: show existing Notes and Last Checked date as context.

Also check for current listings:
```sql
SELECT job_title, status, date_added, job_url
FROM job_applications
WHERE company ILIKE $1 AND status NOT IN ('Dismissed', 'Rejected')
ORDER BY date_added DESC
```

---

## Step 3 — Research in parallel

**A. Company website**
Try WebFetch on `[company].com`, `[company].fr`, or `[company].com/about` with prompt:
"What does this company do? What sector/industry? Approximate employee count or revenue?
Is it a standalone company, a subsidiary, or a group? Any major recent news (past 12 months)?
Is English used — in the site language, job postings, or stated as a working language?"

If blocked: try `[company].com/en` or the French equivalent.

**B. Open finance roles**
If a careers URL exists in target_companies: call WebFetch on it with prompt:
"List all open finance, controlling, FP&A, procurement, accounting, or treasury roles.
For each: job title, location, contract type (CDI/CDD). Return a structured list or say 'None found'."

If no careers URL, or WebFetch fails: call `mcp__claude_ai_Indeed__search_jobs` with:
- `search`: `"[Company Name]"`
- `location`: base_city from config (or "France" if company seems national/remote)
- `country_code`: "FR"
- `job_type`: "fulltime"

Filter Indeed results to finance-relevant titles only. Ignore sales, engineering, HR.

---

## Step 4 — Compile and output the research profile

```
## [Company Name]

**What they do:** [2 sentences — sector, main products/services]
**Size:** [headcount or revenue, or "unknown"]
**Structure:** [standalone / subsidiary of [Group] / HQ in [city]]
**English culture:** [Yes / Likely / Unknown / French-only] — [1-line reasoning]
**Recent news:** [relevant change, or "nothing notable found"]

**Finance team signals:**
[Indicators of finance function size, ERP system, reporting structure, strategic vs. operational scope]

**Open finance roles right now:**
[list from Careers/Indeed, or "No finance roles currently posted"]

**Relevance to your profile:**
[1–2 sentences connecting this company's sector, size, or profile to background — why it's a good fit or interesting stretch]
```

---

## Step 5 — Save to Supabase

**If company exists in target_companies (found in Step 2):**

```sql
UPDATE target_companies
SET notes = COALESCE(notes,'') || E'\n\n' || $1,
    last_checked = CURRENT_DATE
WHERE id = $2
```
Pass `['### [today]\n[research summary]', row_id]`.

If `tier` is not set: suggest a tier based on research and ask:
"Based on this research, I'd suggest Tier [A/B/C/D] — [one-line reason]. Confirm?"
If confirmed: `UPDATE target_companies SET tier = $1 WHERE id = $2`

**If company does NOT exist in target_companies:**
Ask: "Would you like to add [Company] to your Target Companies list? (yes/no)"

If yes:
```sql
INSERT INTO target_companies
(company, tier, sector, location, careers_url, last_checked, notes)
VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6)
RETURNING id
```
Confirm: "Added [Company] to Target Companies."
