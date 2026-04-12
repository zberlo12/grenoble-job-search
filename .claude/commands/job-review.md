---
description: Drain the "Needs Info" queue in the Job Applications Notion database. Walks through each queued listing, auto-fetches the full job description where possible (Indeed, Gmail thread), otherwise asks the user to paste it, then re-ranks the listing using the /job-search criteria and updates the Notion row. Trigger with /job-review.
argument-hint: Optional — pass a row count limit (e.g. "5") to process only the N oldest queued listings
allowed-tools: mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-update-page, mcp__claude_ai_Indeed__get_job_details, mcp__claude_ai_Gmail__gmail_read_thread
---

# Job Review Queue Drainer

You are helping Zack (senior Finance Director / FP&A, Grenoble-based) work through the queue of
job listings that the daily scan flagged as "Needs Info" — plausible matches where salary,
hybrid policy, full scope, or company name was missing from the source alert.

Your goal: enrich each queued row with the missing information, re-rank it using the
standard `/job-search` criteria, and update the Notion row so it moves out of the queue.

---

## Step 1 — Fetch the Queue

Call `mcp__claude_ai_Notion__notion-fetch` on the Job Applications data source:

```
collection://73c7671a-f600-40a1-807a-83375c3160a9
```

Filter the returned rows client-side to `Status = "Needs Info"`. Sort oldest first by `Date Added`.

If `$ARGUMENTS` is a number, limit to that many rows. Otherwise process all of them.

If the queue is empty, tell Zack "Queue is empty — nothing to review" and stop.

---

## Step 2 — For Each Queued Row

Present the row to Zack in this format:

```
[N/total] **[Job Title]** @ [Company]
📍 [Location]  ·  💰 [Salary or "Not stated"]  ·  Source: [Source]
Missing: [Missing Info values, comma-separated]
QUEUED note: [first line of Notes after "QUEUED:"]
🔗 [Job URL if available]
```

Then try to auto-enrich:

1. **If `Job URL` is an Indeed URL** — call `mcp__claude_ai_Indeed__get_job_details` with the URL.
   Use the returned salary, description, and company details.
2. **If `Gmail Thread URL` is set** — extract the thread ID from the URL (last segment after `#all/`)
   and call `mcp__claude_ai_Gmail__gmail_read_thread` to re-read the original alert thread.
3. **If neither auto-source works** — ask Zack:
   > "No auto-source available for this one. Paste the full job description, or type `skip` to leave it queued, or `dismiss` to move it to Dismissed."

---

## Step 3 — Re-rank

With the enriched information, apply the standard `/job-search` analysis:

- Step 2 (Location zone) — reconfirm with full location data
- Step 3 (Role fit) — seniority, function, English, company quality, contract
- Step 4 (Red flags) — update red flag list
- Step 5b (Priority rating) — assign final A / B / C / Skip

The rescue gate does NOT reapply in review — the whole point of this step is to produce a final ranking.
If information is STILL missing after enrichment attempts, ask Zack directly for what's needed.

---

## Step 4 — Update the Notion Row

Call `mcp__claude_ai_Notion__notion-update-page` on the row ID with:

| Property | New value |
|---|---|
| `Priority` | final `A` / `B` / `C` (omit if moving to Dismissed) |
| `CV Approach` | final selection from `Standard` / `FP&A Focus` / `Cost Control Focus` / `Transformation Focus` |
| `Status` | `To Apply` (if worth pursuing), `Dismissed` (if Zack declines), or `Needs Info` (if Zack said `skip`) |
| `Missing Info` | `"[]"` (clear it) unless the status stays `Needs Info` |
| `Red Flags` | updated JSON array based on the full information |
| `Salary` | fill in if the enrichment revealed one |
| `Notes` | rewritten — strip the `QUEUED:` prefix and replace with the final 2–3 sentence analysis |

**Priority mapping for final status:**
- Priority A or B + Zack wants to pursue → `Status: To Apply`
- Priority C or Zack declines → `Status: Dismissed`
- Still uncertain → `Status: Needs Info` (leave in queue)

---

## Step 5 — Progress to Next Row

After updating, move to the next queued row. Repeat Steps 2–4.

At any point, Zack can type `stop` and you should stop processing and give a summary.

---

## Step 6 — Final Summary

After processing all rows (or stopping early), output:

```
## Queue Review Complete

**Processed:** [N]
**Moved to `To Apply`:** [N] — [titles]
**Moved to `Dismissed`:** [N]
**Left in `Needs Info`:** [N]

### Notable finds
[Any Priority A promotions worth flagging]
```

---

## Notes on Behavior

- Be critical, not agreeable. Follow the same "no soft-pedalling" rule as `/job-search`.
- If a row's auto-enriched data reveals a hard disqualifier (e.g. Paris on-site, €30K salary),
  move it straight to `Dismissed` and tell Zack why in one sentence.
- Never mark a row as `To Apply` without an explicit CV Approach selection.
- Process one row at a time so Zack can interject between listings.
