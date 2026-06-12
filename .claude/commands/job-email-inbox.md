---
description: Email pre-processor — reads yesterday's job alert emails from Gmail, parses every listing, writes raw rows to listing_inbox staging table. No scoring, no routing. Runs nightly at 3 AM (scans the previous day). Trigger with /job-email-inbox.
argument-hint: Optional date override in MM/DD/YY format (e.g. 04/23/26). Default: yesterday.
allowed-tools: mcp__claude_ai_Gmail__search_threads, mcp__claude_ai_Gmail__get_thread, Bash
---

# Job Email Inbox Pre-Processor

## Pre-check — Confirm active user

**Before doing anything else**, run `cat config.json`, read `user.name` and `user.email`, then display this message and wait for the user's reply:

> Active profile: **[user.name]** ([user.email])
> This skill will read Gmail and write listing data for this user.
> Reply **yes** to continue, or **no** to abort.

If the user replies anything other than yes / y / oui, stop immediately without executing any further steps.

---

**Execution mode: silent.** Do not narrate steps, explain decisions, or summarise intermediate results. Output only the Step 4 report at the end.

## Step 0 — Load Config

Run `cat config.json`. Extract `supabase_connection_string` → PG_CONN, `pg_module_path` → PG_MODULE, `gmail.label` → GMAIL_LABEL, `user.profile_id` → USER_PROFILE, `puppeteer.html_only_sources` → HTML_ONLY_SOURCES (array of sender domain strings, e.g. `["alertes.cadremploi.fr","alerte@hellowork.com"]`).

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
SELECT id FROM listing_inbox WHERE gmail_thread_id=$1 AND parse_date=$2 AND user_profile=$3 LIMIT 1
```
Pass `[threadId, parseDate, USER_PROFILE]`. If row returned → skip thread (count as duplicate).

### 3b — Route by source

**APEC** (`from:offres@diffusion.apec.fr`): Do not call `get_thread`. Insert one summary row:
- `parse_status='manual_check'`
- `parse_notes`: combine listing count from subject (e.g. "11 offres") + alert keyword + source note. Format: `'APEC: [N offres] — [alert_keyword] — HTML-only — check apec.fr manually'`. If count not in subject, omit it.
- `alert_keyword` from subject; `raw_snippet` from search snippet; `raw_body` = subject + ' | ' + snippet (truncated to 500 chars)
- `gmail_thread_url` = `https://mail.google.com/mail/u/0/#all/<threadId>`

**Known HTML-only sources** (check BEFORE calling `get_thread`): If the sender domain matches any entry in `HTML_ONLY_SOURCES` (from config), skip `get_thread` entirely. INSERT immediately:
- `parse_status='puppeteer_pending'`
- `parse_notes='Known HTML-only source — queued for Puppeteer extraction'`
- `raw_body` = subject + ' | ' + snippet (≤500 chars)
- `job_title`, `company`, `location`, `salary` = null (will be extracted by Puppeteer + Claude parse)

This applies to Cadremploi (`alertes.cadremploi.fr`) and HelloWork (`alerte@hellowork.com`) by default.

**Cadremploi** (`from:alertes.cadremploi.fr`): If NOT in HTML_ONLY_SOURCES (first-time setup), call `get_thread` with `messageFormat=FULL_CONTENT`.

> **Important — known MCP limitation:** `get_thread` does NOT return body content for HTML-only emails. `plaintextBody` will be absent for all Cadremploi alerts. Do not waste retries. The snippet is the only text available.

- Has `plaintextBody` (non-empty) → use as body text → parse as standard (see below)
- No `plaintextBody` → evaluate snippet only:
  - Snippet contains a specific job title AND (company name OR location) AND does NOT end in `...` within the first 120 chars → INSERT `parse_status='pending'`, `parse_notes='Cadremploi snippet-parsed'`
  - Otherwise → INSERT `parse_status='puppeteer_pending'`, `parse_notes='Cadremploi HTML-only — queued for Puppeteer extraction'`
- `raw_body` = subject + ' | ' + snippet (truncated to 500 chars)

**All others (Indeed, LinkedIn, Direct/HelloWork):**

**Snippet-first** (LinkedIn/Indeed only — skip `get_thread` if ALL true):
1. Snippet ≥ 80 chars
2. Subject does NOT suggest multiple listings ("X offres", "X jobs", "X nouvelles offres")
3. Single title + company clearly visible in snippet
4. Snippet does NOT end in `...` within the first 120 chars

Otherwise call `get_thread` with `messageFormat=FULL_CONTENT`.

**If `get_thread` returns no `plaintextBody` (HTML-only email — common for HelloWork direct alerts):**

Attempt subject-line extraction before falling back to `manual_check`:

Try these patterns on the subject in order:
1. `[^,]+,\s*(.+?)\s+recrute\s+(?:un|une)\s+(.+?)(?:\s*[-–]\s*(?:CDI|CDD|Intérim|H/F|F/H).*)?$` → company=group(1), title=group(2)
2. `(.+?)\s*[-–|:]\s*(.+?)(?:\s*H/F|\s*F/H)?$` → title=group(1) or group(2) depending on which looks like a role
3. General fallback: use cleaned subject as `job_title`, company='Not disclosed'

If a title is extracted: INSERT `parse_status='pending'`, `parse_notes='Subject-parsed (HTML-only body — verify location/salary)'`, mark with low confidence (see multi-listing rules below — treat as score=2).

If subject gives no useful info: INSERT `parse_status='puppeteer_pending'`, `parse_notes='[Source] HTML-only — auto-detected, queued for Puppeteer extraction. Add sender to html_only_sources in config if recurring'`.

In all cases: `raw_body` = subject + ' | ' + snippet (truncated to 500 chars).

