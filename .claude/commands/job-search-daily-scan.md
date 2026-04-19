---
description: Daily Gmail job alert scan agent (Gmail-only). Searches Gmail for job alert emails received in the last 24 hours, analyses each listing using the same criteria as /job-search, writes new entries to Notion, and posts a daily digest. For Indeed direct searches use /job-search-indeed-local or /job-search-indeed-remote. This runs automatically each morning — do not invoke manually unless testing.
argument-hint: Optional. `MM/DD/YY` for a single day, `MM/DD/YY+` to catch up from that date through yesterday, or append `@source` to filter to one sender e.g. `03/26/26+ @linkedin` or `04/14/26 @cadremploi`. Default (no arg) scans yesterday, all sources.
model-note: Schedule this cron on Claude Sonnet (cost-efficient). The tiebreaker rule in Step 5 compensates for Sonnet's weaker judgment on borderline calls by biasing toward Needs Info rather than Skip.
allowed-tools: mcp__claude_ai_Gmail__gmail_search_messages, mcp__claude_ai_Gmail__gmail_read_message, mcp__claude_ai_Gmail__gmail_read_thread, mcp__claude_ai_Gmail__search_threads, mcp__claude_ai_Gmail__get_thread, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-update-page, mcp__claude_ai_Notion__notion-fetch
---

# Daily Job Alert Scan Agent

## Step 0 — Load User Profile

Search Notion for the page titled "⚙️ User Profile & Config" using `mcp__claude_ai_Notion__notion-search`, then fetch the first result using `mcp__claude_ai_Notion__notion-fetch`.
Extract into context:
- **Section 1** — user name and base location
- **Section 2** — salary floors, contract preference, language preference
- **Section 4** — location zones
- **Section 5** — job title alerts (for analysis matching)
- **Section 6** — Gmail alert sources
- **Section 7** — all Notion IDs (Job Applications DB, data source, Daily Scans archive page)
- **Section 9** — lifecycle rules (auto-expiry threshold, dedup window)

If no page is found, halt: "User Profile not found in Notion — run /job-user-setup to create your profile first."

Use all values from the profile throughout. All criteria, IDs, and thresholds below reference the profile.

---

You are running an automated daily job search scan for the user (name from profile). This runs each morning.

Your goal: find all new job listings from yesterday's email alerts, analyse each one,
write results to Notion, and produce a brief digest.

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

Today's date comes from the injected `currentDate` context — use it to compute "yesterday" and to bound the catch-up range. Never scan today itself; alert emails for today are still arriving.

**Automatic catch-up check (runs when $ARGUMENTS is empty):**

If no arguments were given (default daily run), before starting the scan:
1. Use `notion-search` to find all pages titled "Job Alert Scan — " under the Daily Scans archive page (ID from profile Section 7). Sort results by title descending to find the most recent date.
2. Parse the date from the most recent page title (format: "Job Alert Scan — YYYY-MM-DD") and compute gap = yesterday − most-recent-scan-date in days
3. If gap > 1: automatically expand the scan range from (most-recent-scan-date + 1 day) through yesterday.
   Add a note at the top of each digest section: "⚠️ Catch-up scan (missed [N] days)"
4. If gap = 1 or 0: normal single-day scan (yesterday only)
5. If no subpages found: scan yesterday only (first run)

**Run Steps 2 through 7 once per date in the resolved list**, in chronological order. Each date gets its own Gmail/Indeed sweep, its own dedup pass against Notion, and its own dated section in the Daily Scans archive. Do not merge days into one digest — the archive stays cleaner with one section per day, and `/job-review` queue additions remain traceable to a specific day.

For each scan date, search for emails received between 00:00 and 23:59 on that date.

---

## Step 2 — Search Gmail for Job Alerts

Run two Gmail searches using `gmail_search_messages` with `after:` and `before:` date filters (format: `YYYY/MM/DD`).

