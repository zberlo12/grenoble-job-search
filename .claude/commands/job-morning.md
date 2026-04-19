---
description: Morning digest — shows what last night's scan found and the current pipeline state. Run this first every session before /job-review or /job-apply. Trigger with /job-morning.
argument-hint: blank
allowed-tools: mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-search
---

## Step 0 — Load config

Fetch User Profile page `3452fc3ca02a811ab75af9805f50ef8b`. Extract from Section 7:
- `job_applications_db_id` (data source ID for Job Applications DB)
- `review_queue_data_source_id` (data source ID for Review Queue DB)
- `daily_scans_archive_page_id` (parent page for scan subpages)

## Step 1 — Read last night's scan

Run all three data fetches in parallel:

**A. Scan subpage:**

The daily scan runs each morning and processes **yesterday's** emails — so the subpage is always titled with yesterday's date. Use `notion-search` to find a page titled exactly "Job Alert Scan — [yesterday's date in YYYY-MM-DD format]" under the Daily Scans archive page. If found, fetch it and read the digest content to extract:
- Total new listings found
- Counts by Status: Potentially Apply, Needs Info, To Assess, Dismissed

Also search for "Job Alert Scan — [two days ago]" in case the scan ran for an earlier date. If found, use it and note the date.

If no subpage exists for yesterday or the day before: set all scan counts to "?" and add a warning:
`⚠️ No scan subpage found for today or yesterday — the nightly scan may have failed. Check the Daily Scans archive in Notion or run /job-search-daily-scan manually.`

**B. Review Queue counts:**

Call `notion-fetch` on the Review Queue data source (`review_queue_data_source_id` from profile Section 7). Count rows by Status:
- `Needs Info` → needs enrichment before ranking
- `To Assess` → already ranked, awaiting confirm/override

**C. Pipeline snapshot:**

Use `notion-search` against the Job Applications DB (data source ID from profile Section 7) to get counts per Status. Query each active status: Potentially Apply, To Apply, Docs Ready, Applied, Interview, On Hold. Sum these for the Active total. (Dismissed, Rejected, Offer are excluded from active total.)

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

SUGGESTED NEXT STEP
────────────────────
[One line — e.g. "Run /job-review — X listings pending" or
"Run /job-apply — X roles are ready for documents" or
"Nothing urgent — pipeline is clean"]
════════════════════════════════════
```

If no scan subpage was found, show the ⚠️ warning in the LAST NIGHT'S SCAN section and still show the Review Queue and pipeline snapshot.

If the Review Queue fetch fails or returns no data, show `Review Queue: (unavailable)` and continue.

The suggested next step should be the single most impactful action:
- Review Queue total > 0 → `/job-review` (takes priority over everything else)
- To Apply > 0 → `/job-apply`
- Potentially Apply > 3 → `/job-review-weekly` (holding queue getting full)
- Otherwise → "Pipeline clean — focus on applications in progress"
