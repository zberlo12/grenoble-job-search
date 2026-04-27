---
description: Check and update the status of active job applications. Shows Docs Ready, Applied, and Interview rows in a table, lets Zack confirm submissions and log responses (interview, rejection, offer) — no Notion login needed. Can be run any time manually. The same response-detection logic runs automatically inside the daily Gmail scan. Trigger with /job-status.
argument-hint: No arguments needed.
allowed-tools: mcp__claude_ai_Gmail__search_threads, mcp__claude_ai_Gmail__get_thread, Bash
---

# Job Status Review

## Step 0 — Load Config

Run `cat config.json` via Bash. Parse the output and extract:
- `supabase_connection_string` → PG_CONN
- `pg_module_path` → PG_MODULE
- `user.name` → name
- `lifecycle_rules.auto_expiry_days` → auto-expiry threshold (default 60)

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

**REST API mode (remote triggers):** When `SUPABASE_URL` and `SUPABASE_KEY` are provided via trigger config instead (TCP ports 5432/6543 are blocked in remote environments), skip `cat config.json` and use `curl` for all DB calls:

```bash
# SELECT
curl -s "SUPABASE_URL/rest/v1/<table>?<filters>&select=<cols>&order=<col>.<dir>&limit=<n>" \
  -H "apikey: SUPABASE_KEY" -H "Authorization: Bearer SUPABASE_KEY"

# INSERT (returns inserted row)
curl -s -X POST "SUPABASE_URL/rest/v1/<table>" \
  -H "apikey: SUPABASE_KEY" -H "Authorization: Bearer SUPABASE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '<JSON>'

# UPDATE
curl -s -X PATCH "SUPABASE_URL/rest/v1/<table>?<filter>" \
  -H "apikey: SUPABASE_KEY" -H "Authorization: Bearer SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '<JSON>'

# UPSERT (ON CONFLICT DO UPDATE)
curl -s -X POST "SUPABASE_URL/rest/v1/<table>" \
  -H "apikey: SUPABASE_KEY" -H "Authorization: Bearer SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates,return=representation" \
  -d '<JSON>'
```

Filter operators: `col=eq.val` · `col=ilike.*val*` · `col=gte.val` · `col=lt.val` · `col=in.(a,b)` · `col=not.in.(a,b)` — multiple filters ANDed with `&`.
UNION queries: run two separate GETs and treat as found if either returns results.

---

## Step 1 — Fetch Active Applications

```sql
SELECT id, job_title, company, status, date_added, date_applied, job_url,
       gmail_thread_url, notes
FROM job_applications
WHERE status IN ('Docs Ready', 'Applied', 'Interview')
ORDER BY
  CASE status WHEN 'Interview' THEN 1 WHEN 'Applied' THEN 2 ELSE 3 END,
  COALESCE(date_applied, date_added) ASC
```

If no rows returned, say "No active applications — queue is clear." and stop.

---

## Step 2 — Gmail Response Sweep (silent)

For each row with Status = `Applied` or `Interview`, search Gmail for response emails received **after** the `date_applied` (fallback to `date_added`):

```
"[Company]" (entretien OR interview OR candidature OR retenu OR sélectionné OR refusé OR rejected OR suite OR félicitations OR offer) after:YYYY/MM/DD -label:jobs
```

For any thread found, call `get_thread` to classify:
- **Interview** → mentions: interview, entretien, rendez-vous, call, visio
- **Offer** → mentions: offre, proposition, félicitations, offer letter
- **Rejected** → mentions: refusé, ne correspond pas, other candidates, poursuivons sans
- **Unknown** → can't classify — flag for manual review

**Auto-expiry check:** For each `Applied` row where `date_applied` is more than auto-expiry threshold days ago and no response found → mark for auto-expiry: `status = 'Dismissed'`, append to notes.

---

## Step 3 — Present Status Table

```
## Active Applications — [N] total

| # | Title | Company | Status | Days | Response detected | 🔗 |
|---|---|---|---|---|---|---|
| 1 | [title] | [company] | Docs Ready | — | — | [link] |
| 2 | [title] | [company] | Applied | [N days] | — | [link] |
| 3 | [title] | [company] | Applied | [N days] | ⚠️ Rejection found | [link] |
| 4 | [title] | [company] | Interview | [N days] | — | [link] |
```

"Days" = days since date_applied (or date_added if no apply date).
"Response detected" = what Gmail sweep found, or "—" if nothing.

---

## Step 4 — Update Prompts

### 4A — Docs Ready rows
For each `Docs Ready` row, ask:

> "[#] **[Title] @ [Company]** — docs are ready. Have you submitted it?
> Reply `yes [date]` (e.g. `yes 16/04`) to mark Applied, or `skip` to leave as Docs Ready."

`yes [date]` → update via:
```sql
UPDATE job_applications SET status='Applied', date_applied=$1 WHERE id=$2
```

### 4B — Pre-filled responses
For any row where Gmail sweep detected a response, confirm:

> "[#] **[Title] @ [Company]** — I found what looks like a [Rejection / Interview / Offer] email ([snippet]). Confirm? Reply `yes` or `no`."

`yes` → run appropriate UPDATE (see Step 5 table).

### 4C — Manual updates
Ask once:
> "Any other updates? Type `[#] [new status]` for each (e.g. `2 interview`, `3 rejected`, `4 offer`). Or `done` to finish."

Valid: `interview`, `rejected`, `offer`, `hold`, `applied [date]`.

### 4D — Offer handling
When a row moves to Offer, ask for offer details. Compare to salary floor from config.json `user.salary_floor_apply`. Fetch market benchmarks via WebFetch if available. Generate negotiation brief and append to notes.

---

## Step 5 — Apply All Updates

| Change | SQL |
|---|---|
| Docs Ready → Applied | `UPDATE job_applications SET status='Applied', date_applied=$1 WHERE id=$2` |
| Applied → Interview | `UPDATE job_applications SET status='Interview', date_response=CURRENT_DATE WHERE id=$1` |
| Applied/Interview → Rejected | `UPDATE job_applications SET status='Rejected', date_response=CURRENT_DATE, notes=notes\|\|$1 WHERE id=$2` |
| Applied/Interview → Offer | `UPDATE job_applications SET status='Offer', date_response=CURRENT_DATE WHERE id=$1` |
| Auto-expiry | `UPDATE job_applications SET status='Dismissed', notes=notes\|\|' \| Auto-expired: no response after [N] days' WHERE id=$1` |
| Gmail thread linked | `UPDATE job_applications SET gmail_thread_url=$1 WHERE id=$2` |

Confirm each update with the affected row count.

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