**Search 1 — All job alert emails (label-based):**
```
label:jobs after:YYYY/MM/DD before:YYYY/MM/DD
```
Most job alert emails (LinkedIn, Indeed, Cadremploi, Michael Page, Robert Half, HelloWork, WTTJ, etc.) arrive pre-labelled "jobs" in Gmail. This single search replaces individual per-source queries.

**Search 2 — APEC alerts:**
```
from:offres@diffusion.apec.fr after:YYYY/MM/DD before:YYYY/MM/DD
```
APEC emails arrive daily from `offres@diffusion.apec.fr` and are now labelled "jobs" (Gmail filter in place). They are also caught by Search 1, so this search is redundant — but kept as an explicit safety net.

> **APEC content limitation**: APEC emails are HTML-only with no plain-text fallback. `get_thread` returns no body content. Do NOT attempt to call `get_thread` on APEC threads — it will return nothing useful. Instead, when an APEC thread is found: read the subject line for the total count (e.g. "17 offres Apec du 14/04/2026") and the snippet for the matching count ("N offres correspondent à votre recherche"), log both in the daily digest under a **"APEC — manual check required"** section, and skip to the next thread. The actual listings must be checked by logging into apec.fr directly.

> **Cadremploi HTML-only handling — three-rung ladder:**
> Cadremploi emails often have no plain-text body. When a Cadremploi thread returns no `plaintextBody`:
>
> **Rung 1 — Snippet parsing (always try first):**
> Parse the Gmail snippet for a company name (e.g. "Postulez chez Acme" → company = Acme) and the subject for listing count ("1 offre à ne rater" → single listing). If company + single-listing signal found: construct a minimal listing entry (title from alert keyword, company from snippet) and proceed to dedup. If a `cadremploi.fr` URL appears in the snippet: proceed to Rung 2.
>
> **Rung 2 — WebFetch on listing URL:**
> If a `cadremploi.fr/emploi/...` URL is found, call WebFetch: "Extract job title, company, location, salary, contract type, seniority, hybrid/remote policy." If it succeeds: use extracted data. If blocked or empty: proceed to Rung 3.
>
> **Rung 3 — Manual check fallback:**
> Log under "Cadremploi — manual check needed" in the digest with the Gmail thread link and snippet. (OpenClaw browser rendering will replace this rung once OpenClaw MCP is configured.)

**Search 3 — Recruiter/direct outreach (not labelled):**
```
-label:jobs -from:offres@diffusion.apec.fr subject:(candidature OR opportunité OR poste OR recrutement OR "Finance Director" OR "Directeur Financier" OR "FP&A" OR "Contrôleur de Gestion") after:YYYY/MM/DD before:YYYY/MM/DD
```
Excludes both labelled emails and APEC (already caught by Search 2) to prevent double-counting.

**Pre-screening before thread reads (saves tokens on known duplicates):**

Gmail search results include `subject` and `snippet` at no extra cost. Use these to avoid reading threads for listings already in Notion. Note: alert subjects contain the *alert keyword* (e.g. "Contrôleur de Gestion"), not the actual stored job title — so do NOT use the subject keyword as part of the Notion search.

For each matched message:

1. Parse the snippet for a company name (e.g. `"Dolphin Semiconductor vous propose..."` → company = Dolphin Semiconductor).
   - If company is **not** identifiable (e.g. Cadremploi "3 offres d'emploi trouvées") → proceed to `gmail_read_thread` immediately. Cannot pre-screen.

2. If company IS identifiable, check the subject for listing-count signals:
   - **Single-listing** ("1 nouvel emploi", "vous propose une offre", "1 offre à ne rater") → this alert contains exactly one listing from this company.
   - **Multi-listing** ("N nouvelles offres", "Nouvelles offres chez [Company]") → may contain new listings even if company is known → proceed to thread read.

3. If company identifiable AND single-listing signal:
   - Call `mcp__claude_ai_Notion__notion-search` for `"[Company]"` with `created_date_range` of last 30 days.
   - Match found → skip `gmail_read_thread`, log as duplicate.
   - No match → proceed to thread read (genuinely new listing).

