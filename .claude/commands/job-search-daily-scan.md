---
description: Daily Gmail job alert scan agent. Searches Gmail for job alert emails received in the last 24 hours, analyses each listing using the same criteria as /job-search, writes new entries to Notion, and posts a daily digest. This runs automatically each morning — do not invoke manually unless testing.
argument-hint: Optional date override (YYYY-MM-DD) to scan a specific day instead of yesterday
allowed-tools: mcp__claude_ai_Gmail__gmail_search_messages, mcp__claude_ai_Gmail__gmail_read_message, mcp__claude_ai_Gmail__gmail_read_thread, mcp__claude_ai_Indeed__search_jobs, mcp__claude_ai_Indeed__get_job_details, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-update-page
---

# Daily Job Alert Scan Agent

You are running an automated daily job search scan for a senior Finance Director / FP&A
professional (Zack) based in Grenoble, France. This runs at 08:00 each morning.

Your goal: find all new job listings from yesterday's email alerts, analyse each one,
write results to Notion, and produce a brief digest.

---

## Step 1 — Determine Date Range

Scan date: $ARGUMENTS (if provided) or yesterday's date.
Search for emails received between 00:00 and 23:59 on that date.

---

## Step 2 — Search Gmail for Job Alerts

Run Gmail searches for each of the following. Use `gmail_search_messages` with `after:` and `before:` date filters.

**Alert sources to search:**
```
from:jobalerts@linkedin.com
from:@indeed.com OR from:@fr.indeed.com
from:@welcometothejungle.com
from:@apec.fr
from:@cadremploi.fr
from:@michaelpage.fr OR from:@michaelpage.com
from:@roberthalf.fr OR from:@roberthalf.com
from:@hellowork.com
```

**Recruiter/direct outreach (supplement):**
```
subject:(candidature OR opportunité OR poste OR recrutement OR "Finance Director" OR "Directeur Financier" OR "FP&A" OR "Contrôleur de Gestion")
```

Read the full content of each matching email thread using `gmail_read_thread`.

---

## Step 2b — Indeed Direct Search

Search Indeed for new listings using `mcp__claude_ai_Indeed__search_jobs` with location `"Grenoble, France"`.
Run one search per title group below. Collect all job IDs returned, then use `mcp__claude_ai_Indeed__get_job_details` for any title that looks relevant before deduplification.

**French title searches:**
- `Contrôleur de Gestion` / `Responsable Contrôle de Gestion`
- `Finance Business Partner` / `Responsable Administratif et Financier`
- `Responsable Comptabilité` / `Chef Comptable`
- `Responsable P2P` / `Responsable Procure-to-Pay`
- `Acheteur Senior` / `Responsable Achats`
- `Demand Planner` / `Supply Chain Planner` / `Responsable Supply Chain`
- `Directeur Financier` / `RAF`

**English title searches:**
- `Financial Controller` / `Finance Manager`
- `Accounting Manager` / `Cost Controller`
- `FP&A Manager` / `Finance Business Partner`
- `P2P Manager` / `Procurement Manager`
- `Senior Buyer` / `Supply Chain Manager`

Add all retrieved listings to the pool for deduplication in Step 4.

---

## Step 3 — Extract Individual Job Listings

From each email, extract every distinct job listing. Job alert emails often contain multiple listings.

For each listing, extract:
- Job title
- Company name (or "Not disclosed" if agency)
- Location (city)
- Salary (if stated)
- Job URL / apply link
- Contract type (CDI / CDD / Interim)

---

## Step 4 — Deduplicate Against Notion

Database ID: `09b29be7bb764b16b173321f469b01e2`

For each extracted listing, call `mcp__claude_ai_Notion__notion-search`:
- If a Job URL exists, search for it — if any result's URL matches, skip this listing
- If no URL, search `[Company] [Job Title]` — if a match is found, skip

Only process listings that are not already in Notion.

---

## Step 5 — Analyse Each New Listing

Apply the same criteria as the `/job-search` skill for each new listing:

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
| `Status` | `To Assess` |
| `date:Date Added:start` | today as ISO string e.g. `"2026-04-12"` |
| `Job URL` | URL string if available |
| `Gmail Thread URL` | `https://mail.google.com/mail/u/0/#all/[threadId]` if from Gmail |
| `Red Flags` | JSON array string e.g. `"[\"Low salary\"]"` — from: `Low salary`, `French only`, `No hybrid`, `Far location`, `Fixed-term`, `Junior scope` |
| `Notes` | 2–3 sentence analysis |
| `English` | `"__YES__"` if English mentioned, otherwise `"__NO__"` |

---

## Step 7 — Daily Digest

After processing all listings, output a brief digest:

```
## Job Alert Scan — [DATE]

**New listings found:** [N]
**Already in Notion (skipped):** [N]
**Written to Notion:** [N]

### By Priority
🟢 A: [N] — [titles if any]
🟡 B: [N] — [titles if any]
🔴 C: [N]
⛔ Skip: [N]

### Sources
[Breakdown by source: LinkedIn N, Indeed N, etc.]

### Notable Listings
[2–3 bullet points for any Priority A finds, or interesting B listings]
```

If no new listings were found, output:
```
## Job Alert Scan — [DATE]
No new job listings found in alerts for this date.
```
