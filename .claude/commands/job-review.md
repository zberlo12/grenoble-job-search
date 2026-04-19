---
description: Drain the Review Queue — enriches Needs Info rows (auto-fetch + manual paste), then presents To Assess rows for confirm/override. Reads from the dedicated Review Queue DB (not the main Job Applications DB). Writes resolved rows to the main DB and deletes them from the queue. Trigger with /job-review.
argument-hint: Optional — pass a row count limit (e.g. "5") to process only the N oldest queued listings
allowed-tools: mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-update-page, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Indeed__get_job_details, mcp__claude_ai_Gmail__gmail_read_thread, WebFetch
---

# Job Review Queue Drainer

## Step 0 — Load User Profile

Search Notion for the page titled "⚙️ User Profile & Config" using `mcp__claude_ai_Notion__notion-search`, then fetch the first result using `mcp__claude_ai_Notion__notion-fetch`.
Extract into context:
- **Section 1** (user name)
- **Section 7**: `Job Applications data source ID` and `Review Queue data source ID`

If no page is found, halt: "User Profile not found in Notion — run /job-user-setup to create your profile first."

---

You are helping the user (name from profile) work through the Review Queue — a small staging table holding listings the daily scan flagged as either:
- **Needs Info** — plausible matches where salary, hybrid policy, full scope, or company name was missing
- **To Assess** — fully ranked listings (B/C priority) awaiting confirmation before entering the main pipeline

Your goal: enrich Needs Info rows and confirm To Assess rows, then write resolved entries to the main Job Applications DB and clear them from the Review Queue.

---

## Step 1 — Fetch the Queue

Call `mcp__claude_ai_Notion__notion-fetch` on the **Review Queue data source** (ID from profile Section 7 — "Review Queue data source ID").

Because the Review Queue is small, this returns ALL rows reliably — no search needed.

Split rows into two groups:
- **Group A — Needs Info**: `Status = "Needs Info"` — need enrichment before ranking
- **Group B — To Assess**: `Status = "To Assess"` — already ranked by the scan, need confirmation

Sort each group oldest first by `Date Added`.

If `$ARGUMENTS` is a number, limit Group A to that many rows (Group B always shown in full).

If both groups are empty, say "Review Queue is empty — nothing to review" and stop.

---

## Step 2 — Enrichment Sweep for Group A (silent — no user pauses)

Loop through every Group A (Needs Info) row. For each row, attempt auto-enrichment using the ladder below.
**Do not pause or ask the user anything during this sweep.**

**Context-hygiene rule:** If a fetched page exceeds ~8K characters, extract only the structured fields (salary, location, hybrid/remote, scope, language, contract type, seniority) and discard the rest. Do NOT preserve full JD text in conversation context.

Try rungs in order. Stop as soon as one returns usable data.

**Rung 1 — Indeed URL**
If `Job URL` matches `*indeed.com/*` or `to.indeed.com/*`, resolve the shortlink if needed (follow WebFetch redirect to extract the `jk=` job ID), then call `mcp__claude_ai_Indeed__get_job_details` with the job ID.

**Rung 2 — Gmail thread re-read**
If `Gmail Thread URL` is set, extract the thread ID (last segment after `#all/`) and call `mcp__claude_ai_Gmail__gmail_read_thread`. Only trust this rung if the thread body contains more than a one-line alert snippet.

**Rung 3 — LinkedIn short-circuit**
If `Job URL` is a `linkedin.com/*` URL, skip rung 4 entirely. Add this row to the **manual-paste list** with reason `LinkedIn — blocked`. Move to next row.

**Rung 4 — WebFetch (non-LinkedIn URLs)**
If `Job URL` exists and is not LinkedIn, call `WebFetch` on the URL:
> "Extract the full job description, salary, contract type, location, hybrid/remote policy, required seniority/experience level, and any language requirements. Return as structured fields only."

Do NOT retry if the first call returns blocked/truncated/empty. Fall through to manual list.

**If enrichment succeeded (rungs 1–4):**
- Re-rank immediately using Step 3 criteria.
- Write resolved row to main DB + delete from Review Queue (Step 4).
- Mark as auto-processed.

**If enrichment failed:**
- Add to the **manual-paste list**: `[Title] @ [Company] — [reason] 🔗 [URL if any]`
- Continue sweep. Do NOT stop here.

---

## Step 3 — Re-rank (apply after successful enrichment of a Needs Info row)

With the enriched information, apply the standard `/job-search` analysis:

- Location zone — reconfirm with full location data
- Role fit — seniority, function, English, company quality, contract
- Red flags — update the list
- Priority rating — assign final A / B / C / Skip

The rescue gate does NOT reapply in review — produce a final ranking.
If information is STILL missing after enrichment, mark as manual-paste list (not auto-processable).

---

## Step 4 — Write to Main DB + Delete from Review Queue

When a row is fully resolved (either auto-enriched or manually pasted), do two things:

**4a — Create in main Job Applications DB:**
Call `mcp__claude_ai_Notion__notion-create-pages` with:
```
parent: { type: "data_source_id", data_source_id: "[Job Applications data source ID from profile Section 7]" }
```

Properties to write (carry forward all fields from the Review Queue row, update as needed):

