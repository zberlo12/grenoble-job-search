---
description: Checks Target Companies careers pages for open finance roles. Fetches Tier A and B companies from Supabase, visits each careers URL, looks for relevant listings, deduplicates against Job Applications, and writes new entries. Trigger with /job-search-target-companies.
argument-hint: Optional. Pass "A" for Tier A only, "B" for Tier B only, "C" for Tier C (auto-captured from daily scan), "all" for all tiers. Default checks Tier A and B.
allowed-tools: mcp__claude_ai_Indeed__search_jobs, mcp__claude_ai_Indeed__get_job_details, WebFetch, Bash
---

# Target Companies Careers Sweep

## Step 0 — Load Config

Read `.claude/rules/db.md` and use `scripts/db.js` for all database access below.

Run `cat config.json` via Bash and extract `user` → name, salary_floor_apply, language_preference, profile_id (→ USER_PROFILE), `location_zones` → green/yellow/orange/red city lists.

---

## Step 1 — Fetch Target Companies

Parse `$ARGUMENTS`:
- `"A"` → only Tier A
- `"B"` → only Tier B
- `"C"` → only Tier C (companies auto-captured from the daily scan — not yet manually reviewed)
- `"all"` → all tiers (A, B, and C)
- blank → Tier A and B only (default — omits Tier C to avoid sweeping every auto-captured company)

```sql
SELECT id, company, tier, sector, location, careers_url, last_checked
FROM target_companies
WHERE tier = ANY($1)
  AND user_profile = $2
ORDER BY tier ASC, last_checked ASC NULLS FIRST
```
Pass `[['A','B'], USER_PROFILE]` (default) · `[['A'], USER_PROFILE]` · `[['B'], USER_PROFILE]` · `[['C'], USER_PROFILE]` · `[['A','B','C'], USER_PROFILE]` (for `"all"`).

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

Read `.claude/rules/scoring.md` §1–4 and apply them exactly to each finance role identified — location zones, the rescue gate, priority criteria, and hard disqualifiers.

Do not write roles that are clearly junior, wrong function, or hard disqualifiers.

---

## Step 4 — Deduplicate Against Supabase

For each role passing Step 3:
```sql
SELECT id FROM job_applications
WHERE company ILIKE $1 AND job_title ILIKE $2
  AND date_added >= CURRENT_DATE - 30
  AND user_profile = $3
```
Also:
```sql
SELECT id FROM review_queue
WHERE company ILIKE $1 AND job_title ILIKE $2
  AND date_added >= CURRENT_DATE - 30
  AND user_profile = $3
```
If found in either → skip.

---

## Step 5 — Write New Roles to Supabase

**Needs Info or ranked B/C → `review_queue`:**
```sql
INSERT INTO review_queue
(job_title,company,source,location,salary,priority,status,date_added,
 job_url,red_flags,missing_info,notes,english,job_description,user_profile)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
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
- `source`: `'Direct'`
- `user_profile`: `USER_PROFILE` (final param on both INSERTs)
- `status`: `'To Assess'` (B/C → **`review_queue`**), `'To Apply'` (A → `job_applications`), `'Dismissed'` (skip → `job_applications`), `'Needs Info'` (rescue gate → `review_queue`)
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
Companies checked: [N] Tier A, [N] Tier B[, [N] Tier C if applicable]
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
