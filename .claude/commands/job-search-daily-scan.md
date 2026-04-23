---
description: Daily Gmail job alert scan agent (Gmail-only). Searches Gmail for job alert emails received in the last 24 hours, analyses each listing using the same criteria as /job-search, writes new entries to Supabase, and posts a daily digest to the Notion archive. For Indeed direct searches use /job-search-indeed. This runs automatically each morning — do not invoke manually unless testing.
argument-hint: Optional. `MM/DD/YY` for a single day, `MM/DD/YY+` to catch up from that date through yesterday, or append `@source` to filter to one sender e.g. `03/26/26+ @linkedin` or `04/14/26 @cadremploi`. Default (no arg) scans yesterday, all sources.
model-note: Schedule this cron on Claude Sonnet (cost-efficient). The tiebreaker rule in Step 5 compensates for Sonnet's weaker judgment on borderline calls by biasing toward Needs Info rather than Skip.
allowed-tools: mcp__claude_ai_Gmail__search_threads, mcp__claude_ai_Gmail__get_thread, mcp__claude_ai_Indeed__get_job_details, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-update-page, Bash
---

# Daily Job Alert Scan Agent

## Step 0 — Load Config

Run `cat config.json` via Bash. Parse the output and extract:
- `supabase_connection_string` → PG_CONN
- `pg_module_path` → PG_MODULE
- `user.name` → name
- `user.salary_floor_apply` → salary_floor (€55K default)
- `user.salary_floor_reject` → hard_reject (€40K default)
- `location_zones` → green/yellow/orange/red city lists
- `gmail.label` → Gmail label (default: "jobs")
- `notion.daily_scans_archive` → Daily Scans archive page ID
- `lifecycle_rules.dedup_window_days` → dedup window (default: 30)

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

You are running an automated daily job search scan for the user. This runs each morning.

Your goal: find all new job listings from yesterday's email alerts, analyse each one, write results to Supabase, and produce a brief digest in the Notion archive.

---

## Step 1 — Determine Scan Dates

Parse `$ARGUMENTS` into a date range and optional source filter.

**Date formats** (`MM/DD/YY`, e.g. `04/12/26`):
- **Empty** → scan yesterday only.
- **`MM/DD/YY`** → scan that single date only.
- **`MM/DD/YY+`** → scan from that date through yesterday (catch-up mode).

**Optional source filter** — append `@keyword` after the date to restrict Gmail searches to a single sender:
- `03/26/26+ @apec` → only `from:offres@diffusion.apec.fr`
- `04/14/26 @linkedin` → only `from:linkedin.com`
- `04/14/26 @cadremploi` → only `from:alertes.cadremploi.fr`
- `04/14/26 @indeed` → only `from:jobalert.indeed.com`

When a source filter is active, skip the other Gmail searches entirely for that run.

**Known source map:**
| Keyword | Gmail filter |
|---|---|
| `@apec` | `from:offres@diffusion.apec.fr` |
| `@linkedin` | `from:linkedin.com` |
| `@cadremploi` | `from:alertes.cadremploi.fr` |
| `@indeed` | `from:jobalert.indeed.com` |

Today's date comes from the injected `currentDate` context variable — use it to compute "yesterday" and to bound the catch-up range. Never scan today itself; alert emails for today are still arriving.

**Automatic catch-up check (runs when $ARGUMENTS is empty):**

If no arguments were given (default daily run), before starting the scan:
1. Use `notion-search` to find all pages titled "Job Alert Scan — " under the Daily Scans archive page (ID from config `notion.daily_scans_archive`). Sort results by title descending to find the most recent date.
2. Parse the date from the most recent page title (format: "Job Alert Scan — YYYY-MM-DD") and compute gap = yesterday − most-recent-scan-date in days.
3. If gap > 1: automatically expand the scan range from (most-recent-scan-date + 1 day) through yesterday.
   Add a note at the top of each digest section: "⚠️ Catch-up scan (missed [N] days)"
4. If gap = 1 or 0: normal single-day scan (yesterday only)
5. If no subpages found: scan yesterday only (first run)

**Run Steps 2 through 7 once per date in the resolved list**, in chronological order. Each date gets its own Gmail/Indeed sweep, its own dedup pass against Supabase, and its own dated section in the Daily Scans archive. Do not merge days into one digest.

