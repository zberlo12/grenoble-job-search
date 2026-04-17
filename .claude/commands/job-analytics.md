---
description: Pipeline health dashboard showing funnel metrics, source quality, response rates, and red flag patterns across your job search. Read-only — no updates. Trigger with /job-analytics.
argument-hint: Optional time window in days: "7", "30", or "90". Default: 30.
allowed-tools: mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-search
---

# Job Search Analytics

## Step 0 — Load User Profile

Search Notion for the page titled "⚙️ User Profile & Config" using `mcp__claude_ai_Notion__notion-search`, then fetch the first result using `mcp__claude_ai_Notion__notion-fetch`.
Extract into context: **Section 1** (user name), **Section 7** (Job Applications data source ID).
If no page is found, halt: "User Profile not found in Notion — run /job-user-setup to create your profile first."

---

## Step 1 — Fetch data

Parse `$ARGUMENTS` for a time window (7, 30, or 90 days). Default: 30.

Fetch the full Job Applications database (data source ID from profile Section 7).
Retrieve all rows — compute window-filtered and all-time metrics separately.

---

## Step 2 — Compute metrics

### Volume (rows where Date Added is within the window)
- Total listings found
- By source: LinkedIn / Indeed / Direct / Referral / Other
- By priority assigned: A / B / C / Needs Info / Dismissed/Skip

### Pipeline snapshot (all rows, current status)
Count rows in each status: Needs Info, To Assess, Potentially Apply, To Apply, Docs Ready, Applied, Interview, Offer, Rejected, Dismissed

### Funnel conversion (all rows with a Date Applied)
- **Application rate** = Applied+Interview+Offer+Rejected+Dismissed / (To Apply+Applied+Interview+Offer+Rejected+Dismissed)
- **Interview rate** = Interview+Offer / Applied+Interview+Offer+Rejected
- **Offer rate** = Offer / Interview+Offer (show only if >0)

### Speed (rows that have both dates)
- Average days from Date Added to Date Applied
- Average days from Date Applied to Date Response

### Top red flags (rows in window, Red Flags field)
Count occurrences of each flag value. Show top 3.

### Zone breakdown (rows in window)
Derive zone from Location field using profile Section 4 zone tables.
Count: Green / Yellow / Orange / Red / Remote.

### Market visibility (rows in window — includes Dismissed rows)
- Total found = all rows with Date Added in window (pursued + dismissed)
- Pursued = rows where Status ≠ "Dismissed" at point of writing
- Dismissed = rows where Status = "Dismissed"
- Pass rate = Pursued / Total × 100%

### Dismiss reason breakdown (Dismissed rows in window)
Count occurrences of each Red Flag value on rows with Status = "Dismissed". Show top 4.

### Alert performance (rows in window, grouped by Alert Keyword field)
For each distinct Alert Keyword value:
- Total rows with that keyword
- Pursued rows (Status ≠ "Dismissed")
- Pass rate = Pursued / Total
Sort by Total descending. Omit rows where Alert Keyword is blank.

---

## Step 3 — Output

```
## Job Search Analytics — Last [N] days  ([start] to [today])

### Volume
[N] listings found  ·  [N] written to pipeline  ·  [N] dismissed/skipped

Sources:  LinkedIn [N]  ·  Indeed [N]  ·  Direct [N]  ·  Other [N]
Priority: A [N]  ·  B [N]  ·  C [N]  ·  Needs Info [N]  ·  Dismissed [N]

### Pipeline (current state — all time)
Needs Info [N]  →  To Assess [N]  →  Potentially Apply [N]  →  To Apply [N]
→  Docs Ready [N]  →  Applied [N]  →  Interview [N]  →  Offer [N]
Rejected [N]  ·  Dismissed [N]

### Conversion
Application rate:  [N]%
Interview rate:    [N]%
[Offer rate: [N]% — only if applicable]
Avg days to apply:    [N]
Avg days to response: [N]

### Top Red Flags (last [N] days)
1. [flag] — [N] listings
2. [flag] — [N] listings
3. [flag] — [N] listings

### By Zone (last [N] days)
Green [N]  ·  Yellow [N]  ·  Orange [N]  ·  Red [N]  ·  Remote [N]

### Market Visibility (last [N] days)
[N] listings found in emails  ·  [N] pursued ([N]%)  ·  [N] dismissed ([N]%)

Top dismiss reasons:
1. [flag] — [N]
2. [flag] — [N]
3. [flag] — [N]

### Alert Performance (last [N] days)
| Alert Keyword | Found | Pursued | Pass rate |
|---|---|---|---|
| [keyword] | [N] | [N] | [N]% |
| [keyword] | [N] | [N] | [N]% |

[If any keyword has 0% pass rate: "⚠️ '[keyword]' has 0% pass rate — consider pausing or refining this alert."]
[If no Alert Keyword data yet: "Alert performance data will appear after the first daily scan runs."]

### Insight
[1–2 sentence observation — e.g.:]
- "Far location is your top red flag — [N] listings flagged. Check whether Orange-zone listings
  are being given a fair chance if hybrid is possible."
- "Your interview rate is 0% across [N] applications. You have [N] Applied rows older than 14
  days — run /job-status to check for responses and consider following up."
- "Pipeline is healthy — [N] A-priority listings ready to apply."
```
