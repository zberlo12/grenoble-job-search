---
description: Drain the Review Queue — enriches Needs Info rows (auto-fetch + manual paste), then presents To Assess rows for confirm/override. Reads from the review_queue table (Supabase). Writes resolved rows to job_applications and deletes them from the queue. Trigger with /job-review.
argument-hint: Optional — pass a row count limit (e.g. "5") to process only the N oldest queued listings
allowed-tools: mcp__claude_ai_Indeed__get_job_details, mcp__claude_ai_Gmail__get_thread, WebFetch, Bash
---

# Job Review Queue Drainer

## Step 0 — Load Config

Run `cat config.json` via Bash. Parse the output and extract:
- `supabase_connection_string` → PG_CONN
- `pg_module_path` → PG_MODULE
- `user.name` → name
- `user.salary_floor_apply`, `user.salary_floor_reject` → salary floors
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

You are helping drain the Review Queue — a staging table holding listings the daily scan flagged as either:
- **Needs Info** — plausible matches where salary, hybrid policy, full scope, or company name was missing
- **To Assess** — fully ranked listings (B/C priority) awaiting confirmation before entering the main pipeline

---

## Step 1 — Fetch the Queue

```sql
SELECT id, job_title, company, source, location, salary, priority, status,
       date_added, job_url, gmail_thread_url, red_flags, missing_info,
       alert_keyword, notes, english, job_description
FROM review_queue
ORDER BY
  CASE status WHEN 'Needs Info' THEN 1 ELSE 2 END,
  date_added ASC
```

Split rows into:
- **Group A — Needs Info**: `status = 'Needs Info'`
- **Group B — To Assess**: `status = 'To Assess'`

If `$ARGUMENTS` is a number, limit Group A to that many rows (Group B always shown in full).
If both groups are empty: "Review Queue is empty — nothing to review" and stop.

---

## Step 2 — Enrichment Sweep for Group A (silent — no user pauses)

Loop through every Needs Info row. For each row, attempt auto-enrichment using the ladder below.
**Do not pause or ask the user anything during this sweep.**

**Context-hygiene rule:** If a fetched page exceeds ~8K characters, extract only the structured fields (salary, location, hybrid/remote, scope, language, contract type, seniority) and discard the rest.

**Rung 1 — Indeed URL**
If `job_url` contains `jk=`, extract the job ID and call `mcp__claude_ai_Indeed__get_job_details`.

**Rung 2 — Gmail thread re-read**
If `gmail_thread_url` is set, extract the thread ID (last segment after `#all/`) and call `mcp__claude_ai_Gmail__get_thread`. Only trust this rung if the thread body contains more than a one-line alert snippet.

**Rung 3 — LinkedIn short-circuit**
If `job_url` is a `linkedin.com/*` URL, skip Rung 4. Add to manual-paste list with reason `LinkedIn — blocked`.

**Rung 4 — WebFetch (non-LinkedIn URLs)**
If `job_url` exists and is not LinkedIn, call WebFetch:
> "Extract the full job description, salary, contract type, location, hybrid/remote policy, required seniority/experience level, and any language requirements. Return as structured fields only."

Do NOT retry if first call returns blocked/truncated/empty. Fall through to manual list.

**If enrichment succeeded (rungs 1–4):**
- Re-rank immediately using Step 3 criteria.
- Write resolved row to job_applications + delete from review_queue (Step 4).
- Mark as auto-processed.

**If enrichment failed:**
- Add to the **manual-paste list**: `[Title] @ [Company] — [reason] 🔗 [URL if any]`
- Continue sweep.

---

## Step 3 — Re-rank (apply after successful enrichment of a Needs Info row)

With enriched information, apply standard analysis:

- Location zone — reconfirm with full location data
- Role fit — seniority, function, English, company quality, contract
- Red flags — update the list
- Priority rating — assign final A / B / C / Skip

The rescue gate does NOT reapply in review — produce a final ranking.
If information is STILL missing after enrichment, add to manual-paste list.

---

## Step 4 — Write to job_applications + Delete from review_queue

When a row is fully resolved:

**4a — INSERT into job_applications:**
```sql
INSERT INTO job_applications
(job_title, company, source, location, salary, priority, cv_approach, status,
 date_added, job_url, gmail_thread_url, red_flags, missing_info, alert_keyword,
 notes, english, job_description)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
RETURNING id
```

