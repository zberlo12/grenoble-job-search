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

**D. Awaiting status check (read-only count — no Gmail search, no writes):**

```sql
SELECT count(*)::int AS n FROM job_applications
WHERE status IN ('Applied', 'Interview')
  AND user_profile = '<USER_PROFILE>'
  AND COALESCE(date_applied, date_added) < CURRENT_DATE - INTERVAL '14 days'
```

This skill performs zero INSERTs and zero UPDATEs. Response detection, auto-expiry, follow-up nudges, and networking-contact upserts all live in `/job-status` now — this step only counts how many rows are old enough to be worth checking.

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

[Only include if Step 1D count > 0:]
AWAITING STATUS CHECK
──────────────────────
[N] applications 14+ days old — run /job-status

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
