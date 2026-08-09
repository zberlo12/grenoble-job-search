---
description: Drain the Review Queue — enriches Needs Info rows (auto-fetch + manual paste), then presents To Assess rows for confirm/override. Reads from the review_queue table (Supabase). Writes resolved rows to job_applications and deletes them from the queue. Trigger with /job-review.
argument-hint: Optional — pass a row count limit (e.g. "5") to process only the N oldest queued listings
allowed-tools: mcp__claude_ai_Indeed__get_job_details, mcp__claude_ai_Gmail__get_thread, WebFetch, Bash
---

# Job Review Queue Drainer

## Step 0 — Load Config

Read `.claude/rules/db.md` and use `scripts/db.js` for all database access below.

Run `cat config.json` via Bash and extract `user.name`, `user.profile_id` → USER_PROFILE, `user.salary_floor_apply`, `user.salary_floor_reject` → salary floors, `location_zones` → green/yellow/orange/red city lists.

---

> **Chrome extraction of `puppeteer_pending` rows** happens upstream in `/job-email-inbox` (and is checked again in `/job-search-daily-scan` Step 0b) — by the time a row reaches `review_queue`, it has already been through that pipeline. **UNREADABLE rows in review_queue** are legacy (pre-Chrome/Puppeteer) and fall through to the manual-paste loop (Step 6) since they cannot be auto-enriched.

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

Read `.claude/rules/scoring.md` §1 (Location Zones) and §3 (Priority Criteria) and apply them exactly with the enriched data, plus:

- Role fit — seniority, function, English, company quality, contract
- Red flags — update the list

The rescue gate (scoring.md §2) does NOT reapply in review — produce a final ranking per §3 (see scoring.md §6).
If information is STILL missing after enrichment, add to manual-paste list.

---

## Step 4 — Write to job_applications + Delete from review_queue

When a row is fully resolved:

**4a-pre — Duplicate check (hard stop):**
Before every INSERT, run:
```sql
SELECT id, job_title, status FROM job_applications
WHERE company ILIKE $1
  AND status IN ('Applied', 'Docs Ready', 'Interview', 'Offer')
  AND user_profile = $2
```
Pass `['%<company>%', user_profile]`.

If any row is returned → **do NOT insert**. Instead:
- DELETE the row from review_queue (clean up)
- Log: `⚠️ Skipped [company] — active application already exists (id=[id], "[job_title]", status=[status])`
- Continue to the next row

This catches re-listed roles and company-level duplicates before they pollute the pipeline.

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

## Step 4c — Silent JD Pre-fetch (Group B)

Run immediately after Group A, before presenting any confirmation table. **Do not pause or ask the user anything.**

For each Group B row, attempt JD fetch using the same rung ladder as Step 2:
- **Rung 1:** `job_url` contains `jk=` → `mcp__claude_ai_Indeed__get_job_details`
- **Rung 2:** `job_url` exists, not LinkedIn, not null/"Not available" → WebFetch
- **Rung 3:** `gmail_thread_url` set → `mcp__claude_ai_Gmail__get_thread` (only if substantive JD content, not a digest subject line)
- **Rung 4:** LinkedIn or all rungs fail → mark as `jd_blocked`

On success, save immediately:
```sql
UPDATE review_queue SET job_description = $1 WHERE id = $2
```

Print one summary line before the table: `JD pre-fetch: [N] fetched · [M] blocked (LinkedIn/404) · [P] no URL`

---

## Step 5 — Group B: To Assess Confirmation Pass

After Group A and the JD pre-fetch are complete, present all Group B (To Assess) rows as a numbered comparison table:

```
## To Assess — [N] listings

| # | Title | Company | 📍 Zone | 💰 Salary | Priority | Red Flags | JD | Note | 🔗 Job | 📧 Gmail |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | [title] | [company] | 🟢/🟡/🌐 | [salary or —] | [A/B/C] | [flags or —] | ✓ / ⚠ blocked / — | [1-line scan note] | [link](job_url) or — | [Gmail](gmail_thread_url) or — |
```

**JD column:** `✓` = fetched and saved · `⚠ blocked` = LinkedIn or fetch failed · `—` = no URL available

**Link columns — MANDATORY:** Always render BOTH `🔗 Job` and `📧 Gmail` as separate columns in every table. `🔗 Job` = `[link](job_url)` or `—`. `📧 Gmail` = `[Gmail](gmail_thread_url)` or `—`. Never merge into one column. Never use one as a fallback for the other.

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

| # | Title | Company | 📍 Zone | Note | 🔗 Job | 📧 Gmail |
|---|---|---|---|---|---|---|
| 1 | [title] | [company] | [zone] | Operational role | [link](job_url) or — | [Gmail](gmail_thread_url) or — |
```

Ask the same question — apply / hold / dismiss. Default is dismiss.
For each row: INSERT into job_applications (Step 4a) + DELETE from review_queue (Step 4b).
If no pre-filtered operational rows: skip this section.

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

If enriched data reveals a clear disqualifier per `.claude/rules/scoring.md` §4 (Red-zone on-site, salary below `user.salary_floor_reject`, unrelated function) — write to job_applications as Dismissed and tell the user in one sentence.

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

Next: run /job-shortlist to review the Potentially Apply holding queue, or /job-apply to draft documents for To Apply rows.
```

---

## Step 9 — France Travail Log entry

After the final summary, silently create one FT Log entry:

```sql
INSERT INTO france_travail_log
(action, date, categorie, priorite, statut_declaration, source, notes, user_profile)
VALUES ($1, CURRENT_DATE, 'Administratif', 'Optionnel', 'A declarer', 'Manuel', $2, $3)
RETURNING id
```
Pass `['Revue de [total] offres — [X] retenues, [Y] rejetées', 'Revue /job-review : [A] Needs Info + [B] To Assess traités', USER_PROFILE]`.

Confirm: `📋 FT Log : revue de listings enregistrée (Optionnel — A declarer).`

---

## Notes on Behavior

- Be critical, not agreeable. Follow the same "no soft-pedalling" rule as `/job-search`.
- Never mark a row as `To Apply` or `Potentially Apply` without a CV Approach selection.
- Process one manual-paste row at a time so the user can interject between listings.
