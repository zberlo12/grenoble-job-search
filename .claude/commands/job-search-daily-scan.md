---
description: Daily Gmail job alert scan agent (Gmail-only). Searches Gmail for job alert emails received in the last 24 hours, analyses each listing using the same criteria as /job-search, writes new entries to Notion, and posts a daily digest. For Indeed direct searches use /job-search-indeed-local or /job-search-indeed-remote. This runs automatically each morning — do not invoke manually unless testing.
argument-hint: Optional. `MM/DD/YY` for a single day, `MM/DD/YY+` to catch up from that date through yesterday, or append `@source` to filter to one sender e.g. `03/26/26+ @linkedin` or `04/14/26 @cadremploi`. Default (no arg) scans yesterday, all sources.
model-note: Schedule this cron on Claude Sonnet (cost-efficient). The tiebreaker rule in Step 5 compensates for Sonnet's weaker judgment on borderline calls by biasing toward Needs Info rather than Skip.
allowed-tools: mcp__claude_ai_Gmail__gmail_search_messages, mcp__claude_ai_Gmail__gmail_read_message, mcp__claude_ai_Gmail__gmail_read_thread, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-update-page
---

# Daily Job Alert Scan Agent

You are running an automated daily job search scan for a senior Finance Director / FP&A
professional (Zack) based in Grenoble, France. This runs at 08:00 each morning.

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

Database ID: `09b29be7bb764b16b173321f469b01e2`

For each extracted listing that was not already discarded by Gmail pre-screening (Step 2), call `mcp__claude_ai_Notion__notion-search` with a **30-day `created_date_range` filter** (start: today minus 30 days):

- If a Job URL exists, search for it — if any result's URL or `jk=` job ID matches, skip this listing.
- If no URL, search `"[Company] [Job Title]"` — if a match is found within the last 30 days, skip.

The 30-day window is safe: same company posting a *different* role within 30 days will not be caught because the search includes the job title. Only the exact same company+title combination within 30 days is treated as a duplicate.

Only process listings that are not already in Notion.

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

**Tiebreaker rule:** When it is genuinely unclear whether a listing clears the rescue gate, always route to `Needs Info`. The cost of a false-negative (missed application) is higher than the cost of a false-positive (30 seconds in `/job-review`). Only assign Skip or C when a disqualifier is unambiguous — not just probable.

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
- ⛔ Skip: Definitive disqualifier (Paris on-site, clearly junior, <€40K stated, unrelated role)

**Red flags to check:**
- Salary below €55K or not disclosed
- French-only role at international company
- Scope below Director level
- Orange/Red zone without hybrid confirmed
- Agency opacity (no company name, vague scope)
- CDD/interim without strong justification

---

## Step 6 — Write to Notion

For each new listing (not skipped), call `mcp__claude_ai_Notion__notion-create-pages` with:
```
parent: { type: "data_source_id", data_source_id: "73c7671a-f600-40a1-807a-83375c3160a9" }
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
| `Status` | `To Assess` for ranked listings, or `Needs Info` if rescue gate applied. (Note: `Potentially Apply` and `To Apply` are set later by `/job-review`) |
| `date:Date Added:start` | today as ISO string e.g. `"2026-04-12"` |
| `Job URL` | URL string if available |
| `Gmail Thread URL` | `https://mail.google.com/mail/u/0/#all/[threadId]` if from Gmail |
| `Red Flags` | JSON array string e.g. `"[\"Low salary\"]"` — from: `Low salary`, `French only`, `No hybrid`, `Far location`, `Fixed-term`, `Junior scope` |
| `Missing Info` | JSON array string e.g. `"[\"Salary\", \"Hybrid policy\"]"` — from: `Salary`, `Hybrid policy`, `Scope`, `Full JD`, `Company name`. Populate when rescue gate applied |
| `Notes` | 2–3 sentence analysis; if rescue gate applied, start with `"QUEUED:"` |
| `English` | `"__YES__"` if English mentioned, otherwise `"__NO__"` |

---

## Step 7 — Append Digest to Daily Scans Archive

After processing all listings, append a new dated section to the **Daily Scans** Notion page.

**Daily Scans page ID:** `3402fc3ca02a8169a12ff95493a54064`

Call `mcp__claude_ai_Notion__notion-update-page` with `command: "insert_content_after"`, targeting the last block of the page, with Markdown content in the following format:

```markdown
## Job Alert Scan — [DATE]

**New listings found:** [N]  ·  **Already in Notion (skipped):** [N]  ·  **Written to Notion:** [N]  ·  **Queued for review:** [N]

### By Priority
- 🟢 A: [N] — [titles if any]
- 🟡 B: [N] — [titles if any]
- 🔴 C: [N]
- ⏸️ Needs Info: [N]
- ⛔ Skip: [N]

### Sources
[Breakdown: LinkedIn N, Indeed email N, APEC N, WTTJ N, Cadremploi N, Direct/recruiter N, etc.]

### Needs Info Queue (added today)
- [Title] @ [Company] — missing: [Salary, Hybrid policy, ...]
- [Title] @ [Company] — missing: [Full JD]

### Notable Listings
- [2–3 bullet points for any Priority A finds, or interesting B listings]

---
```

If no new listings were found, append instead:

```markdown
## Job Alert Scan — [DATE]

No new job listings found in alerts for this date.

---
```

The trailing `---` separator keeps day boundaries clear in the archive.
