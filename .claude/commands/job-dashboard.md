---
description: Read-only pipeline overview of all open job applications. Groups by status in pipeline order — Needs Info through Offer — with counts, days waiting, and job links. No updates, no prompts. Trigger with /job-dashboard.
argument-hint: No arguments needed.
allowed-tools: Bash
---

# Job Application Dashboard

## Step 0 — Load Config

Run `cat config.json` via Bash. Parse the output and extract:
- `supabase_connection_string` → PG_CONN
- `pg_module_path` → PG_MODULE
- `user.name` → name
- `location_zones` → green/yellow/orange/red city lists

**DB query pattern** — substitute actual `PG_MODULE` and `PG_CONN` values from config in every Bash call:
```bash
PG_MODULE="<pg_module_path>" PG_CONN="<supabase_connection_string>" node -e "
const {Client}=require(process.env.PG_MODULE);
const c=new Client({connectionString:process.env.PG_CONN});
c.connect()
  .then(()=>c.query('<SQL>',[<params>]))
  .then(r=>{console.log(JSON.stringify(r.rows));return c.end();})
  .catch(e=>{console.error(e.message);process.exit(1);});
"
```

---

You are displaying a read-only pipeline overview of all active job applications. No updates, no prompts.

---

## Step 1 — Fetch All Open Applications

Run two queries:

**Query 1 — Review Queue (staging):**
```sql
SELECT id, job_title, company, location, priority, status, date_added,
       job_url, gmail_thread_url, red_flags, missing_info, notes, salary, source
FROM review_queue
WHERE status IN ('Needs Info', 'To Assess')
ORDER BY date_added ASC
```

**Query 2 — Job Applications (main pipeline):**
```sql
SELECT id, job_title, company, location, priority, status, date_added,
       date_applied, job_url, docs_url, gmail_thread_url, red_flags, notes, salary, source
FROM job_applications
WHERE status IN ('Potentially Apply', 'To Apply', 'Docs Ready', 'Applied', 'Interview', 'Offer', 'On Hold')
ORDER BY status, date_added ASC
```

Today's date comes from the injected `currentDate` context. Use it to compute "days waiting."

---

## Step 2 — Display Pipeline Dashboard

Output a header summary, then one section per status group **in pipeline order**. Only show groups with at least one row.

### Table format

All groups use the same base table:

```
| # | Title | Company | 📍 Zone | 💰 Salary | Priority | Red Flags | Notes | 🔗 |
|---|---|---|---|---|---|---|---|---|
| 1 | [title] | [company] | 🟢/🟡/🟠/🔴/🌐 [city] | [salary or —] | [A/B/C or —] | [flags or —] | [1-line note · Nd] | [link](url) or — |
```

**Additional columns by status:**
- `Docs Ready`: add `📄 [docs](docs_url)` column after 🔗
- `Applied` / `Interview` / `Offer`: replace 🔗 with two columns:
  - `🔗 JD` → Job URL
  - `📧 Gmail` → Gmail Thread URL as `[thread](url)` — show only if set, otherwise `—`

**Zone emoji** (derive from Location field using location_zones from config):
- Green zone cities/departments → 🟢
- Yellow zone cities/departments → 🟡
- Orange zone cities/departments → 🟠
- Red zone cities/departments → 🔴
- Remote / France → 🌐
- Unknown → —

**Days column** (append to Notes field as `· [N]d`):
- `Applied`, `Interview`, `Offer` → days since date_applied
- All others → days since date_added

**red_flags** is a JSONB array — display as comma-separated values.

### Full output structure

```
## Job Application Dashboard — [DATE]

**[N] open applications** across [N] active stages

---

### 🔵 Needs Info ([N])
[table]

### ⚪ To Assess ([N])
[table]

### 🟣 Potentially Apply ([N])
[table]

### 🔵 To Apply ([N])
[table]

### 🟢 Docs Ready ([N])
[table with docs column]

### 🟡 Applied — Awaiting Response ([N])
[table with JD + Gmail columns]

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

```
---
💡 Next action: [one line — e.g. "3 Applied rows > 14 days — consider running /job-status to check for responses" or "2 To Apply rows ready — run /job-apply to draft documents" or "Queue is healthy — nothing urgent"]
```
