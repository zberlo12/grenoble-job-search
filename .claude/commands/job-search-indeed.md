---
description: Manual Indeed job search for Grenoble area and/or remote France-wide roles. Asks whether to search locally, remotely, or both, then runs grouped searches, deduplicates against Notion, analyses each listing, and writes new entries. Use when you want to sweep Indeed directly — separate from the daily Gmail scan.
argument-hint: Optional. Leave empty to be prompted. Or pass "local", "remote", or "both".
allowed-tools: mcp__claude_ai_Indeed__search_jobs, mcp__claude_ai_Indeed__get_job_details, mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-create-pages, AskUserQuestion
---

# Indeed Job Search — Grenoble / Remote

## Step 0 — Load User Profile

Search Notion for the page titled "⚙️ User Profile & Config" using `mcp__claude_ai_Notion__notion-search`, then fetch the first result using `mcp__claude_ai_Notion__notion-fetch`.
Extract into context:
- **Section 1** — user name, base location (used to set search location)
- **Section 2** — salary floors, contract preference, language preference
- **Section 4** — location zones
- **Section 5** — job title alerts (use these as search groups — see below)
- **Section 7** — Notion IDs (Job Applications DB and data source IDs)
- **Section 9** — lifecycle rules (dedup window)

If no page is found, halt: "User Profile not found in Notion — run /job-user-setup to create your profile first."

**Search groups below come from profile Section 5.** The groups listed in Steps 2A/2B are the
default set for this user — a new user should update Section 5 of their profile to replace them.

---

You are running a manual Indeed job search sweep for the user (name from profile) based in
the location from their profile.

---

## Step 1 — Determine Scope

If `$ARGUMENTS` is "local", "remote", or "both" — use that. Otherwise ask:

> "Search locally (Grenoble ~50km), remotely (France-wide), or both?"

- **local** → run Local searches only (Step 2A)
- **remote** → run Remote searches only (Step 2B)
- **both** → run both

---

## Step 2A — Local Searches (Grenoble ~50km)

Run **5 search groups** with `location: "Grenoble, France"`, `country_code: "FR"`, `job_type: "fulltime"`.

Then run groups 1 and 2 again with `location: "Chambéry, France"` to capture Yellow-zone roles (Voiron, Moirans, Pontcharra, Chambéry) that may not surface in the Grenoble radius.

### Local search groups

**Group 1 — FP&A / Controller / CDG:**
`"Contrôleur de Gestion OR Financial Controller OR FP&A Manager OR Finance Business Partner OR Responsable Contrôle de Gestion OR Responsable FP&A OR Responsable Planification Financière OR Contrôleur de Gestion Senior OR Pilote Financier"`

**Group 2 — RAF / DAF / Finance Director:**
`"Responsable Administratif Financier OR RAF OR Directeur Financier OR Directeur Administratif et Financier OR DAF OR Finance Manager OR Finance Director OR Head of Finance OR Finance Lead OR Responsable Finance et Comptabilité"`

**Group 3 — Cost Control / Comptabilité / Consolidation / Trésorerie:**
`"Cost Controller OR Contrôleur de Gestion Industriel OR Responsable Comptabilité OR Chef Comptable OR Business Controller OR Consolidation Manager OR Responsable Consolidation OR Responsable Trésorerie OR Trésorier d'Entreprise"`

**Group 4 — P2P / Procurement / Achats:**
`"Responsable P2P OR Responsable Procure-to-Pay OR P2P Manager OR Procurement Manager OR Responsable Achats OR Acheteur Senior OR Directeur Achats OR Responsable Achats Indirects"`

**Group 5 — Supply Chain / Planning / S&OP:**
`"Demand Planner OR Supply Chain Planner OR Responsable Supply Chain OR Supply Chain Manager OR Senior Buyer OR S&OP Manager OR Responsable S&OP OR Supply Chain Finance"`

Total: 7 API calls (5 × Grenoble + 2 × Chambéry for groups 1–2). Run all in parallel where possible.

---

## Step 2B — Remote Searches (France-wide)

Run **3 search groups** with `location: "France"`, `country_code: "FR"`, `job_type: "fulltime"`.

**Group 1 — Finance Director / FP&A / Head of Finance / CFO:**
`"Finance Director OR Directeur Financier OR Directeur Administratif et Financier OR DAF OR Financial Controller OR FP&A Manager OR Finance Manager OR Head of Finance OR CFO OR Finance Lead OR Responsable FP&A OR VP Finance"`

> **CFO note**: For any CFO result, verify company size before ranking — appropriate only where CFO = sole Finance Director (typically companies ≤€100M revenue). Skip if the company is clearly large-cap or already has a DAF layer above the CFO title.

**Group 2 — Finance Business Partner / Reporting / Consolidation / Trésorerie:**
`"Finance Business Partner OR Finance Transformation OR Responsable Budget et Reporting OR Consolidation Manager OR Responsable Consolidation OR Responsable Trésorerie OR Responsable Planification Financière OR Group Finance Manager"`

**Group 3 — P2P / Procurement / S&OP:**
`"P2P Manager OR Responsable P2P OR Procurement Manager OR Finance Governance OR Responsable Procure-to-Pay OR S&OP Manager OR Responsable S&OP OR Directeur Achats"`

Total: 3 API calls. Run all in parallel.

---

## Step 3 — Deduplicate Against Notion

Database ID: from profile Section 7 (Job Applications DB)

