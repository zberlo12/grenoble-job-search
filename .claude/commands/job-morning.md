---
description: Morning digest — shows what last night's scan found and the current pipeline state. Run this first every session before /job-review or /job-apply. Trigger with /job-morning.
argument-hint: blank
allowed-tools: mcp__claude_ai_Gmail__search_threads, mcp__claude_ai_Gmail__get_thread, Bash
---

## Step 0 — Load Config

Read `.claude/rules/db.md` and use `scripts/db.js` for all database access below.

Run `cat config.json` via Bash and extract `user.profile_id` → USER_PROFILE.

## Step 1 — Read pipeline state + check for application responses

Run all three data fetches in parallel:

**A. Last scan (scan_archive):**

```sql
SELECT scan_date, total_found, potentially_apply, needs_info, to_assess, dismissed
FROM scan_archive
WHERE scan_date >= CURRENT_DATE - INTERVAL '2 days'
ORDER BY scan_date DESC
LIMIT 1
```

If a row is found → use `total_found`, `potentially_apply`, `needs_info`, `to_assess`, `dismissed` directly. Note the `scan_date` in the output so it's clear if the data is from yesterday or the day before.

If no rows → set all scan counts to "?" and show:
`⚠️ No scan data found — the nightly scan may not have run yet. Run /job-search-daily-scan manually.`

**B. Review Queue counts (Supabase):**

```sql
SELECT status, count(*)::int AS count FROM review_queue WHERE user_profile = '<USER_PROFILE>' GROUP BY status
```

Extract counts for: `Needs Info` and `To Assess`.

**C. Pipeline snapshot (Supabase — active only):**

```sql
SELECT status, count(*)::int AS count FROM job_applications
WHERE status NOT IN ('Dismissed', 'Rejected')
  AND user_profile = '<USER_PROFILE>'
GROUP BY status
```

Collect counts for: Potentially Apply, To Apply, Docs Ready, Applied, Interview, On Hold, Needs Info. Dismissed and Rejected are excluded — they are dead rows and add noise.

**D. Application response check:**

```sql
SELECT id, company, job_title, date_applied, date_added, notes, gmail_thread_url
FROM job_applications
WHERE status IN ('Applied', 'Interview')
  AND user_profile = '<USER_PROFILE>'
  AND COALESCE(date_applied, date_added) < CURRENT_DATE - INTERVAL '7 days'
```

For each row, search Gmail in parallel:
```
"[Company]" (entretien OR interview OR retenu OR refusé OR rejected OR suite OR félicitations OR offer) after:YYYY/MM/DD -label:jobs
```
Use `date_applied` (or `date_added` as fallback) formatted as `YYYY/MM/DD` for the `after:` filter.

**Classify response:**
- Interview → entretien, interview, rendez-vous, call, visio
- Offer → offre, proposition, félicitations, offer letter
- Rejected → refusé, ne correspond pas, other candidates, poursuivons sans
- Unknown → include for manual review

**If a response is found — update Supabase:**
```sql
UPDATE job_applications
SET status=$1, date_response=CURRENT_DATE,
    notes=COALESCE(notes,'')||$2,
    gmail_thread_url=COALESCE(NULLIF(gmail_thread_url,''),$3)
WHERE id=$4
```

**Auto-expiry:**
```sql
UPDATE job_applications
SET status='Dismissed',
    notes=COALESCE(notes,'')||' | Auto-expired: no response after 60 days'
WHERE status='Applied'
  AND date_applied < CURRENT_DATE - INTERVAL '60 days'
  AND COALESCE(notes,'') NOT LIKE '%Auto-expired%'
  AND user_profile = '<USER_PROFILE>'
RETURNING id, job_title, company
```

**Follow-up nudge:** for Applied rows 14–45 days old with no response found and no "relance"/"follow-up sent" in notes → flag under "Consider Following Up" in the digest. Do NOT update status or notes.

**Human contact detection:** If a response is found and the sender appears to be a named human (not noreply/auto/careers@ address), upsert into `networking_contacts`:
```sql
INSERT INTO networking_contacts (name, company, role, email, last_contact, source, notes, user_profile)
VALUES ($1, $2, $3, $4, CURRENT_DATE, 'Application response', $5, $6)
ON CONFLICT (email) DO UPDATE SET last_contact=EXCLUDED.last_contact,
  notes=COALESCE(networking_contacts.notes,'')||' | '||EXCLUDED.notes
RETURNING id
```

## Step 2 — Output

```
════════════════════════════════════
MORNING DIGEST — [Today's date]
════════════════════════════════════

LAST NIGHT'S SCAN
─────────────────
New listings found : X
  → Potentially Apply : X  (worth a look this week)
  → Needs Info        : X  (queued for /job-review)
  → To Assess         : X  (queued for /job-review)
  → Dismissed         : X  (auto-screened out)

REVIEW QUEUE
────────────────────────────────────
Needs Info   : X  (enrichment needed)
To Assess    : X  (confirmation needed)
────────────────────────────────────
Total pending: X  ← run /job-review

PIPELINE SNAPSHOT
─────────────────
Potentially Apply: X
To Apply         : X  ← ready for documents
Docs Ready       : X
Applied          : X
Interview        : X
On Hold          : X
─────────────────
Active total     : X

[Only include if Step 1D found responses:]
APPLICATION UPDATES
───────────────────
• [Job Title] @ [Company] — [new status] (was Applied)
• [Job Title] @ [Company] — Unknown response — review Gmail thread

[Only include if Step 1D found follow-up candidates:]
CONSIDER FOLLOWING UP
─────────────────────
• [Job Title] @ [Company] — applied [N] days ago

SUGGESTED NEXT STEP
────────────────────
[One line — e.g. "Run /job-review — X listings pending" or
"Run /job-apply — X roles are ready for documents" or
"Nothing urgent — pipeline is clean"]
════════════════════════════════════
```

If no scan_archive row was found, show the ⚠️ warning in the LAST NIGHT'S SCAN section and still show the Review Queue and pipeline snapshot.

The suggested next step should be the single most impactful action:
- Review Queue total > 0 → `/job-review` (takes priority over everything else)
- To Apply > 0 → `/job-apply`
- Potentially Apply > 3 → `/job-review-weekly` (holding queue getting full)
- Otherwise → "Pipeline clean — focus on applications in progress"
