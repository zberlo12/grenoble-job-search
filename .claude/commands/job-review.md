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
- `user.profile_id` → USER_PROFILE
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
       alert_keyword, notes, english
FROM review_queue
WHERE user_profile = $1
ORDER BY
  CASE status WHEN 'Needs Info' THEN 1 ELSE 2 END,
  date_added ASC
```

`job_description` is intentionally excluded here — it can be 4K chars per row and is rarely needed for ranking decisions. Fetch it on-demand only when a user pastes a JD in the manual-paste loop (Step 6):
```sql
SELECT job_description FROM review_queue WHERE id = $1
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

**Pre-filter — skip enrichment immediately if ANY of:**
- `notes` contains `UNREADABLE` — HTML-only email, no URL to enrich from
- `notes` contains `OPERATIONAL ROLE` — enrichment won't change routing; needs human judgment
- `job_url` is null, `'Not available'`, or a `linkedin.com` URL — all rungs will fail

For `UNREADABLE` or `LinkedIn — blocked` rows: add directly to the manual-paste list. Do not attempt any rung.
For `OPERATIONAL ROLE` rows: add to the **operational-roles list** (presented in a K/U/D table at the end of Step 5 — not manual-paste). Do not attempt any rung.

**Context-hygiene rule:** If a fetched page exceeds ~8K characters, extract only the structured fields (salary, location, hybrid/remote, scope, language, contract type, seniority) and discard the rest.

**Circuit breaker:** Track `indeed_failures` counter (starts at 0). After 2 consecutive Indeed API failures in this session, set `indeed_available = false` and skip Rung 1 for all remaining rows. Log once: "Indeed API unavailable — skipping for remaining rows."

**Rung 1 — Indeed URL**
If `job_url` contains `jk=` AND `indeed_available` is true, extract the job ID and call `mcp__claude_ai_Indeed__get_job_details`. On failure, increment `indeed_failures`; on success, reset `indeed_failures` to 0.

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
 notes, english, job_description, user_profile)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
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

After Group A is fully processed, present all Group B (To Assess) rows as a numbered comparison table:

```
## To Assess — [N] listings

| # | Title | Company | 📍 Zone | 💰 Salary | Priority | Red Flags | Note | 🔗 |
|---|---|---|---|---|---|---|---|---|
| 1 | [title] | [company] | 🟢/🟡/🌐 | [salary or —] | [A/B/C] | [flags or —] | [1-line scan note] | [link](url) or [Gmail](gmail_thread_url) |
```

**Link column rule:** Prefer `job_url` as `[link](url)`. If null or "Not available", fall back to `[Gmail](gmail_thread_url)`. Only show `—` if both are null.

Ask:
> "Which numbers do you want to **apply to**? List them (e.g. `1,3`) or type `all` / `none`.
> The rest will be **dismissed** unless you add `hold` to keep them in Potentially Apply (e.g. `1,3 hold`)."

Parse response:
- Numbers → those rows → `status = 'To Apply'`
- `all` → every row → `status = 'To Apply'`
- `none` → no rows promoted
- `hold` suffix → unpromoted rows → `status = 'Potentially Apply'`
- Default (no `hold`) → unpromoted rows → `status = 'Dismissed'`

For each row: INSERT into job_applications (Step 4a) + DELETE from review_queue (Step 4b).
If Group B is empty, skip this step.

### Operational Roles (from pre-filter)

If any Group A rows were pre-filtered as `OPERATIONAL ROLE`, present them in the same numbered table format after the To Assess pass:

```
## Operational Roles — [N] for review

| # | Title | Company | 📍 Zone | Note | 🔗 |
|---|---|---|---|---|---|
| 1 | [title] | [company] | [zone] | Operational role | [link](url) or [Gmail](gmail_thread_url) |
```

Ask the same question — apply / hold / dismiss. Default is dismiss.
For each row: INSERT into job_applications (Step 4a) + DELETE from review_queue (Step 4b).
If no pre-filtered operational rows: skip this section.

---

## Step 5b — Potentially Apply Promotion Pass

After the queue is fully drained, fetch all `Potentially Apply` rows from the main pipeline for a final go/no-go pass — this replaces the need for a separate `/job-review-weekly` skill.

```sql
SELECT id, job_title, company, location, salary, priority, red_flags, notes, job_url, gmail_thread_url, date_added
FROM job_applications
WHERE status = 'Potentially Apply'
  AND user_profile = $1
ORDER BY CASE priority WHEN 'A' THEN 1 WHEN 'B' THEN 2 ELSE 3 END, date_added ASC
```

If no rows: skip this step.

Present as a numbered comparison table:

```
## Potentially Apply — [N] listings

| # | Title | Company | 📍 Zone | 💰 Salary | Priority | Red Flags | Note | 🔗 |
|---|---|---|---|---|---|---|---|---|
| 1 | [title] | [company] | 🟢/🟡/🌐 | [salary or —] | [B/C] | [flags or —] | [1-line note] | [link](url) or [Gmail](gmail_thread_url) |
```

