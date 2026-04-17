---
description: Read-only pipeline overview of all open job applications. Groups by status in pipeline order — Needs Info through Offer — with counts, days waiting, and job links. No updates, no prompts. Trigger with /job-dashboard.
argument-hint: No arguments needed.
allowed-tools: mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch
---

# Job Application Dashboard

## Step 0 — Load User Profile

Search Notion for the page titled "⚙️ User Profile & Config" using `mcp__claude_ai_Notion__notion-search`, then fetch the first result using `mcp__claude_ai_Notion__notion-fetch`.
Extract into context: **Section 1** (user name), **Section 4** (location zones), **Section 7** (Notion IDs).
If no page is found, halt: "User Profile not found in Notion — run /job-user-setup to create your profile first."

---

You are displaying a read-only pipeline overview of all active job applications for the user (name from profile).
No updates, no prompts — just a clear picture of where everything stands.

---

## Step 1 — Fetch All Open Applications

Search the Job Applications database (data source ID from profile Section 7)
and retrieve all rows. Filter client-side to keep only these **open** statuses:

`Needs Info` · `To Assess` · `Potentially Apply` · `To Apply` · `Docs Ready` · `Applied` · `Interview` · `Offer` · `On Hold`

Exclude: `Dismissed` · `Rejected` (these are closed — not shown)

For each row extract: Job Title, Company, Location, Priority, Status, Date Added, Date Applied, Job URL, Docs URL.

Today's date comes from the injected `currentDate` context. Use it to compute "days waiting."

---

## Step 2 — Display Pipeline Dashboard

Output a header summary, then one section per status group **in pipeline order**.
Only show groups that have at least one row.

### Table format

All groups use the same base table format (consistent with `/job-review-weekly`):

```
| # | Title | Company | 📍 Zone | 💰 Salary | Priority | Red Flags | Notes | 🔗 |
|---|---|---|---|---|---|---|---|---|
| 1 | [title] | [company] | 🟢/🟡/🟠/🔴/🌐 [city] | [salary or —] | [A/B/C or —] | [flags or —] | [1-line note] | [link](url) or — |
```

**Additional columns by status:**
- `Docs Ready`: add `📄 [docs](docs_url)` column after 🔗
- `Applied` / `Interview` / `Offer`: replace 🔗 with two link columns:
  - `🔗 JD` → Job URL (the original listing)
  - `📧 Gmail` → Gmail Thread URL as `[thread](https://mail.google.com/mail/u/0/#all/[threadId])` — show only if Gmail Thread URL is set, otherwise `—`

**Zone emoji** (derive from Location field using zone tables from profile Section 4):
- Green zone cities/departments from profile → 🟢
- Yellow zone cities/departments from profile → 🟡
- Orange zone cities/departments from profile → 🟠
- Red zone cities/departments from profile → 🔴
- Remote / France → 🌐
- Unknown → —

**Days column** (append to Notes field as `· [N]d`):
- `Applied`, `Interview`, `Offer` → days since Date Applied
- All others → days since Date Added

### Full output structure

```
## Job Application Dashboard — [DATE]

**[N] open applications** across [N] active stages

---

### 🔵 Needs Info ([N])
| # | Title | Company | 📍 Zone | 💰 Salary | Priority | Red Flags | Notes | 🔗 |
...

### ⚪ To Assess ([N])
...

### 🟣 Potentially Apply ([N])
...

### 🔵 To Apply ([N])
...

### 🟢 Docs Ready ([N])
| # | Title | Company | 📍 Zone | 💰 Salary | Priority | Red Flags | Notes | 🔗 | 📄 |
...

### 🟡 Applied — Awaiting Response ([N])
| # | Title | Company | 📍 Zone | 💰 Salary | Priority | Red Flags | Notes | 🔗 JD | 📧 Gmail |
...

### 🟠 Interview ([N])
[same as Applied]

### 💚 Offer ([N])
[same as Applied]

### 🟤 On Hold ([N])
[standard table]

---
```

---

## Step 3 — Closing Line

End with a one-line action prompt based on what's most urgent:

```
---
💡 Next action: [one line — e.g. "3 Applied rows > 14 days — consider running /job-status to check for responses" or "2 To Apply rows ready — run /job-apply to draft documents" or "Queue is healthy — nothing urgent"]
```
