---
description: End-of-week comparison of all "Potentially Apply" listings. Fetches the holding queue, presents a ranked comparison table, and lets Zack select which listings to commit to (→ To Apply) vs. dismiss. Trigger with /job-review-weekly.
argument-hint: No arguments needed.
allowed-tools: mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-update-page
---

# Weekly Job Review

## Step 0 — Load User Profile

Search Notion for the page titled "⚙️ User Profile & Config" using `mcp__claude_ai_Notion__notion-search`, then fetch the first result using `mcp__claude_ai_Notion__notion-fetch`.
Extract into context: **Section 1** (user name), **Section 7** (Notion IDs — Job Applications data source ID).
If no page is found, halt: "User Profile not found in Notion — run /job-user-setup to create your profile first."

---

You are helping the user (name from profile) make final apply decisions on the week's "Potentially Apply"
listings. These are Priority B listings that passed the quality bar but haven't been committed to yet.

Your goal: present a clear comparison of all candidates, let the user choose which ones to
actually pursue, and update Notion accordingly.

---

## Step 1 — Fetch the Holding Queue

Call `mcp__claude_ai_Notion__notion-fetch` on the Job Applications data source (ID from profile Section 7).

Filter client-side to `Status = "Potentially Apply"`. Sort: Priority A first (if any slipped
through), then B; within each group, oldest Date Added first.

If the queue is empty, say "Nothing in the Potentially Apply queue — nothing to review" and stop.

---

## Step 2 — Present Comparison Table

Output a numbered comparison table:

```
## Potentially Apply — Weekly Review ([N] listings)

| # | Title | Company | 📍 Zone | 💰 Salary | Priority | Red Flags | Notes | 🔗 |
|---|---|---|---|---|---|---|---|---|
| 1 | [title] | [company] | 🟢/🟡/🌐 | [salary or —] | [A/B] | [flags or —] | [1-line summary] | [URL or —] |
| 2 | ... | ... | ... | ... | ... | ... | ... | ... |
...
```

Keep the Notes column to one short line — the decision-relevant point only (e.g. "RAF scope,
French-only, salary unknown" or "FP&A at international pharma, hybrid confirmed").
The 🔗 column should contain the Job URL from Notion as a markdown link `[link](url)`, or `—` if none stored.

---

## Step 3 — Selection

Ask:
> "Which numbers do you want to move to **To Apply**? List them (e.g. `1,3`) or type `all` / `none`.
> The rest will be dismissed unless you type `hold` to leave them in Potentially Apply."

Wait for Zack's response. Parse:
- Numbers (e.g. `1,3,5`) → those rows → `Status: To Apply`
- `all` → every row → `Status: To Apply`
- `none` → no rows promoted
- `hold` as a suffix (e.g. `1,3 hold`) → unpromoted rows stay `Potentially Apply`
- Default (no `hold`) → unpromoted rows → `Status: Dismissed`

---

## Step 4 — Update Notion

For each row in the selection: call `mcp__claude_ai_Notion__notion-update-page` with `Status: To Apply`.
For each dismissed row: `Status: Dismissed`.
For any held rows: leave `Status: Potentially Apply` unchanged.

---

## Step 5 — Final Summary

```
## Weekly Review Complete

**Promoted to `To Apply`:** [N] — [titles]
**Dismissed:** [N] — [titles]
**Left in `Potentially Apply`:** [N] — [titles if any]

### Next step
Run `/job-apply` on each "To Apply" listing to draft tailored CV and cover letter.
[List the To Apply rows with company + title for easy reference]
```
