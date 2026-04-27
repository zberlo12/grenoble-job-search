---
description: Qualify Tier C companies in target_companies — lightweight research to determine whether each deserves active targeting (Tier A/B) or should be dropped (Tier D). Two modes: batch (no arg, processes all Tier C) or single (company name, qualifies one company). Trigger with /job-qualify-companies.
argument-hint: Optional. Company name for single-company mode. Omit to process the full Tier C queue.
allowed-tools: mcp__claude_ai_Indeed__search_jobs, WebFetch, Bash
---

# Company Qualification

## Step 0 — Load Config

Run `cat config.json` via Bash. Parse the output and extract:
- `supabase_connection_string` → PG_CONN
- `pg_module_path` → PG_MODULE
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

**REST API mode (remote triggers):** When `SUPABASE_URL` and `SUPABASE_KEY` are provided via trigger config instead, skip `cat config.json` and use `curl` for all DB calls (standard pattern).

---

## Step 1 — Determine Mode

Parse `$ARGUMENTS`:
- **Empty** → **Batch mode**: fetch all Tier C companies and qualify them as a group.
- **Company name** → **Single mode**: fetch and qualify that one company (any tier).

**Batch — fetch Tier C queue:**
```sql
SELECT id, company, sector, location, careers_url, notes
FROM target_companies
WHERE tier = 'C'
ORDER BY company ASC
```
If no rows: "No Tier C companies to qualify — nothing to do." and stop.

**Single — fetch by name:**
```sql
SELECT id, company, tier, sector, location, careers_url, notes
FROM target_companies
WHERE company ILIKE $1
```
Pass `['%<company_name>%']`. If not found: offer to qualify anyway without a DB row (research-only output, no save).

---

## Step 2 — Research Loop (silent in batch mode)

For each company, work through the research ladder. Stop when you have enough to make a qualification call. Discard full page content after extracting structured fields — do not retain large text blocks.

**Rung 1 — Company website**

Try WebFetch on `[company].com`, `[company].fr`, or `[company].com/about`. Use this prompt:
> "What does this company do? What sector or industry? Approximate headcount or revenue? Is it a standalone company, a subsidiary, or a branch? Is English used as a working language (stated on the site or in job postings)? Any visible evidence of a finance or controlling function at Director level — CFO, DAF, Finance Director, VP Finance mentioned?"

Extract: `sector`, `size_estimate`, `english` (yes/likely/unknown/no), `finance_signal` (one line), `structure` (standalone/subsidiary/branch).

If the page is JavaScript-heavy or blocked → fall through to Rung 2.

**Rung 2 — Indeed company search**

Call `mcp__claude_ai_Indeed__search_jobs` with:
- `search`: `"[Company Name]"`
- `location`: `"Grenoble, France"` (or `"France"` if company appears remote-friendly/national)
- `country_code`: `"FR"`
- `job_type`: `"fulltime"`

Filter results to finance-relevant titles only (Finance Director, DAF, RAF, CDG, FP&A, Controller, Trésorerie, Chef Comptable). Ignore sales, IT, engineering, HR.

A Finance Director or DAF posting = strong Tier A signal. CDG or RAF posting = Tier B signal. Accounting assistant only = Tier D signal.

**Rung 3 — Research blocked**

If both rungs return nothing useful: mark as `research_blocked = true`. Keep in table — never auto-drop a company just because the website is blocked.

---

## Step 3a — Batch Mode: Comparison Table

After the silent research sweep, output:

```
## Company Qualification — Tier C Queue ([N] companies)

| # | Company | Sector | Size | 🌐 English | Finance signals | Rec. |
|---|---------|--------|------|-----------|-----------------|------|
| 1 | [name]  | [sector or "?"] | [~N or "?"] | Yes/Likely/No/? | [1-line] | A/B/D/? |
```

Rec. column:
- **A** = strong match on 4–5 criteria (size, finance function, English, right sector, right zone)
- **B** = good match with one gap
- **D** = does not meet the bar — too small, wrong sector, no finance function at Director level, or French-only
- **?** = research blocked — needs manual check before assigning

Then ask:
> "Confirm or override each assignment (e.g. `1A 2B 5D`), type `all` to accept all recommendations, or type `hold` to leave any company unchanged as Tier C.
> Companies not mentioned are held as Tier C."

Wait for response.

---

## Step 3b — Single Mode: Company Card

Output a detailed qualification card:

```
## [Company Name]

**Sector:** [sector or "Unknown"]
**Size:** [headcount/revenue estimate or "Unknown"]
**Structure:** [standalone / subsidiary of X / branch office]
**English culture:** [Yes / Likely / Unknown / French-only] — [one-line reason]
**Finance function signals:** [what was found — CFO/DAF title, finance role postings, ERP mention, team size]
**Location zone:** [Green/Yellow/Orange/Red for Grenoble]

**Verdict:** Tier [A/B/D] — [2 sentences explaining the call]
```

Then ask: "Assign as Tier [rec]? Or choose A / B / D / hold (leave as Tier C)."

---

## Step 4 — Update Supabase

For each confirmed tier assignment, run:

```sql
UPDATE target_companies
SET tier = $1,
    sector = COALESCE(NULLIF($2,''), sector),
    notes = COALESCE(notes,'') || E'\n\n### Qualified ' || $3 || E'\n' || $4,
    last_checked = CURRENT_DATE
WHERE id = $5
```
Pass `[new_tier, sector_if_found_or_null, today_YYYY-MM-DD, one_line_qualification_summary, row_id]`.

If `careers_url` was discovered during research and is currently null in the DB, add it to the UPDATE:
```sql
UPDATE target_companies
SET tier=$1, sector=COALESCE(NULLIF($2,''),sector), careers_url=COALESCE(careers_url,$3),
    notes=COALESCE(notes,'')||E'\n\n### Qualified '||$4||E'\n'||$5,
    last_checked=CURRENT_DATE
WHERE id=$6
```

**Tier D** — keep the row in `target_companies` as Tier D. Do not delete. This prevents the daily scan's dedup check from re-adding it as Tier C on the next run.

`sector` is only written if the existing DB value is null or empty (`COALESCE(NULLIF(...))` pattern).

---

## Step 5 — Summary

```
Qualification complete — [date]
  Promoted to Tier A: [N] — [names]
  Promoted to Tier B: [N] — [names]
  Dropped to Tier D:  [N] — [names]
  Left as Tier C:     [N] — [names, if held or blocked]

Next: run /job-search-target-companies to sweep your updated Tier A+B list for open roles.
```

---

## Qualification Criteria Reference

| Signal | Tier A | Tier B | Tier D (drop) |
|--------|--------|--------|---------------|
| Size | 200+ employees or known revenue | 50–200, growth-stage | <50, no finance team apparent |
| Finance function | CFO/DAF/Finance Director visible | Likely has senior finance role | Accounting manager or assistant only |
| Sector | Industrial, tech, pharma/medtech, energy, logistics, financial services | Any sector with a real P&L | Consumer events, NGO, pure public sector |
| English culture | Explicitly stated or strongly implied | Possible / has international parent | French-only, no international signals |
| Location zone | Green or Yellow, or remote-friendly | Orange if strong otherwise | Red zone with no hybrid evidence |

One Tier D signal alone is not disqualifying — apply holistic judgment. Only assign Tier D when the company clearly does not support a Finance Director-level hire.
