---
description: Drain the "Needs Info" queue in the Job Applications Notion database. Walks through each queued listing, auto-fetches the full job description where possible (Indeed MCP, Gmail thread re-read, or generic WebFetch for non-LinkedIn URLs), otherwise asks the user to paste it, then re-ranks the listing using the /job-search criteria and updates the Notion row. Trigger with /job-review.
argument-hint: Optional — pass a row count limit (e.g. "5") to process only the N oldest queued listings
allowed-tools: mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-update-page, mcp__claude_ai_Indeed__get_job_details, mcp__claude_ai_Gmail__gmail_read_thread, WebFetch
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

Then try to auto-enrich using the following ladder. Stop as soon as any rung returns a usable JD with the fields needed to clear `Missing Info`.

**Context-hygiene rule (applies to every rung):** If a fetched page exceeds ~8K characters, extract only the structured fields (salary, location, hybrid/remote, scope, language, contract type, seniority) and discard the rest. Do NOT preserve full JD text in conversation context — the goal is to enrich the Notion row, not to archive the listing.

**Rung 1 — Indeed URL**
If `Job URL` matches `*indeed.com/*` or `to.indeed.com/*` (shortlink), call `mcp__claude_ai_Indeed__get_job_details` with the URL. Use the returned salary, description, and company details.

**Rung 2 — Gmail thread re-read**
If `Gmail Thread URL` is set, extract the thread ID (last segment after `#all/`) and call `mcp__claude_ai_Gmail__gmail_read_thread`. Note: the daily scan already read this thread once, so rung 2 rarely adds new data on its own — only trust it if the thread body contains more than a one-line alert snippet.

**Rung 3 — LinkedIn short-circuit**
If `Job URL` is a `linkedin.com/*` URL, do NOT call WebFetch — LinkedIn reliably returns a login wall, so attempting it just burns a tool call. Go directly to Rung 5 and tell Zack:
> "This is a LinkedIn listing — LinkedIn blocks automated fetches. Paste the JD, type `skip` to leave it queued, or `dismiss` to move it to Dismissed."

**Rung 4 — WebFetch (non-LinkedIn URLs)**
If `Job URL` exists, is not a LinkedIn URL, and rungs 1–2 did not yield enough data, call `WebFetch` on the URL with this prompt:
> "Extract the full job description, salary, contract type, location, hybrid/remote policy, required seniority/experience level, and any language requirements. Return as structured fields only — no preserved full-text JD."

Expected behaviour by source:
- **Welcome to the Jungle** (`welcometothejungle.com/*`) — usually fetches cleanly.
- **APEC, Cadremploi, HelloWork** — usually fetchable.
- **Michael Page / Robert Half** — hit-and-miss (JS-rendered pages return empty).
- **Direct company career pages** — hit-and-miss; worth trying once.

Do NOT retry WebFetch on the same URL if the first call returns blocked, truncated, or empty content. Fall through to Rung 5.

**Rung 5 — Manual paste fallback**
If all previous rungs failed (or LinkedIn short-circuit triggered), ask Zack:
> "Auto-enrichment failed for this one (tried: [list of rungs attempted, or `LinkedIn — blocked`]). Paste the full job description, or type `skip` to leave it queued, or `dismiss` to move it to Dismissed."

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
