---
description: Read-only pipeline overview of all open job applications. Groups by status in pipeline order — Needs Info through Offer — with counts, days waiting, and job links. No updates, no prompts. Trigger with /job-dashboard.
argument-hint: No arguments needed.
allowed-tools: mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch
---

# Job Application Dashboard

You are displaying a read-only pipeline overview of all active job applications for Zack.
No updates, no prompts — just a clear picture of where everything stands.

---

## Step 1 — Fetch All Open Applications

Search the Job Applications database (`collection://73c7671a-f600-40a1-807a-83375c3160a9`)
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

**Zone emoji** (derive from Location field):
- Dept 38 core (Grenoble, Saint-Égrève, Meylan, Échirolles, Crolles, Bernin, Voreppe…) → 🟢
- Voiron, Chambéry, Pontcharra, Saint-Marcellin → 🟡
- Valence, Annecy, Albertville, Ugine → 🟠
- Lyon, Paris, Luxembourg → 🔴
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
