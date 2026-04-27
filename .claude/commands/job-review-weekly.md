---
description: End-of-week comparison of all "Potentially Apply" listings. Fetches the holding queue, presents a ranked comparison table, and lets Zack select which listings to commit to (→ To Apply) vs. dismiss. Trigger with /job-review-weekly.
argument-hint: No arguments needed.
allowed-tools: Bash
---

# Weekly Job Review

## Step 0 — Load Config

Run `cat config.json` via Bash. Parse the output and extract:
- `supabase_connection_string` → PG_CONN
- `pg_module_path` → PG_MODULE
- `user.name` → name

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

You are helping the user make final apply decisions on the week's "Potentially Apply" listings.

---

## Step 1 — Fetch the Holding Queue

```sql
SELECT id, job_title, company, location, priority, status, date_added,
       job_url, notes, salary, red_flags
FROM job_applications
WHERE status = 'Potentially Apply'
ORDER BY
  CASE priority WHEN 'A' THEN 1 WHEN 'B' THEN 2 ELSE 3 END,
  date_added ASC
```

If no rows returned, say "Nothing in the Potentially Apply queue — nothing to review" and stop.

---

## Step 2 — Present Comparison Table

Output a numbered comparison table:

```
## Potentially Apply — Weekly Review ([N] listings)

| # | Title | Company | 📍 Zone | 💰 Salary | Priority | Red Flags | Notes | 🔗 |
|---|---|---|---|---|---|---|---|---|
| 1 | [title] | [company] | 🟢/🟡/🌐 | [salary or —] | [A/B] | [flags or —] | [1-line summary] | [link](url) or — |
...
```

Keep the Notes column to one short line — the decision-relevant point only.
The 🔗 column should contain the Job URL as a markdown link `[link](url)`, or `—` if none stored.
`red_flags` is a JSONB array — display as comma-separated values.

---

## Step 3 — Selection

Ask:
> "Which numbers do you want to move to **To Apply**? List them (e.g. `1,3`) or type `all` / `none`.
> The rest will be dismissed unless you type `hold` to leave them in Potentially Apply."

Wait for response. Parse:
- Numbers (e.g. `1,3,5`) → those rows → `Status: To Apply`
- `all` → every row → `Status: To Apply`
- `none` → no rows promoted
- `hold` as a suffix (e.g. `1,3 hold`) → unpromoted rows stay `Potentially Apply`
- Default (no `hold`) → unpromoted rows → `Status: Dismissed`

---

## Step 4 — Update Supabase

For each status change, run an UPDATE. For **To Apply**:
```sql
UPDATE job_applications SET status = 'To Apply' WHERE id = $1
```

For **Dismissed**:
```sql
UPDATE job_applications SET status = 'Dismissed' WHERE id = $1
```

For held rows: no update needed (leave as Potentially Apply).

Run all updates sequentially. Confirm each with the returned row count.

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
