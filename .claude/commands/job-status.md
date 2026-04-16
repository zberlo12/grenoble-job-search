---
description: Check and update the status of active job applications. Shows Docs Ready, Applied, and Interview rows in a table, lets Zack confirm submissions and log responses (interview, rejection, offer) — no Notion login needed. Can be run any time manually. The same response-detection logic runs automatically inside the daily Gmail scan. Trigger with /job-status.
argument-hint: No arguments needed.
allowed-tools: mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-update-page, mcp__claude_ai_Gmail__search_threads, mcp__claude_ai_Gmail__get_thread
---

# Job Status Review

You are helping Zack check the status of all active job applications and update them
without needing to open Notion directly.

---

## Step 1 — Fetch Active Applications

Search the Job Applications database (`collection://73c7671a-f600-40a1-807a-83375c3160a9`)
for rows with Status in: `Docs Ready`, `Applied`, `Interview`.

Sort: Interview first, then Applied (oldest first), then Docs Ready.

If nothing is found, say "No active applications — queue is clear." and stop.

---

## Step 2 — Gmail Response Sweep (silent)

For each row with Status = `Applied` or `Interview`, search Gmail for response emails
received **after** the `Date Applied`:

```
"[Company]" (entretien OR interview OR candidature OR retenu OR sélectionné OR refusé OR rejected OR suite OR félicitations OR offer) after:YYYY/MM/DD -label:jobs
```

Use the `Date Applied` value from Notion for the `after:` date. If `Date Applied` is blank,
use `Date Added` as a fallback.

For any thread found:
- Read the thread (get_thread) to classify:
  - **Interview** → subject/body mentions interview, entretien, rendez-vous, call, visio
  - **Offer** → subject/body mentions offre, proposition, félicitations, offer letter
  - **Rejected** → subject/body mentions refusé, ne correspond pas, other candidates, poursuivons sans
  - **Unknown** → can't classify — flag for manual review
- Note the thread ID for linking to Notion

**Auto-expiry check (run during this step):**
For each `Applied` row where `Date Applied` is more than 60 days ago and no response
found in Gmail → mark for auto-expiry: Status → `Dismissed`,
Notes → append `" | Auto-expired: no response after 60 days"`.

---

## Step 3 — Present Status Table

Output a combined table of all active applications, with any auto-detected responses
pre-filled:

```
## Active Applications — [N] total

| # | Title | Company | Status | Days | Response detected | 🔗 |
|---|---|---|---|---|---|---|
| 1 | [title] | [company] | Docs Ready | — | — | [link] |
| 2 | [title] | [company] | Applied | [N days] | — | [link] |
| 3 | [title] | [company] | Applied | [N days] | ⚠️ Rejection found | [link] |
| 4 | [title] | [company] | Interview | [N days] | — | [link] |
...
```

"Days" = days since Date Applied (or Date Added if no apply date).
"Response detected" = what the Gmail sweep found, or "—" if nothing.

---

## Step 4 — Update Prompts

### 4A — Docs Ready rows
For each `Docs Ready` row, ask:

> "[#] **[Title] @ [Company]** — docs are ready. Have you submitted it?
> Reply `yes [date]` (e.g. `yes 16/04`) to mark Applied, or `skip` to leave as Docs Ready."

Process each in turn. `yes [date]` → Status: `Applied`, Date Applied: parsed date.

### 4B — Pre-filled responses
For any row where the Gmail sweep detected a response, confirm with Zack:

> "[#] **[Title] @ [Company]** — I found what looks like a [Rejection / Interview / Offer]
> email ([thread snippet]). Confirm? Reply `yes` to update status, or `no` to leave as-is."

`yes` → update Status + set Date Response + link Gmail thread URL.

### 4C — Manual updates
After processing pre-fills, ask once:

> "Any other updates? Type `[#] [new status]` for each (e.g. `2 interview`, `3 rejected`,
> `4 offer`). Or `done` to finish."

Valid status keywords: `interview`, `rejected`, `offer`, `hold`, `applied [date]`.

---

## Step 5 — Apply All Updates

For each confirmed change, call `notion-update-page`:

| Change | Properties to update |
|---|---|
| Docs Ready → Applied | `Status: Applied`, `date:Date Applied:start: YYYY-MM-DD` |
| Applied → Interview | `Status: Interview`, `date:Date Response:start: YYYY-MM-DD` (today if not given) |
| Applied/Interview → Rejected | `Status: Rejected`, `date:Date Response:start: YYYY-MM-DD`, Notes: append rejection note |
| Applied/Interview → Offer | `Status: Offer`, `date:Date Response:start: YYYY-MM-DD` |
| Auto-expiry | `Status: Dismissed`, Notes: append auto-expiry note |
| Gmail thread linked | `Gmail Thread URL: https://mail.google.com/mail/u/0/#all/[threadId]` |

---

## Step 6 — Summary

```
## Status Review Complete — [date]

**Updated:**
- [Title] @ [Company]: Docs Ready → Applied (submitted [date])
- [Title] @ [Company]: Applied → Rejected (response found in Gmail)
- [Title] @ [Company]: Auto-expired (60 days, no response)

**No changes:**
- [Title] @ [Company]: Applied, [N] days, no response yet

**Still open:**
- [N] Applied · [N] Interview · [N] Docs Ready
```
