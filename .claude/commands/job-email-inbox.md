---
description: Email pre-processor — reads today's job alert emails from Gmail, parses every listing, writes raw rows to listing_inbox staging table. No scoring, no routing. Run each evening before the daily scan, or manually to backfill. Trigger with /job-email-inbox.
argument-hint: Optional date override in MM/DD/YY format (e.g. 04/23/26). Default: today.
allowed-tools: mcp__claude_ai_Gmail__search_threads, mcp__claude_ai_Gmail__get_thread, Bash
---

# Job Email Inbox Pre-Processor

## Step 0 — Load Config

Run `cat config.json` via Bash. Extract:
- `supabase_connection_string` → PG_CONN
- `pg_module_path` → PG_MODULE
- `gmail.label` → GMAIL_LABEL (default: `jobs`)

**DB query pattern** — substitute actual values in every Bash call:
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

## Step 1 — Determine Parse Date

If `$ARGUMENTS` contains a date in `MM/DD/YY` format (e.g. `04/23/26`) → parse it:
- month = first two digits, day = middle two digits, year = `20` + last two digits
- convert to `parse_date` in `YYYY-MM-DD` format

Otherwise → use today's date from the `currentDate` context variable.

Format `parse_date` as:
- `YYYY-MM-DD` for SQL
- `YYYY/MM/DD` for Gmail `after:`/`before:` filters

Gmail `after:` = parse_date, `before:` = parse_date + 1 day (to capture the full day).

---

## Step 2 — Search Gmail

Run three searches in parallel using `search_threads`:

**Search 1 — All labelled job alerts:**
```
label:jobs after:YYYY/MM/DD before:YYYY/MM/DD
```

**Search 2 — APEC alerts (HTML-only, separate tracking):**
```
from:offres@diffusion.apec.fr after:YYYY/MM/DD before:YYYY/MM/DD
```

**Search 3 — Recruiter / direct outreach (not labelled):**
```
-label:jobs -from:offres@diffusion.apec.fr subject:(candidature OR opportunité OR poste OR recrutement OR "Finance Director" OR "Directeur Financier" OR "FP&A" OR "Contrôleur de Gestion") after:YYYY/MM/DD before:YYYY/MM/DD
```

Merge results from all three searches. De-duplicate by `threadId` (a thread may appear in multiple search results). Build a single list of unique threads to process.

---

## Step 3 — Parse Each Thread

For each thread, process in this order:

### 3a — Dedup check (skip if already parsed today)

```sql
SELECT id FROM listing_inbox
WHERE gmail_thread_id=$1 AND parse_date=$2
LIMIT 1
```
Pass `[threadId, parse_date]`. If any row returned → skip this thread (already in inbox for today). Count as duplicate.

### 3b — Route by source

**APEC threads** (`from:offres@diffusion.apec.fr`):

Do NOT call `get_thread` — APEC emails are HTML-only and return no body.
Read the subject line and snippet from the search result instead.

Insert one summary row:
```sql
INSERT INTO listing_inbox
(parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
 job_title, parse_status, parse_notes, raw_snippet)
VALUES ($1,$2,$3,'APEC',$4,'APEC alert','manual_check',
        'APEC HTML-only — check apec.fr manually',$5)
```
- `alert_keyword`: extract from subject (e.g. "9 offres Apec du 23/04/2026" → keyword = APEC search term if visible in snippet, else "APEC")
- `raw_snippet`: the Gmail snippet from search results
- `gmail_thread_url`: `https://mail.google.com/mail/u/0/#all/<threadId>`

---

**Cadremploi threads** (`from:alertes.cadremploi.fr`):

Call `get_thread`. If `plaintextBody` is present and non-empty → use it (go to standard parsing below).

If no `plaintextBody`:
- **Rung 1 — Snippet:** Try to extract company name and listing count from the Gmail snippet. If you find a recognisable listing (company + title signal) → INSERT with `parse_status='pending'`, `parse_notes='Cadremploi snippet-parsed'`.
- **Rung 2 — WebFetch:** If a `cadremploi.fr/emploi/...` URL is visible in the snippet → WebFetch it. If content returned → parse company, title, location, salary, job_url. INSERT with `parse_status='pending'`, `parse_notes='Cadremploi WebFetch'`.
- **Rung 3 — Manual check:** INSERT one row: `parse_status='manual_check'`, `parse_notes='Cadremploi HTML-only — check manually'`, `raw_snippet` = Gmail snippet.

---

**All other threads (Indeed, LinkedIn, Direct):**

Call `get_thread` to read the full body. Extract each distinct job listing from the email body. For each listing:

**Alert keyword** (extract once per thread from subject):
1. French: `pour (.+?) (?:à|en|dans|sur)` → keyword = match group 1
2. French alt: `(?:alerte emploi|offres?)\s*:?\s*(.+)` → keyword = match group 1
3. English: `for (.+?) (?:near|in|at)` → match group 1
4. Fallback: derive from sender — `jobalert.indeed.com` → `Indeed`, `linkedin.com` → `LinkedIn`, `alertes.cadremploi.fr` → `Cadremploi`

Clean the result: trim whitespace, strip trailing punctuation.

**Per listing, extract:**
- `job_title`
- `company` (or `'Not disclosed'` if agency withheld)
- `location` (city)
- `salary` (or null)
- `contract_type` (CDI / CDD / Interim / null)
- `english` (true if English mentioned)
- `job_url` — use this priority:
  1. Indeed `jk=XXXXXXX` → store `https://fr.indeed.com/viewjob?jk=XXXXXXX`
  2. Short Indeed link → store as-is
  3. LinkedIn job URL → store as-is
  4. Any other direct URL → store as-is
  5. No URL → store `'Not available'`
- `gmail_thread_url`: `https://mail.google.com/mail/u/0/#all/<threadId>`

**Source derivation from sender:**
- `jobalert.indeed.com` → `'Indeed'`
- `linkedin.com` → `'LinkedIn'`
- `alertes.cadremploi.fr` → `'Cadremploi'`
- `offres@diffusion.apec.fr` → `'APEC'`
- anything else → `'Direct'`

**INSERT one row per listing:**
```sql
INSERT INTO listing_inbox
(parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
 job_title, company, location, salary, job_url, contract_type,
 parse_status, english, raw_snippet)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',$12,$13)
```
Pass `[parse_date, threadId, thread_url, source, alert_keyword, job_title, company, location, salary, job_url, contract_type, english, raw_snippet]`.

`raw_snippet`: first 500 chars of the listing text from the email body.

---

## Step 4 — Report

After processing all threads, output:

```
/job-email-inbox complete — [parse_date]

Threads found:     [N total from all 3 Gmail searches]
  Already in inbox: [N duplicates skipped]
  Processed:        [N new threads]

Listings written to listing_inbox:
  pending:       [N]  (ready for daily scan)
  manual_check:  [N]  (APEC: N, Cadremploi: N — check manually at source)
  errors:        [N]  (if any INSERT failed — list them)

[If manual_check > 0:]
Manual check required:
  APEC: [N] alerts — visit https://www.apec.fr/candidat/recherche-emploi.html
  Cadremploi: [N] alerts — check Gmail threads directly

[If errors > 0:]
Failed inserts — investigate:
  - [thread subject] ([threadId]): [error message]
```
