---
description: Morning digest — shows what last night's scan found and the current pipeline state. Run this first every session before /job-review or /job-apply. Trigger with /job-morning.
argument-hint: blank
allowed-tools: mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-search
---

## Step 0 — Load config

Fetch User Profile page `3452fc3ca02a811ab75af9805f50ef8b`. Extract `job_applications_db_id` from Section 7.

## Step 1 — Fetch recent listings

Fetch the Job Applications DB. Find all rows where **Date Added = today or yesterday** (the scan window). Group them by Status.

Also get total counts per Status across the full DB for the pipeline snapshot.

## Step 2 — Output

```
════════════════════════════════════
MORNING DIGEST — [Today's date]
════════════════════════════════════

LAST NIGHT'S SCAN
─────────────────
New listings found : X
  → Potentially Apply : X  (worth a look this week)
  → Needs Info        : X  (run /job-review to complete)
  → To Assess         : X  (pending review)
  → Dismissed         : X  (auto-screened out)

PIPELINE SNAPSHOT
─────────────────
Needs Info       : X
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
[One line — e.g. "Run /job-review — X listings need info" or
"Run /job-apply — X roles are ready for documents" or
"Nothing urgent — pipeline is clean"]
════════════════════════════════════
```

If zero new listings today or yesterday, say so and show only the pipeline snapshot.

The suggested next step should be the single most impactful action:
- Needs Info > 0 → `/job-review`
- To Apply > 0 → `/job-apply`
- Potentially Apply > 3 → `/job-review-weekly` (holding queue getting full)
- Otherwise → "Pipeline clean — focus on applications in progress"
