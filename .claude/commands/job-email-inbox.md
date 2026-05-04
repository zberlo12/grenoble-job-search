---
description: Email pre-processor — reads yesterday's job alert emails from Gmail, parses every listing, writes raw rows to listing_inbox staging table. No scoring, no routing. Runs nightly at 3 AM (scans the previous day). Trigger with /job-email-inbox.
argument-hint: Optional date override in MM/DD/YY format (e.g. 04/23/26). Default: yesterday.
allowed-tools: mcp__claude_ai_Gmail__search_threads, mcp__claude_ai_Gmail__get_thread, Bash
---

# Job Email Inbox Pre-Processor

## Step 0 — Load Config

Run `cat config.json`. Extract `supabase_connection_string` → PG_CONN, `pg_module_path` → PG_MODULE, `gmail.label` → GMAIL_LABEL.

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

**Remote triggers only:** If `SUPABASE_URL`/`SUPABASE_KEY` are in env (port 5432 blocked), use curl — patterns in job-search-daily-scan.md Step 0. GMAIL_LABEL from trigger config (default: `jobs`).

---

## Step 1 — Determine Parse Date

If `$ARGUMENTS` contains `MM/DD/YY` → parse: first two digits = month, middle = day, last two = year → `YYYY-MM-DD`. Otherwise use yesterday (currentDate − 1).

Gmail filters: `after:YYYY/MM/DD before:YYYY/MM/DD` (next calendar day as upper bound).

---

## Step 2 — Search Gmail

Run three searches in parallel using `search_threads`:

1. `label:jobs after:YYYY/MM/DD before:YYYY/MM/DD`
2. `from:offres@diffusion.apec.fr after:YYYY/MM/DD before:YYYY/MM/DD`
3. `-label:jobs -from:offres@diffusion.apec.fr subject:(candidature OR opportunité OR poste OR recrutement OR "Finance Director" OR "Directeur Financier" OR "FP&A" OR "Contrôleur de Gestion") after:YYYY/MM/DD before:YYYY/MM/DD`

Merge all three results, de-duplicate by `threadId`.

---

## Step 3 — Parse Each Thread

### 3a — Thread dedup (skip if already parsed today)

```sql
SELECT id FROM listing_inbox WHERE gmail_thread_id=$1 AND parse_date=$2 LIMIT 1
```
If row returned → skip thread (count as duplicate).

### 3b — Route by source

**APEC** (`from:offres@diffusion.apec.fr`): Do not call `get_thread`. Insert one summary row from the search result snippet: `parse_status='manual_check'`, `parse_notes='APEC HTML-only — check apec.fr manually'`. `alert_keyword` from subject; `raw_snippet` from search snippet; `gmail_thread_url` = `https://mail.google.com/mail/u/0/#all/<threadId>`.

**Cadremploi** (`from:alertes.cadremploi.fr`): Call `get_thread`.
- Has `plaintextBody` → parse as standard (see below)
- No body, specific listing visible in snippet → INSERT `parse_status='pending'`, `parse_notes='Cadremploi snippet-parsed'`
- No body, no specific listing → INSERT `parse_status='manual_check'`, `parse_notes='Cadremploi HTML-only — check manually'`

**All others (Indeed, LinkedIn, Direct):**

**Snippet-first** (LinkedIn/Indeed only — skip `get_thread` if ALL true):
1. Snippet ≥ 80 chars
2. Subject does NOT suggest multiple listings ("X offres", "X jobs", "X nouvelles offres")
3. Single title + company clearly visible in snippet

Otherwise call `get_thread`. Extract each distinct listing from the body.

**Alert keyword** (extract once per thread, try in order):
1. `pour (.+?) (?:à|en|dans|sur)` → group 1
2. `(?:alerte emploi|offres?)\s*:?\s*(.+)` → group 1
3. `for (.+?) (?:near|in|at)` → group 1
4. Fallback from sender: indeed→`Indeed` · linkedin→`LinkedIn` · cadremploi→`Cadremploi`

Trim whitespace, strip trailing punctuation.

**Per listing, extract:** `job_title` · `company` (`'Not disclosed'` if withheld) · `location` · `salary` · `contract_type` (CDI/CDD/Interim/null) · `english` (true if English mentioned)

**`job_url` priority:** Indeed `jk=XXXXXXX` → `https://fr.indeed.com/viewjob?jk=XXXXXXX` · short Indeed link → as-is · LinkedIn job URL → as-is · other direct URL → as-is · none → `'Not available'`

**Source from sender:** `jobalert.indeed.com`→`Indeed` · `linkedin.com`→`LinkedIn` · `alertes.cadremploi.fr`→`Cadremploi` · `offres@diffusion.apec.fr`→`APEC` · else→`Direct`

**URL dedup — before each INSERT:** If `job_url != 'Not available'`, check:
```sql
SELECT id FROM listing_inbox WHERE job_url=$1 AND parse_date >= CURRENT_DATE - 7 LIMIT 1
```
If row returned → skip this listing (count as `url_dedup`). Continue to next listing.

**INSERT:**
```sql
INSERT INTO listing_inbox
(parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
 job_title, company, location, salary, job_url, contract_type,
 parse_status, english, raw_snippet)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',$12,$13)
```
`raw_snippet` = first 200 chars of listing text (or snippet if snippet-parsed). `gmail_thread_url` = `https://mail.google.com/mail/u/0/#all/<threadId>`.

---

## Step 4 — Report

```
/job-email-inbox complete — [parse_date]

Threads found:     [N total from all 3 Gmail searches]
  Already in inbox: [N thread-duplicates skipped]
  Processed:        [N new threads]

Listings written to listing_inbox:
  pending:       [N]  (ready for daily scan)
  url_dedup:     [N]  (same URL seen in last 7 days — skipped)
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