For each scan date, search for emails received between 00:00 and 23:59 on that date.

---

## Step 2 — Search Gmail for Job Alerts

Run two Gmail searches using `search_threads` with `after:` and `before:` date filters (format: `YYYY/MM/DD`). Use (scan_date) for `after` and (scan_date + 1 day) for `before` to capture the full day.

**Search 1 — All job alert emails (label-based):**
```
label:jobs after:YYYY/MM/DD before:YYYY/MM/DD
```

**Search 2 — APEC alerts:**
```
from:offres@diffusion.apec.fr after:YYYY/MM/DD before:YYYY/MM/DD
```

> **APEC content limitation**: APEC emails are HTML-only with no plain-text fallback. `get_thread` returns no body content. Do NOT attempt to call `get_thread` on APEC threads — it will return nothing useful. Instead, when an APEC thread is found: read the subject line for the total count (e.g. "17 offres Apec du 14/04/2026") and the snippet for the matching count, log both in the daily digest under a **"APEC — manual check required"** section, and skip to the next thread.

> **Cadremploi HTML-only handling — three-rung ladder:**
> Cadremploi emails often have no plain-text body. When a Cadremploi thread returns no `plaintextBody`:
>
> **Rung 1 — Snippet parsing (always try first):**
> Parse the Gmail snippet for a company name and the subject for listing count. If company + single-listing signal found: construct a minimal listing entry and proceed to dedup.
>
> **Rung 2 — WebFetch on listing URL:**
> If a `cadremploi.fr/emploi/...` URL is found, call WebFetch. If blocked or empty: proceed to Rung 3.
>
> **Rung 3 — Manual check fallback:**
> Log under "Cadremploi — manual check needed" in the digest with the Gmail thread link and snippet.

**Search 3 — Recruiter/direct outreach (not labelled):**
```
-label:jobs -from:offres@diffusion.apec.fr subject:(candidature OR opportunité OR poste OR recrutement OR "Finance Director" OR "Directeur Financier" OR "FP&A" OR "Contrôleur de Gestion") after:YYYY/MM/DD before:YYYY/MM/DD
```

Read each matched thread via `get_thread`.

---

## Step 3 — Extract Individual Job Listings

From each email, extract every distinct job listing.

**Alert keyword extraction (do this once per thread, before extracting listings):**
Parse the thread subject to extract the alert search term. Try these patterns in order:
1. French: `"pour (.+?) (?:à|en|dans|sur)"` → keyword = match group 1
2. French alt: `"(?:alerte emploi|offres?)\s*:?\s*(.+)"` → keyword = match group 1
3. English: `"for (.+?) (?:near|in|at)"` → keyword = match group 1
4. Fallback: derive from sender domain — `jobalert.indeed.com` → `"Indeed"`, `linkedin.com` → `"LinkedIn"`, `alertes.cadremploi.fr` → `"Cadremploi"`, `offres@diffusion.apec.fr` → `"APEC"`

Clean the result: trim whitespace, strip trailing punctuation. Store as `alert_keyword`.
Apply this value to every listing extracted from this thread.

For each listing, extract:
- Job title
- Company name (or "Not disclosed" if agency)
- Location (city)
- Salary (if stated)
- Job URL / apply link — **always extract a clean, storable URL using this priority:**
  1. If the URL contains `jk=XXXXXXX` → extract the jk value and store `https://fr.indeed.com/viewjob?jk=XXXXXXX`. This is the canonical, stable URL.
  2. If the URL is a short Indeed link (`to.indeed.com/...`) → store it as-is.
  3. If the URL is a LinkedIn job URL → store it as-is.
  4. If no URL at all → store `"Not available"` explicitly. **Never leave the field blank.**
- Contract type (CDI / CDD / Interim)
- Gmail Thread URL: `https://mail.google.com/mail/u/0/#all/<threadId>` — always populate

---

## Step 4 — Deduplicate Against Supabase

**Pre-dedup title normalisation:**
Before searching, expand known abbreviations in both the extracted title and the search string:
- RAF ↔ Responsable Administratif Financier
- DAF ↔ Directeur Administratif Financier
- CDG ↔ Contrôleur de Gestion
- FBP ↔ Finance Business Partner
Search for both the original and expanded forms if the title contains one of these.

