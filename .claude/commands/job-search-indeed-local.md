---
description: Manual Indeed job search for Grenoble area. Runs 5 grouped local searches, deduplicates against Notion, analyses each listing, and writes new entries. Use when you want to sweep Indeed directly for local roles — separate from the daily Gmail scan.
argument-hint: Optional. Leave empty to run full search set.
allowed-tools: mcp__claude_ai_Indeed__search_jobs, mcp__claude_ai_Indeed__get_job_details, mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-create-pages
---

# Indeed Local Search — Grenoble Area

You are running a manual Indeed job search sweep for Zack, a senior Finance Director / FP&A
professional based in Grenoble, France. This covers local roles only (Grenoble area).
For remote / France-wide, use `/job-search-indeed-remote`.

---

## Step 1 — Search Indeed (Grenoble area)

Call `mcp__claude_ai_Indeed__search_jobs` with `location: "Grenoble, France"`, `country_code: "FR"`, `job_type: "fulltime"`.

Run these 5 grouped searches (OR syntax combines titles into one API call):

1. `"Contrôleur de Gestion OR Financial Controller OR FP&A Manager OR Finance Business Partner OR Responsable Contrôle de Gestion"`
2. `"Responsable Administratif Financier OR RAF OR Directeur Financier OR Finance Manager OR Accounting Manager"`
3. `"Cost Controller OR Contrôleur de Gestion Industriel OR Responsable Comptabilité OR Chef Comptable"`
4. `"Responsable P2P OR Responsable Procure-to-Pay OR P2P Manager OR Procurement Manager OR Responsable Achats OR Acheteur Senior"`
5. `"Demand Planner OR Supply Chain Planner OR Responsable Supply Chain OR Supply Chain Manager OR Senior Buyer"`

---

## Step 2 — Deduplicate Against Notion

Database ID: `09b29be7bb764b16b173321f469b01e2`

Indeed `search_jobs` returns company, title, URL, and job ID — no thread read required. For each result, run a dedup pass before analysis:

- If `Job URL` or job ID (`jk=` parameter) matches a Notion entry created in the last 30 days → discard immediately.
- If no URL match, call `mcp__claude_ai_Notion__notion-search` for `"[Company] [Job Title]"` within the last 30 days → discard if found.

Only listings that survive this pass proceed to Step 3.

---

## Step 3 — Analyse Each Listing

Apply the same criteria as the `/job-search` skill.

**Rescue gate (apply FIRST)**: Indeed postings routinely omit salary, hybrid policy, and full scope. Do NOT downgrade plausible finance matches to C or Skip just because the listing is incomplete.

If ALL of the following are true:
1. Title family matches (Finance Director, FP&A, Controlling, P2P, Supply Chain Finance, Procurement at senior level)
2. Location is 🟢 Green, 🟡 Yellow, or 🌐 Remote
3. No hard disqualifier (Paris on-site, explicitly junior, wrong function, salary stated below €45K)

...AND any of Salary, Hybrid policy, Full scope, or Company name is missing, route to review queue:
- `Status = "Needs Info"`, `Priority = B` (provisional)
- `Missing Info` — list the missing fields

**Tiebreaker rule:** When genuinely unclear, always route to `Needs Info`. Only assign Skip or C when a disqualifier is unambiguous.

### Standard priority criteria

**Location zones:**
- 🟢 Green (0–25 min): Grenoble, Échirolles, Meylan, Saint-Égrève, Pont-de-Claix, Montbonnot, Crolles, Voreppe, Bernin, Saint-Martin-d'Hères, and all dept 38 core towns
- 🟡 Yellow (30–50 min): Voiron, Moirans, Chambéry, Saint-Marcellin, Pontcharra
- 🟠 Orange (1h–1h45): Valence, Annecy, Ugine, Faverges, Cluses, Bourg-en-Bresse, Albertville
- 🔴 Red (1h15+ / no hybrid): Lyon, La Tour-en-Maurienne, Paris, Luxembourg

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

## Step 4 — Write to Notion

For each surviving listing (not skipped), call `mcp__claude_ai_Notion__notion-create-pages` with:
```
parent: { type: "data_source_id", data_source_id: "73c7671a-f600-40a1-807a-83375c3160a9" }
```

| Property | Value |
|---|---|
| `Job Title` | extracted title |
| `Company` | company name or `"Not disclosed"` |
| `Source` | `Indeed` |
| `Location` | city + dept |
| `Salary` | as stated or `"Not stated"` |
| `Priority` | `A` / `B` / `C` (omit if Skip) |
| `CV Approach` | one of: `Standard` / `FP&A Focus` / `Cost Control Focus` / `Transformation Focus` |
| `Status` | `To Assess` for ranked listings, or `Needs Info` if rescue gate applied |
| `date:Date Added:start` | today as ISO string e.g. `"2026-04-14"` |
| `Job URL` | URL string if available |
| `Red Flags` | JSON array string e.g. `"[\"Low salary\"]"` |
| `Missing Info` | JSON array string if rescue gate applied |
| `Notes` | 2–3 sentence analysis; if rescue gate applied, start with `"QUEUED:"` |
| `English` | `"__YES__"` if English mentioned, otherwise `"__NO__"` |

---

## Step 5 — Summary

Print a brief summary:

```
Indeed Local Sweep — Grenoble area
Results: [N] found · [N] skipped (already in Notion) · [N] written to Notion

By Priority:
🟢 A: [N] — [titles if any]
🟡 B: [N] — [titles if any]
🔴 C: [N]
⏸️ Needs Info: [N]
⛔ Skip: [N]

Notable: [2–3 bullets for any Priority A or interesting B listings]
```