**Link column rule:** Prefer `job_url` as `[link](url)`. If null or "Not available", fall back to `[Gmail](gmail_thread_url)`. Only show `—` if both are null.

Ask:
> "Which numbers do you want to promote to **To Apply**? List them (e.g. `1,3`) or type `all` / `none`.
> The rest will be **dismissed** unless you add `hold` to leave them in Potentially Apply (e.g. `1,3 hold`)."

Parse response:
- Numbers → those rows → `status = 'To Apply'`
- `all` → every row → `status = 'To Apply'`
- `none` → no rows promoted
- `hold` suffix (e.g. `1,3 hold`) → unpromoted rows stay `Potentially Apply`
- Default (no `hold`) → unpromoted rows → `status = 'Dismissed'`

Apply changes:
- Promote: `UPDATE job_applications SET status='To Apply' WHERE id=$1`
- Dismiss: `UPDATE job_applications SET status='Dismissed' WHERE id=$1`
- Hold: no DB write needed

Include Potentially Apply outcomes in the Step 8 final summary.

---

## Step 5c — To Apply JD Completeness Gate

**This step is mandatory before showing the To Apply queue.** You cannot draft tailored documents without a job description. Run this check every time the To Apply queue is about to be presented, whether triggered by the user asking to review applications or as part of this skill's natural flow.

```sql
SELECT id, job_title, company, source, job_url, gmail_thread_url
FROM job_applications
WHERE status = 'To Apply'
  AND user_profile = $1
  AND (job_description IS NULL OR job_description = '')
ORDER BY CASE priority WHEN 'A' THEN 1 WHEN 'B' THEN 2 ELSE 3 END, date_added ASC
```

If no rows are missing JDs: skip to Step 5d.

**For each row missing a JD, attempt enrichment in order:**

- **Rung 1 — Indeed URL:** If `job_url` contains `jk=`, call `mcp__claude_ai_Indeed__get_job_details`.
- **Rung 2 — WebFetch:** If `job_url` exists and is not LinkedIn / null / "Not available", call WebFetch to extract the full JD.
- **Rung 3 — Gmail thread:** If `gmail_thread_url` is set, call `mcp__claude_ai_Gmail__get_thread`. Only use if the body contains substantive JD content, not just a digest subject line.
- **Rung 4 — Manual paste:** If all rungs fail, present the row one at a time:

```
[N/M missing JDs] **[Job Title]** @ [Company]
🔗 Job URL: [url or "Not available"]
📧 Gmail: [gmail_thread_url]
```

> "Paste the full job description so I can draft tailored documents, or type `skip` to leave this one out of the document sprint."

- JD pasted → `UPDATE job_applications SET job_description = $1 WHERE id = $2`
- `skip` → leave null, continue (row will be flagged "JD needed" in the table)

If enrichment succeeds at any rung, save immediately:
```sql
UPDATE job_applications SET job_description = $1 WHERE id = $2 AND user_profile = $3
```

---

## Step 5d — To Apply Queue Review

After the JD gate, fetch all `To Apply` rows and present as a numbered comparison table with a **My Suggestion** column:

```sql
SELECT id, job_title, company, location, salary, priority, cv_approach,
       red_flags, notes, job_url, gmail_thread_url, job_description, date_added
FROM job_applications
WHERE status = 'To Apply' AND user_profile = $1
ORDER BY CASE priority WHEN 'A' THEN 1 WHEN 'B' THEN 2 ELSE 3 END, date_added ASC
```

```
## To Apply — [N] listings

| # | Title | Company | Zone | Salary | Priority | My Suggestion | Link |
|---|---|---|---|---|---|---|---|
| 1 | [title] | [company] | 🟢/🟡/🌐 | [salary or —] | [A/B/C] | [suggestion + 1-line reason] | [link] or [Gmail] |
```

**Suggestion rules:**
- Priority A → **Apply now**
- Priority B, confirmed salary above floor, CDI → **Apply now**
- Priority B, salary gap / FTC / location concern → **Apply** with caveat noted
- Priority C → **Apply** only if user explicitly added it; otherwise **Reconsider**
- JD missing (skipped in 5c) → **Reconsider — JD needed before drafting**
- Function scope unclear → **Reconsider — verify JD first**

After presenting the table:
> "These are my top picks for documents. Tell me which ones you disagree with and I'll adjust — or confirm the list and we'll hand off to `/job-apply` one by one."

For staffing-agency submissions with no cover letter required (Michael Page Interim, LTd, etc.): note "Standard CV only — no CL needed" in the suggestion column.

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

### Potentially Apply Pass
**Upgraded to `To Apply`:** [N] — [titles or "none"]
**Dismissed:** [N]
**Left as `Potentially Apply`:** [N]

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