4. If multi-listing or signal ambiguous → proceed to `gmail_read_thread`.

Only call `gmail_read_thread` for threads that passed pre-screening or could not be pre-screened.

---

## Step 3 — Extract Individual Job Listings

From each email, extract every distinct job listing. Job alert emails often contain multiple listings.

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
  1. If the URL contains `jk=XXXXXXX` (either a direct `/viewjob?jk=` or embedded in a `pagead/clk` URL) → extract the jk value and store `https://fr.indeed.com/viewjob?jk=XXXXXXX`. This is the canonical, stable URL.
  2. If the URL is a short Indeed link (`to.indeed.com/...`) → store it as-is.
  3. If the URL is a LinkedIn job URL → store it as-is.
  4. If no URL at all → store `"Not available"` explicitly. **Never leave the field blank.**
  Pagead URLs contain `jk=` embedded in their query string — always extract it rather than storing the full tracking URL.
- Contract type (CDI / CDD / Interim)

---

## Step 4 — Deduplicate Against Notion

Database ID: from profile Section 7 (Job Applications DB)

**Pre-dedup title normalisation:**
Before searching, expand known abbreviations in both the extracted title and the search string:
- RAF ↔ Responsable Administratif Financier
- DAF ↔ Directeur Administratif Financier
- CDG ↔ Contrôleur de Gestion
- FBP ↔ Finance Business Partner
Search for both the original and expanded forms if the title contains one of these.

**Standard dedup check:**
For each extracted listing, call `mcp__claude_ai_Notion__notion-search` with:
- `query`: `"[Company] [Normalised Title]"`
- `data_source_url`: `collection://[Job Applications data source ID from profile Section 7]`
- `filters`: `created_date_range` start = today minus 30 days

This searches **within the Job Applications database only** — far more reliable than a workspace-wide URL search.

For each result returned:
1. Check if **Company** matches the new listing's company (case-insensitive, partial match ok)
   AND **Job Title** normalises to the same root as the new listing's title.
2. If both match → **duplicate**. Skip. Log as duplicate in digest.
3. If only company matches but title clearly differs → different role, not a duplicate. Proceed.

If no results returned → proceed to write (genuinely new).

**URL confirmation (second pass — only when company matches but title is ambiguous):**
Extract the job ID from both URLs:
- Indeed: `jk=` value (strip leading zeros before comparing)
- LinkedIn: numeric job ID from `linkedin.com/jobs/view/[ID]/`
If job IDs match → duplicate. Skip.

**Catch-up overlap warning:**
When $ARGUMENTS contains a date range (catch-up mode), before processing each date
use `notion-search` to find a subpage titled "Job Alert Scan — [YYYY-MM-DD]" under the Daily Scans archive page.
If found → the trigger already scanned that date. Prepend to that day's digest:
`⚠️ This date was already scanned by the trigger — check Notion for any duplicates.`
Do not skip the date; flag it clearly so manual review is easy.

Only process listings that pass the dedup check.

---

## Step 5 — Analyse Each New Listing

Apply the same criteria as the `/job-search` skill for each new listing.

**Rescue gate (apply FIRST)**: Alert emails and Indeed postings routinely omit salary, hybrid policy, and full scope. Do NOT downgrade plausible finance matches to C or Skip just because the listing is incomplete.

If ALL of the following are true:
1. Title family matches (Finance Director, FP&A, Controlling, P2P, Supply Chain Finance, Procurement at senior level)
2. Location is 🟢 Green, 🟡 Yellow, or 🌐 Remote
3. No hard disqualifier (Paris on-site, explicitly junior, wrong function, salary stated below €45K)

...AND any of Salary, Hybrid policy, Full scope, or Company name is missing, route the listing to the review queue:
- `Status = "Needs Info"`
- `Priority = B` (provisional)
- `Missing Info` — populate with the fields that are missing
- `Notes` — start with `"QUEUED:"` followed by a one-line summary of what is needed

