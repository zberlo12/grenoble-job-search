---
description: Weekly go/no-go pass over the Potentially Apply holding queue — decide which listings promote to To Apply and which get dismissed. Restores the function OVERVIEW.md calls /job-review-weekly. Trigger with /job-shortlist.
argument-hint: No arguments needed.
allowed-tools: mcp__claude_ai_Indeed__get_job_details, mcp__claude_ai_Gmail__get_thread, WebFetch, Bash
---

# Potentially Apply Shortlist Review

## Step 0 — Load Config

Read `.claude/rules/db.md` and use `scripts/db.js` for all database access below.

Run `cat config.json` via Bash and extract `user.profile_id` → USER_PROFILE.

---

## Step 1 — Fetch Potentially Apply rows

```sql
SELECT id, job_title, company, location, salary, priority, red_flags, notes, job_url, gmail_thread_url, date_added, job_description
FROM job_applications
WHERE status = 'Potentially Apply'
  AND user_profile = $1
ORDER BY CASE priority WHEN 'A' THEN 1 WHEN 'B' THEN 2 ELSE 3 END, date_added ASC
```

If no rows: "Potentially Apply is empty — nothing to shortlist" and stop.

---

## Step 2 — Silent JD pre-fetch

Before presenting the table, loop through all rows where `job_description IS NULL OR job_description = ''` and attempt, in order:
- **Rung 1:** `job_url` contains `jk=` → `mcp__claude_ai_Indeed__get_job_details`
- **Rung 2:** `job_url` exists, not LinkedIn, not null/"Not available" → WebFetch
- **Rung 3:** `gmail_thread_url` set → `mcp__claude_ai_Gmail__get_thread` (only if substantive JD content, not a digest subject line)
- **Rung 4:** LinkedIn or all rungs fail → mark as `jd_blocked`, continue silently

On success, save immediately:
```sql
UPDATE job_applications SET job_description = $1 WHERE id = $2 AND user_profile = $3
```

Print one line: `JD pre-fetch: [N] fetched · [M] blocked · [P] no URL`

---

## Step 3 — Present the shortlist

```
## Potentially Apply — [N] listings

| # | Title | Company | 📍 Zone | 💰 Salary | Priority | Red Flags | JD | Note | 🔗 Job | 📧 Gmail |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | [title] | [company] | 🟢/🟡/🌐 | [salary or —] | [B/C] | [flags or —] | ✓ / ⚠ blocked / — | [1-line note] | [link](job_url) or — | [Gmail](gmail_thread_url) or — |
```

**Link columns — MANDATORY:** Always render BOTH `🔗 Job` and `📧 Gmail` as separate columns. `🔗 Job` = `[link](job_url)` or `—`. `📧 Gmail` = `[Gmail](gmail_thread_url)` or `—`. Never merge, never fallback, never omit either column.

Ask:
> "Which numbers do you want to promote to **To Apply**? List them (e.g. `1,3`) or type `all` / `none`.
> The rest will be **dismissed** unless you add `hold` to leave them in Potentially Apply (e.g. `1,3 hold`)."

Parse response:
- Numbers → those rows → `status = 'To Apply'`
- `all` → every row → `status = 'To Apply'`
- `none` → no rows promoted
- `hold` suffix (e.g. `1,3 hold`) → unpromoted rows stay `Potentially Apply`
- Default (no `hold`) → unpromoted rows → `status = 'Dismissed'`

Apply changes:
- Promote: `UPDATE job_applications SET status='To Apply' WHERE id=$1`
- Dismiss: `UPDATE job_applications SET status='Dismissed' WHERE id=$1`
- Hold: no DB write needed

---

## Step 4 — Final Summary

```
## Shortlist Review Complete

Upgraded to To Apply: [N] — [titles or "none"]
Dismissed:             [N]
Left as Potentially Apply: [N]

Next: run /job-apply to draft documents for the promoted roles.
```