Priority → Status mapping:
- Priority A → `status = 'To Apply'`
- Priority B → `status = 'Potentially Apply'`
- Priority C → `status = 'Dismissed'`
- Skip → `status = 'Dismissed'`

`missing_info`: `JSON.stringify([])` (cleared)
`red_flags`: `JSON.stringify([...updated flags...])`
`notes`: rewritten — strip `QUEUED:` prefix, replace with final 2–3 sentence analysis

**4b — DELETE from review_queue:**
```sql
DELETE FROM review_queue WHERE id = $1
```

Do not leave any row in the review_queue with a "resolved" marker. Either it's deleted or it's genuinely still pending.

---

## Step 5 — Group B: To Assess Confirmation Pass

After Group A is fully processed, present all Group B (To Assess) rows as a confirmation table:

```
## To Assess — [N] listings to confirm

| # | Title | Company | 📍 Zone | 💰 Salary | Priority | Red Flags | Note |
|---|---|---|---|---|---|---|---|
| 1 | [title] | [company] | 🟢/🟡/🌐 | [salary or —] | [A/B/C] | [flags or —] | [1-line scan note] |
```

For each row offer three options:
- **[K] Keep** — accept scan's priority → promotes to `Potentially Apply` (B) or `To Apply` (A) in job_applications
- **[U] Upgrade** — override to higher priority (e.g. C→B, B→A)
- **[D] Dismiss** — move to `Dismissed` in job_applications

Zack can respond with one letter per row (e.g. `1K 2D 3U:A`) or one at a time.

For each confirmed row: INSERT into job_applications (Step 4a) + DELETE from review_queue (Step 4b).

If Group B is empty, skip this step.

---

## Step 6 — Manual Paste Loop (for remaining Group A rows)

For each Group A row that couldn't be auto-enriched, work through one at a time:

```
[N/M] **[Job Title]** @ [Company]
📍 [Location]  ·  💰 [Salary or "Not stated"]  ·  Source: [Source]
Missing: [missing_info values]
QUEUED note: [first line of Notes after "QUEUED:" or "UNREADABLE:"]
🔗 Job URL: [url or "Not available"]
📧 Gmail thread: [gmail_thread_url] ← always show, even if job_url exists (APEC alerts are only findable via Gmail)
```

> "Paste the full job description, or type `skip` to leave it queued, or `dismiss` to move it to Dismissed."

- JD pasted → re-rank (Step 3) → INSERT to job_applications + DELETE from review_queue → move to next.
- `skip` → leave in review_queue, move to next.
- `dismiss` → INSERT to job_applications as Dismissed → DELETE from review_queue → move to next.

Type `stop` at any point to halt and jump to final summary.

---

## Step 7 — Hard disqualifier fast-path

If enriched data reveals a clear disqualifier (Paris on-site, salary stated below €40K, unrelated function) — write to job_applications as Dismissed and tell the user in one sentence.

---

## Step 8 — Final Summary

```
## Review Queue Drainer Complete

### Group A — Needs Info
**Auto-processed:** [N]
**Manual paste resolved:** [N]
**Left in queue (skipped):** [N]

### Group B — To Assess
**Confirmed:** [N]
**Left in queue:** [N]

### Outcomes (job_applications)
**Moved to `To Apply`:** [N] — [titles]
**Moved to `Potentially Apply`:** [N] — [titles]
**Moved to `Dismissed`:** [N]

### Notable finds
[Any Priority A promotions worth flagging]
```

---

## Step 9 — France Travail Log entry

After the final summary, silently create one FT Log entry:

```sql
INSERT INTO france_travail_log
(action, date, categorie, priorite, statut_declaration, source, notes)
VALUES ($1, CURRENT_DATE, 'Administratif', 'Optionnel', 'À déclarer', 'Manuel', $2)
RETURNING id
```
Pass `['Revue de [total] offres — [X] retenues, [Y] rejetées', 'Revue /job-review : [A] Needs Info + [B] To Assess traités']`.

Confirm: `📋 FT Log : revue de listings enregistrée (Optionnel — À déclarer).`

---

## Notes on Behavior

- Be critical, not agreeable. Follow the same "no soft-pedalling" rule as `/job-search`.
- Never mark a row as `To Apply` or `Potentially Apply` without a CV Approach selection.
- Process one manual-paste row at a time so the user can interject between listings.