Only if the listing has enough information to rank it does Step 5 proceed to the standard A/B/C/Skip assignment below.

**Tiebreaker rule:** When it is genuinely unclear whether a listing clears the rescue gate, always route to `Needs Info`. The cost of a false-negative (missed application) is higher than the cost of a false-positive (30 seconds in `/job-review`). Only assign Dismissed or C when a disqualifier is unambiguous — not just probable.

---

### Standard priority criteria

**Candidate profile**: Finance Director / FP&A, Grenoble base, English preference, salary floor €55K

**Location zones:**
- 🟢 Green (0–25 min): Grenoble, Échirolles, Meylan, Saint-Égrève, Pont-de-Claix, Montbonnot, Crolles, Voreppe, Bernin, Saint-Martin-d'Hères, and all dept 38 core towns
- 🟡 Yellow (30–50 min): Voiron, Moirans, Chambéry, Saint-Marcellin, Pontcharra
- 🟠 Orange (1h–1h45): Valence, Annecy, Ugine, Faverges, Cluses, Bourg-en-Bresse, Albertville
- 🔴 Red (1h15+ / no hybrid): Lyon, La Tour-en-Maurienne, Paris, Luxembourg
- Dept 73: check specific town. Dept 01: usually Orange/Red.

**Priority rules:**
- 🟢 A: Senior finance/FP&A/controlling, Green or Yellow zone, CDI, English exposure, ≥€55K
- 🟡 B: Good fit on 3/4 criteria; or Tier A company with one weakness
- 🔴 C: Multiple mismatches or one disqualifying factor
- ⛔ Dismissed: Definitive disqualifier (Paris on-site, clearly junior, <€40K stated, unrelated role) → **do not skip silently**. Write to Notion with `Status = "Dismissed"`, populate `Red Flags` with the applicable reason(s) (Far location / Below salary / Junior scope / Off-topic), and set `Notes = "Auto-dismissed: [reason in one phrase]"`. All other fields (title, company, URL, alert keyword) still populated normally.

**Red flags to check:**
- Salary below €55K or not disclosed
- French-only role at international company
- Scope below Director level
- Orange/Red zone without hybrid confirmed
- Agency opacity (no company name, vague scope)
- CDD/interim without strong justification

---

## Step 6 — Write to Notion

Write **every** listing to Notion — including dismissed ones. No listing is silently discarded.
Call `mcp__claude_ai_Notion__notion-create-pages` with:
```
parent: { type: "data_source_id", data_source_id: "[Job Applications data source ID from profile Section 7]" }
```

Properties (SQLite format):

| Property | Value |
|---|---|
| `Job Title` | extracted title (string) |
| `Company` | company name or `"Not disclosed"` |
| `Source` | one of: `Indeed` / `LinkedIn` / `Direct` / `Referral` / `Other` |
| `Location` | city + dept (string) |
| `Salary` | as stated or `"Not stated"` |
| `Priority` | `A` / `B` / `C` (omit if Skip) |
| `CV Approach` | one of: `Standard` / `FP&A Focus` / `Cost Control Focus` / `Transformation Focus` |
| `Status` | `To Assess` for ranked listings; `Needs Info` if rescue gate applied; `Dismissed` if definitive disqualifier. (`Potentially Apply` and `To Apply` set later by `/job-review`) |
| `date:Date Added:start` | today as ISO string e.g. `"2026-04-12"` |
| `Job URL` | URL string if available |
| `Gmail Thread URL` | `https://mail.google.com/mail/u/0/#all/[threadId]` if from Gmail |
| `Red Flags` | JSON array string e.g. `"[\"Low salary\"]"` — from: `Low salary`, `French only`, `No hybrid`, `Far location`, `Fixed-term`, `Junior scope`, `Off-topic` |
| `Missing Info` | JSON array string e.g. `"[\"Salary\", \"Hybrid policy\"]"` — from: `Salary`, `Hybrid policy`, `Scope`, `Full JD`, `Company name`. Populate when rescue gate applied |
| `Alert Keyword` | The alert search term extracted from the email subject (e.g. `"Directeur Financier"`, `"FP&A Grenoble"`) |
| `Notes` | 2–3 sentence analysis; if rescue gate applied, start with `"QUEUED:"`; if dismissed, start with `"Auto-dismissed: [reason]"` |
| `English` | `"__YES__"` if English mentioned, otherwise `"__NO__"` |