**Alert keyword** (extract once per thread, try in order):
1. `pour (.+?) (?:à|en|dans|sur)` → group 1
2. `(?:alerte emploi|offres?)\s*:?\s*(.+)` → group 1
3. `for (.+?) (?:near|in|at)` → group 1
4. Fallback from sender: indeed→`Indeed` · linkedin→`LinkedIn` · cadremploi→`Cadremploi`

Trim whitespace, strip trailing punctuation.

**Per listing, extract:** `job_title` · `company` (`'Not disclosed'` if withheld) · `location` · `salary` · `contract_type` (CDI/CDD/Interim/null) · `english` (true if English mentioned)

**`job_url` priority:** Indeed `jk=XXXXXXX` → `https://fr.indeed.com/viewjob?jk=XXXXXXX` · short Indeed link → as-is · LinkedIn job URL → as-is · other direct URL → as-is · none → `'Not available'`

**Source from sender:** `jobalert.indeed.com`→`Indeed` · `linkedin.com`→`LinkedIn` · `alertes.cadremploi.fr`→`Cadremploi` · `offres@diffusion.apec.fr`→`APEC` · else→`Direct`

**Multi-listing emails** — apply when subject or body indicates multiple jobs ("X offres", "X jobs", 3+ titles visible in body):

Pass 1 (boundary detection): scan full body, identify ALL job titles in order with approximate line position. Count = N.

Pass 2 (bounded extraction): for each of N titles, extract fields ONLY from the block between that title and the next title boundary or separator.

**Confidence scoring** (per listing — assign before INSERT):
- +2 company found in same block as title
- +2 job URL found in same block as title
- +1 location found in same block
- +1 salary found in same block
- −5 any field appears ONLY in a different listing's block

Routing by score:
- ≥ 3 → `parse_status='pending'`
- 1–2 → `parse_status='manual_check'`, `parse_notes='low-confidence multi-listing parse — open Gmail to verify fields'`
- ≤ 0 → `parse_status='manual_check'`, `parse_notes='multi-listing attribution failed — open Gmail to review'`

**Integrity rule:** never assign a company to listing N if it only appears in listing M's block. Use `'Not disclosed'` and take the −5 penalty instead of guessing.

**Alert keyword / title rule:** The `alert_keyword` value (extracted above) must NEVER be copied into `job_title`. If title extraction produces a value identical to the alert_keyword (after trimming), treat it as an extraction failure and mark the row `parse_status='manual_check'` with `parse_notes='Title indistinguishable from alert keyword — verify manually'`.

**URL dedup — before each INSERT:** If `job_url != 'Not available'`, check:
```sql
SELECT id FROM (
  SELECT id FROM listing_inbox WHERE job_url=$1 AND parse_date >= CURRENT_DATE - 7 AND user_profile=$2
  UNION ALL
  SELECT id FROM job_applications WHERE job_url=$1 AND user_profile=$2
) t LIMIT 1
```
Pass `[jobUrl, USER_PROFILE]`. If row returned → skip this listing (count as `url_dedup`). Continue to next listing. This catches re-posted roles that were previously dismissed or rejected.

**INSERT:**
```sql
INSERT INTO listing_inbox
(parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
 job_title, company, location, salary, job_url, contract_type,
 parse_status, parse_notes, english, raw_snippet, raw_body, user_profile)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
```
`$17` = USER_PROFILE.
- `raw_snippet` = first 200 chars of listing text (or snippet if snippet-parsed)
- `raw_body` = full body text (or subject+snippet for HTML-only), truncated to 8 000 chars. Store BEFORE any parsing. Purpose: enables reprocessing; makes debugging possible by comparing raw vs. extracted.
- `gmail_thread_url` = `https://mail.google.com/mail/u/0/#all/<threadId>`

> **Note:** The `parse_notes` column must be included in the INSERT. For `parse_status='pending'` rows with a body, `parse_notes` can be null or a brief note. Only omit `parse_notes` if it is genuinely empty.

---

## Step 4 — Report

```
/job-email-inbox complete — [parse_date]

Threads found:     [N total from all 3 Gmail searches]
  Already in inbox: [N thread-duplicates skipped]
  Processed:        [N new threads]

Listings written to listing_inbox:
  pending:              [N]  (ready for daily scan)
    of which subject-parsed: [N]  (HTML-only body — verify fields in daily scan)
  puppeteer_pending:    [N]  (HTML-only — run: node daily_puppeteer.js --pass1-only)
  url_dedup:            [N]  (same URL seen in last 7 days — skipped)
  manual_check:         [N]  (APEC only — visit apec.fr manually)
  errors:               [N]  (if any INSERT failed — list them)

[If puppeteer_pending > 0:]
HTML-only emails queued:
  Run: node daily_puppeteer.js --pass1-only
  Then: /job-search-daily-scan (or it runs automatically at 00:01)
  Sources flagged: Cadremploi, HelloWork (add new sources to html_only_sources in config)

[If manual_check > 0:]
Manual check required (APEC only — emails contain no listing data):
  APEC: [N] alerts — visit https://www.apec.fr/candidat/recherche-emploi.html

[If errors > 0:]
Failed inserts — investigate:
  - [thread subject] ([threadId]): [error message]
```

---

## Step 5 — Puppeteer extraction (local runs only)

If `REMOTE_TRIGGER` environment variable is NOT set (i.e. running locally, not as a nightly cron), run Puppeteer now to convert `puppeteer_pending` rows to `pending` before the daily scan:

```bash
node daily_puppeteer.js --pass1-only
```

**Skip this step if running as a remote trigger** (nightly cron at 23:30) — Puppeteer requires local Edge and cannot run in the remote environment. The `puppeteer_pending` rows will remain until the next local run of `/job-search-daily-scan`, which will detect them in Step 0b and extract them automatically.