**Pre-dedup title normalisation:**
Before searching, expand known abbreviations in both the extracted title and the search string:
- RAF ↔ Responsable Administratif Financier
- DAF ↔ Directeur Administratif Financier
- CDG ↔ Contrôleur de Gestion
- FBP ↔ Finance Business Partner
Search for both the original and expanded forms if the title contains one of these.

Collect all results from Steps 2A/2B. Deduplicate across searches first (same job ID = one entry). Then for each unique listing:

- If job ID (`jk=` extracted from URL) matches a Notion entry created in the last 30 days → discard.
- If no URL match, call `mcp__claude_ai_Notion__notion-search` for `"[Company] [Normalised Title]"` within the last 30 days → discard if found.
- Fuzzy check: also search `"[Company]"` alone. If a result's title normalises to the same root as the new listing → flag as "Possible duplicate — manual check" in the summary rather than writing a new row.

Only listings that pass all checks proceed to Step 4.

---

## Step 4 — Analyse Each Listing

### Adjacent title recognition

Indeed searches return listings based on keyword matching, not semantic role equivalence. Before skipping any result on title alone, briefly check whether the **actual role content** (from the snippet or job details) suggests a finance leadership function. Titles to watch for that may not match keywords but describe the same scope:

- "Responsable de Gestion", "Gestionnaire Financier Senior", "Responsable Performance", "Directeur de Site" (if finance scope), "Finance & Operations Manager", "Responsable Administratif"

If the snippet or company context suggests a senior finance function, fetch full details and analyse properly rather than discarding on title.

### Rescue gate (apply FIRST)

Indeed postings routinely omit salary, hybrid policy, and full scope. Do NOT downgrade plausible finance matches to C or Skip just because the listing is incomplete.

If ALL of the following are true:
1. Title family matches (Finance Director, FP&A, Controlling, P2P, Supply Chain Finance, Procurement at senior level)
2. Location is 🟢 Green, 🟡 Yellow, 🌐 Remote, or unspecified for remote search
3. No hard disqualifier (Paris on-site only, explicitly junior, wrong function, salary stated below €45K)

...AND any of Salary, Hybrid policy, Full scope, or Company name is missing → route to review queue:
- `Status = "Needs Info"`, `Priority = B` (provisional)
- `Missing Info` — list the missing fields

**Tiebreaker**: When genuinely unclear, always route to `Needs Info`. Only assign Skip or C when a disqualifier is unambiguous.

### Location zones (local search)

- 🟢 Green (0–25 min): Grenoble, Échirolles, Meylan, Saint-Égrève, Pont-de-Claix, Montbonnot, Crolles, Voreppe, Bernin, Saint-Martin-d'Hères, and all dept 38 core towns
- 🟡 Yellow (30–50 min): Voiron, Moirans, Chambéry, Saint-Marcellin, Pontcharra
- 🟠 Orange (1h–1h45): Valence, Annecy, Ugine, Faverges, Cluses, Bourg-en-Bresse, Albertville
- 🔴 Red (1h15+ / no hybrid): Lyon, La Tour-en-Maurienne, Paris, Luxembourg

For remote search: location zone defaults to 🌐 Remote — assess on role fit and contract type only.

### Priority rules

- 🟢 A: Senior finance/FP&A/controlling, Green/Yellow/Remote, CDI, English exposure, ≥€55K
- 🟡 B: Good fit on 3/4 criteria; or Tier A company with one weakness
- 🔴 C: Multiple mismatches or one disqualifying factor
- ⛔ Skip: Definitive disqualifier (Paris on-site, clearly junior, <€40K stated, unrelated role)

### Red flags

- Salary below €55K or not disclosed
- French-only role at international company
- Scope below Director level
- Orange/Red zone without hybrid confirmed
- Agency opacity (no company name, vague scope)
- CDD/interim without strong justification

---

## Step 5 — Write to Notion

For each surviving listing (not skipped), call `mcp__claude_ai_Notion__notion-create-pages` with:
```
parent: { type: "data_source_id", data_source_id: "[Job Applications data source ID from profile Section 7]" }
```

| Property | Value |
|---|---|
| `Job Title` | extracted title |
| `Company` | company name or `"Not disclosed"` |
| `Source` | `Indeed` |
| `Location` | city + dept (local) or `"Remote"` / city if specified (remote) |
| `Salary` | as stated or `"Not stated"` |
| `Priority` | `A` / `B` / `C` (omit if Skip) |
| `CV Approach` | `Standard` / `FP&A Focus` / `Cost Control Focus` / `Transformation Focus` |
| `Status` | `To Assess` for ranked listings, `Needs Info` if rescue gate applied |
| `date:Date Added:start` | today as ISO string e.g. `"2026-04-16"` |
| `Job URL` | URL string if available |
| `Red Flags` | JSON array e.g. `"[\"Low salary\"]"` |
| `Missing Info` | JSON array if rescue gate applied |
| `Notes` | 2–3 sentence analysis; rescue gate entries start with `"QUEUED:"` |
| `English` | `"__YES__"` if English mentioned, otherwise `"__NO__"` |

---

## Step 6 — Summary

```
Indeed Sweep — [Local / Remote / Both]
Results: [N] found · [N] skipped (already in Notion) · [N] written to Notion

By Priority:
🟢 A: [N] — [titles if any]
🟡 B: [N] — [titles if any]
🔴 C: [N]
⏸️ Needs Info: [N]
⛔ Skip: [N]

Notable: [2–3 bullets for any Priority A or interesting B listings]
```