**Standard dedup check (run via Bash+node for each extracted listing):**
```sql
SELECT id FROM job_applications
WHERE company ILIKE $1
  AND job_title ILIKE $2
  AND date_added >= CURRENT_DATE - INTERVAL '30 days'
UNION
SELECT id FROM review_queue
WHERE company ILIKE $1
  AND job_title ILIKE $2
  AND date_added >= CURRENT_DATE - INTERVAL '30 days'
LIMIT 1
```

Pass `['%<company>%', '%<title_root>%']`. If any row returned → duplicate, skip. Log as duplicate in digest.

**URL confirmation (second pass — only when company matches but title is ambiguous):**
Extract the job ID from both URLs:
- Indeed: `jk=` value (strip leading zeros before comparing)
- LinkedIn: numeric job ID from `linkedin.com/jobs/view/[ID]/`

```sql
SELECT id FROM job_applications WHERE job_url ILIKE $1
UNION
SELECT id FROM review_queue WHERE job_url ILIKE $1
LIMIT 1
```

If job IDs match → duplicate. Skip.

**Catch-up overlap warning:**
When $ARGUMENTS contains a date range (catch-up mode), before processing each date use `notion-search` to find a subpage titled "Job Alert Scan — [YYYY-MM-DD]" under the Daily Scans archive page. If found → the trigger already scanned that date. Prepend: `⚠️ This date was already scanned by the trigger — check Notion for any duplicates.`

Only process listings that pass the dedup check.

---

## Step 5 — Analyse Each New Listing

Apply the same criteria as `/job-search` for each new listing.

**Rescue gate (apply FIRST)**: Alert emails and Indeed postings routinely omit salary, hybrid policy, and full scope. Do NOT downgrade plausible finance matches to C or Skip just because the listing is incomplete.

If ALL of the following are true:
1. Title family matches (Finance Director, FP&A, Controlling, P2P, Supply Chain Finance, Procurement at senior level)
2. Location is 🟢 Green, 🟡 Yellow, or 🌐 Remote
3. No hard disqualifier (Paris on-site, explicitly junior, wrong function, salary stated below €45K)

...AND any of Salary, Hybrid policy, Full scope, or Company name is missing, route to review queue:
- `status = 'Needs Info'`
- `priority = 'B'` (provisional)
- `missing_info` = array of missing fields (e.g. `["Salary","Hybrid policy"]`)
- `notes` = start with `"QUEUED:"` followed by a one-line summary of what is needed

Only if the listing has enough information to rank it does Step 5 proceed to the standard A/B/C/Skip assignment below.

**Tiebreaker rule:** When it is genuinely unclear whether a listing clears the rescue gate, always route to `Needs Info`. The cost of a false-negative (missed application) is higher than the cost of a false-positive (30 seconds in `/job-review`). Only assign Dismissed or C when a disqualifier is unambiguous — not just probable.

---

### Standard priority criteria

**Candidate profile**: Finance Director / FP&A, Grenoble base, English preference, salary floor €55K

**Location zones** (from config `location_zones`):
- 🟢 Green (0–25 min): Grenoble, Échirolles, Meylan, Saint-Égrève, Pont-de-Claix, Montbonnot, Crolles, Voreppe, Bernin, Saint-Martin-d'Hères, and all dept 38 core towns
- 🟡 Yellow (30–50 min): Voiron, Moirans, Chambéry, Saint-Marcellin, Pontcharra
- 🟠 Orange (1h–1h45): Valence, Annecy, Ugine, Faverges, Cluses, Bourg-en-Bresse, Albertville
- 🔴 Red (1h15+ / no hybrid): Lyon, La Tour-en-Maurienne, Paris, Luxembourg
- Dept 73: check specific town. Dept 01: usually Orange/Red.

**Priority rules:**
- 🟢 A: Senior finance/FP&A/controlling, Green or Yellow zone, CDI, English exposure, ≥€55K → write to `job_applications` with `status = 'To Apply'`
- 🟡 B: Good fit on 3/4 criteria; or Tier A company with one weakness → write to `review_queue` with `status = 'To Assess'`
- 🔴 C: Multiple mismatches or one disqualifying factor → write to `review_queue` with `status = 'To Assess'`
- ⛔ Dismissed: Definitive disqualifier (Paris on-site, clearly junior, <€40K stated, unrelated role) → write to `job_applications` with `status = 'Dismissed'`, populate `red_flags` with reason(s), set `notes = 'Auto-dismissed: [reason]'`