| Property | New value |
|---|---|
| `Job Title` | from Review Queue row |
| `Company` | from Review Queue row |
| `Source` | from Review Queue row |
| `Location` | from Review Queue row (updated if enrichment revealed more) |
| `Salary` | filled in if enrichment revealed one |
| `Priority` | final `A` / `B` / `C` (omit if moving to Dismissed) |
| `CV Approach` | final selection: `Standard` / `FP&A Focus` / `Cost Control Focus` / `Transformation Focus` |
| `Status` | `To Apply` (A), `Potentially Apply` (B), `Dismissed` (C / declined / skip) |
| `date:Date Added:start` | carry forward from Review Queue row |
| `Job URL` | from Review Queue row |
| `Gmail Thread URL` | from Review Queue row |
| `Red Flags` | updated JSON array |
| `Missing Info` | `"[]"` (cleared) |
| `Alert Keyword` | from Review Queue row |
| `Notes` | rewritten — strip `QUEUED:` prefix, replace with final 2–3 sentence analysis |
| `English` | `"__YES__"` or `"__NO__"` based on enriched data |

**Priority → Status mapping:**
- Priority A → `Status: To Apply`
- Priority B → `Status: Potentially Apply`
- Priority C → `Status: Dismissed`
- Skip → `Status: Dismissed`

**4b — Delete from Review Queue:**
Call `mcp__claude_ai_Notion__notion-update-page` on the Review Queue row ID with:
- `Status` → set to any value that marks it done (use `"Dismissed"` as a sentinel — the Review Queue only has Needs Info / To Assess options, so just update the Notes field to mark it resolved)

Actually: since the Review Queue doesn't have a "Done" status option, update the row's Notes to append `" | Resolved 2026-XX-XX → [final Status in main DB]"`. This keeps the row visible for audit but marks it clearly resolved. You can also just leave it — the main job is to write it to the main DB. The Review Queue will be re-evaluated on each /job-review run based on Status, so if you want to truly remove it, you'd need to delete it — but since deletion isn't supported via MCP, mark Notes as resolved and instruct the user to archive/delete manually if needed.

**Simpler approach:** After writing to main DB, update the Review Queue row's `Status` field. Since the only options are "Needs Info" and "To Assess", leave Status unchanged but update Notes to `"[RESOLVED → main DB]"`. The queue will shrink over time as rows are resolved and the daily scan stops adding to those spots.

**Practical instruction:** For now, focus on creating the main DB entry. Then update the Review Queue row's Notes to mark it resolved. The user will see the queue shrink in /job-morning counts.

---

## Step 5 — Group B: To Assess Confirmation Pass

After Group A is fully processed (enrichment sweep + any manual paste remaining), present all Group B (To Assess) rows as a confirmation table. All data was already saved by the daily scan — no enrichment needed.

```
## To Assess — [N] listings to confirm

| # | Title | Company | 📍 Zone | 💰 Salary | Priority | Red Flags | Note |
|---|---|---|---|---|---|---|---|
| 1 | [title] | [company] | 🟢/🟡/🌐 | [salary or —] | [A/B/C] | [flags or —] | [1-line scan note] |
...
```

For each row offer three options:
- **[K] Keep** — accept scan's priority → promotes to `Potentially Apply` (B) or `To Apply` (A) in main DB
- **[U] Upgrade** — override to higher priority (e.g. C→B, B→A) → enter new priority
- **[D] Dismiss** — move to `Dismissed` in main DB

Zack can respond with one letter per row (e.g. `1K 2D 3U:A`) or handle them one at a time.

For each confirmed row:
- Write to main DB (Step 4a) with the confirmed/overridden priority and status
- Mark Review Queue row as resolved (Step 4b)

If Group B is empty, skip this step.

---

## Step 6 — Manual Paste Loop (for remaining Group A rows)

If any Group A rows couldn't be auto-enriched, work through them one at a time:

```
[N/M] **[Job Title]** @ [Company]
📍 [Location]  ·  💰 [Salary or "Not stated"]  ·  Source: [Source]
Missing: [Missing Info values]
QUEUED note: [first line of Notes after "QUEUED:"]
🔗 [Job URL if available]
```

Then ask:
> "Paste the full job description, or type `skip` to leave it queued, or `dismiss` to move it to Dismissed."

- JD pasted → re-rank (Step 3) → write to main DB + mark resolved (Step 4) → move to next row.
- `skip` → leave in Review Queue with `Status: Needs Info`, move to next row.
- `dismiss` → write to main DB as Dismissed → mark resolved in Review Queue → move to next row.

At any point the user can type `stop` to halt and jump to the final summary.

---

## Step 7 — Hard disqualifier fast-path

If enriched data reveals a clear disqualifier (Paris on-site, salary stated below €40K, unrelated function) — write to main DB as Dismissed and tell the user in one sentence. Do not ask for confirmation.

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

### Outcomes (main DB)
**Moved to `To Apply`:** [N] — [titles]
**Moved to `Potentially Apply`:** [N] — [titles]
**Moved to `Dismissed`:** [N]

### Notable finds
[Any Priority A promotions worth flagging]
```

---

## Notes on Behavior

- Be critical, not agreeable. Follow the same "no soft-pedalling" rule as `/job-search`.
- Never mark a row as `To Apply` or `Potentially Apply` without an explicit CV Approach selection.
- Process one manual-paste row at a time so the user can interject between listings.
- The Review Queue data source ID is different from the Job Applications data source ID — always fetch from the correct one.
