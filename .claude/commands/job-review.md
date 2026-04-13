---
description: Drain the "Needs Info" queue in the Job Applications Notion database. Sweeps all rows for auto-enrichment first (Indeed MCP, Gmail thread re-read, WebFetch for non-LinkedIn URLs), then batches any manual-paste rows at the end. Trigger with /job-review.
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

## Step 2 — Enrichment Sweep (silent — no user pauses)

Loop through every queued row. For each row, attempt auto-enrichment using the ladder below.
**Do not pause or ask Zack anything during this sweep.**

**Context-hygiene rule:** If a fetched page exceeds ~8K characters, extract only the structured fields (salary, location, hybrid/remote, scope, language, contract type, seniority) and discard the rest. Do NOT preserve full JD text in conversation context.

Try rungs in order. Stop as soon as one returns usable data.

**Rung 1 — Indeed URL**
If `Job URL` matches `*indeed.com/*` or `to.indeed.com/*`, resolve the shortlink if needed (follow WebFetch redirect to extract the `jk=` job ID), then call `mcp__claude_ai_Indeed__get_job_details` with the job ID.

**Rung 2 — Gmail thread re-read**
If `Gmail Thread URL` is set, extract the thread ID (last segment after `#all/`) and call `mcp__claude_ai_Gmail__gmail_read_thread`. Only trust this rung if the thread body contains more than a one-line alert snippet.

**Rung 3 — LinkedIn short-circuit**
If `Job URL` is a `linkedin.com/*` URL, skip rungs 4 entirely. Add this row to the **manual-paste list** with reason `LinkedIn — blocked`. Move to next row.

**Rung 4 — WebFetch (non-LinkedIn URLs)**
If `Job URL` exists and is not LinkedIn, call `WebFetch` on the URL:
> "Extract the full job description, salary, contract type, location, hybrid/remote policy, required seniority/experience level, and any language requirements. Return as structured fields only."

Do NOT retry if the first call returns blocked/truncated/empty. Fall through to manual list.

**If enrichment succeeded (rungs 1–4):**
- Re-rank immediately using Step 3 criteria.
- Update the Notion row (Step 4).
- Mark as auto-processed.

**If enrichment failed:**
- Add to the **manual-paste list**: `[Title] @ [Company] — [reason] 🔗 [URL if any]`
- Continue sweep. Do NOT stop here.

---

## Step 3 — Re-rank (apply after successful enrichment)

With the enriched information, apply the standard `/job-search` analysis:

- Location zone — reconfirm with full location data
- Role fit — seniority, function, English, company quality, contract
- Red flags — update the list
- Priority rating — assign final A / B / C / Skip

The rescue gate does NOT reapply in review — produce a final ranking.
If information is STILL missing after enrichment, mark as manual-paste list (not auto-processable).

---

## Step 4 — Update Notion Row (apply after re-ranking)

Call `mcp__claude_ai_Notion__notion-update-page` on the row ID with:

| Property | New value |
|---|---|
| `Priority` | final `A` / `B` / `C` (omit if moving to Dismissed) |
| `CV Approach` | final selection: `Standard` / `FP&A Focus` / `Cost Control Focus` / `Transformation Focus` |
| `Status` | `To Apply` (Priority A), `Potentially Apply` (Priority B), `Dismissed` (Priority C / declined), `Needs Info` (still missing data) |
| `Missing Info` | `"[]"` (clear it) unless status stays `Needs Info` |
| `Red Flags` | updated JSON array |
| `Salary` | fill in if enrichment revealed one |
| `Notes` | rewritten — strip `QUEUED:` prefix, replace with final 2–3 sentence analysis |

**Priority → Status mapping:**
- Priority A → `Status: To Apply`
- Priority B → `Status: Potentially Apply`
- Priority C → `Status: Dismissed`
- Skip → `Status: Dismissed`
- Still uncertain → `Status: Needs Info`

---

## Step 5 — Auto-processed Summary

After the sweep completes, output:

```
Auto-processed [N] rows. [M] rows need manual JD paste.

Successfully ranked:
- [Title] @ [Company] → Priority [X] → [Status]
- ...

Needs manual paste ([M] total):
1. [Title] @ [Company] — [reason: LinkedIn / WebFetch failed / no URL]  🔗 [URL if any]
2. ...
```

If M = 0, stop here and output the final summary (Step 8).

---

## Step 6 — Manual Paste Loop

Work through the manual-paste list one at a time. For each row:

Present:
```
[N/M] **[Job Title]** @ [Company]
📍 [Location]  ·  💰 [Salary or "Not stated"]  ·  Source: [Source]
Missing: [Missing Info values]
QUEUED note: [first line of Notes after "QUEUED:"]
🔗 [Job URL if available]
```

Then ask:
> "Paste the full job description, or type `skip` to leave it queued, or `dismiss` to move it to Dismissed."

- JD pasted → re-rank (Step 3) → update Notion (Step 4) → move to next row.
- `skip` → leave `Status: Needs Info`, move to next row.
- `dismiss` → update `Status: Dismissed`, move to next row.

At any point Zack can type `stop` to halt and jump to the final summary.

---

## Step 7 — Hard disqualifier fast-path

If enriched data reveals a clear disqualifier (Paris on-site, salary stated below €40K, unrelated function) — move straight to `Dismissed` and tell Zack in one sentence. Do not ask for confirmation.

---

## Step 8 — Final Summary

```
## Queue Review Complete

**Processed:** [N]
**Moved to `To Apply`:** [N] — [titles]
**Moved to `Potentially Apply`:** [N] — [titles]
**Moved to `Dismissed`:** [N]
**Left in `Needs Info`:** [N]

### Notable finds
[Any Priority A promotions worth flagging]
```

---

## Notes on Behavior

- Be critical, not agreeable. Follow the same "no soft-pedalling" rule as `/job-search`.
- Never mark a row as `To Apply` or `Potentially Apply` without an explicit CV Approach selection.
- Process one manual-paste row at a time so Zack can interject between listings.