**Red flags to check:**
- Salary below €55K or not disclosed
- French-only role at international company
- Scope below Director level
- Orange/Red zone without hybrid confirmed
- Agency opacity (no company name, vague scope)
- CDD/interim without strong justification

---

## Step 5B — Pre-Write Enrichment (for Needs Info listings only)

Before writing any listing flagged as `Needs Info`, attempt to fill in missing fields immediately.

**Only run this step for listings routed to `status = 'Needs Info'`.** Skip for ranked and Dismissed listings.

Try in order. Stop as soon as one attempt succeeds and fills at least one missing field.

**Rung 1 — Indeed API (for Indeed URLs only):**
If `Job URL` contains `jk=`, extract the job ID and call `mcp__claude_ai_Indeed__get_job_details`.
- If successful: extract salary, contract type, hybrid/remote policy, seniority, scope, language requirements.
- If enrichment resolves ALL missing fields: re-rank using Step 5 criteria. Change `status` to `To Assess` (or `To Apply` if Priority A). Clear `missing_info`.
- If the call errors or returns no useful data: continue to Rung 2.

**Rung 2 — WebFetch (non-LinkedIn, non-Indeed, or if Rung 1 failed):**
If `Job URL` exists and is not LinkedIn, call WebFetch:
> "Extract salary, contract type, location, hybrid/remote policy, seniority, scope of role, language requirements. Return as structured fields only."
- Same handling as Rung 1 success above.
- If blocked/empty/404: continue to Rung 3.

**Rung 3 — LinkedIn short-circuit:**
If `Job URL` is LinkedIn, skip enrichment entirely. Write to review_queue as `Needs Info` unchanged.

**Rung 4 — No URL / all rungs failed:**
Write to review_queue as `Needs Info` unchanged.

**Context-hygiene:** Discard full JD text after extracting fields. Store only the structured fields that fill gaps in notes.

---

## Step 6 — Write to Supabase

Write **every** listing to Supabase — including dismissed ones. No listing is silently discarded.

**Routing table:**

| Outcome | Table | Status |
|---|---|---|
| Priority A (all data present) | `job_applications` | `To Apply` |
| Priority B / C (ranked) | `review_queue` | `To Assess` |
| Rescue gate triggered (missing info) | `review_queue` | `Needs Info` |
| Dismissed (definitive disqualifier) | `job_applications` | `Dismissed` |

**For `review_queue` rows** (To Assess, Needs Info):
```sql
INSERT INTO review_queue
(job_title,company,source,location,salary,priority,status,date_added,
 job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
RETURNING id
```

**For `job_applications` rows** (To Apply, Dismissed):
```sql
INSERT INTO job_applications
(job_title,company,source,location,salary,priority,cv_approach,status,date_added,
 job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
RETURNING id
```

**Field values:**
- `source`: `'Indeed'` / `'LinkedIn'` / `'Direct'` / `'Other'` (derived from email sender)
- `date_added`: the **SCAN DATE** as `'YYYY-MM-DD'` (yesterday for a default run, not today)
- `red_flags`: `JSON.stringify([...])` — valid values: `"Low salary"`, `"French only"`, `"No hybrid"`, `"Far location"`, `"Fixed-term"`, `"Junior scope"`, `"Off-topic"`
- `missing_info`: `JSON.stringify([...])` — valid values: `"Salary"`, `"Hybrid policy"`, `"Scope"`, `"Full JD"`, `"Company name"`
- `english`: `true` if English mentioned, `false` otherwise (boolean — not a string)
- `cv_approach`: assign for job_applications only — `'FP&A Focus'` / `'Cost Control Focus'` / `'Standard'` / `'Transformation Focus'`
- `job_description`: full JD text truncated to ~4000 chars if needed. Leave null only if no JD was obtainable.

---

## Step 6B — Application Response Check (runs once per daily scan, not per date)

After completing all date iterations, run this check once for all active applications.

**Fetch active applications:**
```sql
SELECT id, company, job_title, date_applied, date_added, notes, gmail_thread_url
FROM job_applications
WHERE status IN ('Applied', 'Interview')
```