---

## Step 6B — Application Response Check (runs once per daily scan, not per date)

After completing all date iterations, run this check once for all active applications.
This is the same logic as `/job-status` — running it here means the daily scan handles
response tracking automatically without needing a separate manual run.

**Fetch active applications:**
Search the Job Applications database for rows with `Status = "Applied"` or `Status = "Interview"`.

**For each, search Gmail for response emails:**
```
"[Company]" (entretien OR interview OR candidature OR retenu OR sélectionné OR refusé OR rejected OR suite OR félicitations OR offer) after:YYYY/MM/DD -label:jobs
```
Use the row's `Date Applied` (or `Date Added` as fallback) for `after:`.

**Classify any found thread:**
- **Interview** → subject/body contains: entretien, interview, rendez-vous, call, visio, rencontrer
- **Offer** → contains: offre, proposition, félicitations, offer letter, package
- **Rejected** → contains: refusé, ne correspond pas, other candidates, poursuivons sans, candidature n'a pas été retenue
- **Unknown** → can't classify — include in digest for manual review

**Auto-expiry:**
If `Date Applied` is more than **60 days** ago and no response found → update Notion:
- `Status: Dismissed`
- `Notes`: append `" | Auto-expired: no response after 60 days"`
Do NOT alert Zack for auto-expiries — just log them in the digest.

**Update Notion for any responses found:**
- `Status` → Interview / Rejected / Offer
- `date:Date Response:start` → today's date
- `Gmail Thread URL` → `https://mail.google.com/mail/u/0/#all/[threadId]`
- `Notes` → append `" | [Status] detected by daily scan [date]"`

**Silent if nothing found** — only include in the digest if there are actual updates.

**Follow-up nudge (runs after response check):**

For each `Applied` row where:
- Date Applied is between 14 and 45 days ago
- No response found in Gmail during this check
- Notes field does NOT contain "follow-up sent" or "relance" (case-insensitive)

Add to the digest under a **"Consider Following Up"** section:
- "[Title] @ [Company] — applied [N] days ago, no response detected"

Do NOT change Status or Notes. Only show this section if at least one row qualifies.
Do NOT include rows already auto-expired (>60 days).

---

## Step 7 — Create Scan Subpage in Daily Scans Archive

After processing all listings for a date, create a **new subpage** under the Daily Scans archive page — one subpage per scan date. This makes each day's digest independently fetchable and diagnosable.

**Daily Scans archive page ID:** from profile Section 7 (Daily Scans archive)

Call `mcp__claude_ai_Notion__notion-create-pages` with:
```
parent: { type: "page_id", page_id: "[Daily Scans archive page ID from profile Section 7]" }
title: "Job Alert Scan — YYYY-MM-DD"   ← use the SCAN DATE (the date whose emails were searched, i.e. yesterday for a default run), not today's date
```

Then call `mcp__claude_ai_Notion__notion-update-page` to write the content body:

```markdown
📊 **[N] new listings today  ·  [N] pursued  ·  [N] dismissed**
*(+[N] duplicates already in Notion — not counted in today's totals)*

**Written to Notion:** [N]  ·  **Queued for review:** [N]

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

Each scan date gets its own subpage. The title "Job Alert Scan — YYYY-MM-DD" is the key used by `/job-morning` and catch-up logic to locate and read prior scan results.