**For each, search Gmail for response emails:**
```
"[Company]" (entretien OR interview OR candidature OR retenu OR sélectionné OR refusé OR rejected OR suite OR félicitations OR offer) after:YYYY/MM/DD -label:jobs
```
Use the row's `date_applied` (or `date_added` as fallback) formatted as `YYYY/MM/DD` for `after:`.

**Classify any found thread:**
- **Interview** → subject/body contains: entretien, interview, rendez-vous, call, visio, rencontrer
- **Offer** → contains: offre, proposition, félicitations, offer letter, package
- **Rejected** → contains: refusé, ne correspond pas, other candidates, poursuivons sans, candidature n'a pas été retenue
- **Unknown** → can't classify — include in digest for manual review

**Update Supabase for any responses found:**
```sql
UPDATE job_applications
SET status=$1,
    date_response=CURRENT_DATE,
    notes=COALESCE(notes,'')||$2,
    gmail_thread_url=COALESCE(NULLIF(gmail_thread_url,''),$3)
WHERE id=$4
```
Pass `[new_status, ' | [Status] detected by daily scan [date]', thread_url, row_id]`.

**Auto-expiry (Applied rows only):**
```sql
UPDATE job_applications
SET status='Dismissed',
    notes=COALESCE(notes,'')||' | Auto-expired: no response after 60 days'
WHERE status='Applied'
  AND date_applied < CURRENT_DATE - INTERVAL '60 days'
  AND COALESCE(notes,'') NOT LIKE '%Auto-expired%'
RETURNING id, job_title, company
```
Do NOT alert Zack for auto-expiries — log them in the digest only.

**Follow-up nudge (runs after response check):**

For each `Applied` row where:
- date_applied is between 14 and 45 days ago
- No response found in Gmail during this check
- notes field does NOT contain "follow-up sent" or "relance" (case-insensitive)

Add to the digest under a **"Consider Following Up"** section:
- "[Title] @ [Company] — applied [N] days ago, no response detected"

Do NOT change Status or Notes. Do NOT include rows already auto-expired (>60 days).

---

## Step 7 — Create Scan Subpage in Daily Scans Archive

After processing all listings for a date, create a **new subpage** under the Daily Scans archive page — one subpage per scan date.

**Daily Scans archive page ID:** from config `notion.daily_scans_archive`

Call `notion-create-pages` with:
```
parent: { type: "page_id", page_id: "[daily_scans_archive from config]" }
title: "Job Alert Scan — YYYY-MM-DD"   ← the SCAN DATE (yesterday for a default run), not today
```

Then call `notion-update-page` to write the content body:

```markdown
📊 **[N] new listings today  ·  [N] pursued  ·  [N] dismissed**
*(+[N] duplicates already in Supabase — not counted in today's totals)*

**Written to Supabase:** [N]  ·  **Queued for review:** [N]

### By Priority
- 🟢 A: [N] — [titles if any]
- 🟡 B: [N] — [titles if any]
- 🔴 C: [N]
- ⏸️ Needs Info: [N]
- ⛔ Dismissed: [N] — top reason: [most common Red Flag among dismissed rows]

### Sources
[Breakdown: LinkedIn N, Indeed email N, APEC N, WTTJ N, Cadremploi N, Direct/recruiter N, etc.]

### Needs Info Queue (added today)
- [Title] @ [Company] — missing: [Salary, Hybrid policy, ...]
- [Title] @ [Company] — missing: [Full JD]

### Notable Listings
- [2–3 bullet points for any Priority A finds, or interesting B listings]
```

If no new listings were found, write instead:
```markdown
No new job listings found in alerts for this date.
```

**Also write a row to scan_archive:**
```sql
INSERT INTO scan_archive
(scan_date, digest_text, total_found, potentially_apply, needs_info, to_assess, dismissed)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (scan_date) DO UPDATE SET
  digest_text=EXCLUDED.digest_text,
  total_found=EXCLUDED.total_found,
  potentially_apply=EXCLUDED.potentially_apply,
  needs_info=EXCLUDED.needs_info,
  to_assess=EXCLUDED.to_assess,
  dismissed=EXCLUDED.dismissed
```
Pass `[scan_date, digest_summary_text, total_new, priority_a_count, needs_info_count, to_assess_count, dismissed_count]`.
