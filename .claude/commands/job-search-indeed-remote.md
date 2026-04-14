---
description: Manual Indeed job search for remote / France-wide roles. Runs 3 grouped remote searches, deduplicates against Notion, analyses each listing, and writes new entries. Use when you want to sweep Indeed directly for remote roles — separate from the daily Gmail scan.
argument-hint: Optional. Leave empty to run full search set.
allowed-tools: mcp__claude_ai_Indeed__search_jobs, mcp__claude_ai_Indeed__get_job_details, mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-create-pages
---

# Indeed Remote Search — France-wide / Remote

You are running a manual Indeed job search sweep for Zack, a senior Finance Director / FP&A
professional based in Grenoble, France. This covers remote and France-wide roles only.
For Grenoble area local roles, use `/job-search-indeed-local`.

---

## Step 1 — Search Indeed (Remote / France-wide)

Call `mcp__claude_ai_Indeed__search_jobs` with `location: "remote"`, `country_code: "FR"`, `job_type: "fulltime"`.

Run these 3 grouped searches (OR syntax combines titles into one API call):

1. `"Finance Director OR Directeur Financier OR Financial Controller OR FP&A Manager OR Finance Manager"`
2. `"Finance Business Partner OR Head of Finance OR VP Finance OR Finance Transformation"`
3. `"P2P Manager OR Responsable P2P OR Procurement Manager OR Finance Governance OR Responsable Procure-to-Pay"`

---

## Step 2 — Deduplicate Against Notion

Database ID: `09b29be7bb764b16b173321f469b01e2`

Indeed `search_jobs` returns company, title, URL, and job ID — no thread read required. For each result, run a dedup pass before analysis:

- If `Job URL` or job ID (`jk=` parameter) matches a Notion entry created in the last 30 days → discard immediately.
- If no URL match, call `mcp__claude_ai_Notion__notion-search` for `"[Company] [Job Title]"` within the last 30 days → discard if found.

Only listings that survive this pass proceed to Step 3.

---

## Step 3 — Analyse Each Listing

Apply the same criteria as the `/job-search` skill. **For all results from this search, location zone defaults to 🌐 Remote — assess on role fit and contract type only, not commute.**

**Rescue gate (apply FIRST)**: Indeed postings routinely omit salary, hybrid policy, and full scope. Do NOT downgrade plausible finance matches to C or Skip just because the listing is incomplete.

If ALL of the following are true:
1. Title family matches (Finance Director, FP&A, Controlling, P2P, Supply Chain Finance, Procurement at senior level)
2. No hard disqualifier (explicitly on-site in a Red zone, clearly junior, wrong function, salary stated below €45K)

...AND any of Salary, Hybrid policy, Full scope, or Company name is missing, route to review queue:
- `Status = "Needs Info"`, `Priority = B` (provisional)
- `Missing Info` — list the missing fields

**Tiebreaker rule:** When genuinely unclear, always route to `Needs Info`. Only assign Skip or C when a disqualifier is unambiguous.

### Standard priority criteria

**Priority rules (remote context):**
- 🟢 A: Senior finance/FP&A/controlling, confirmed remote or strong hybrid, CDI, English exposure, ≥€55K
- 🟡 B: Good fit on 3/4 criteria; or Tier A company with one weakness
- 🔴 C: Multiple mismatches or one disqualifying factor
- ⛔ Skip: Definitive disqualifier (clearly junior, <€40K stated, unrelated role, on-site only in Red zone)

**Red flags to check:**
- Salary below €55K or not disclosed
- French-only role at international company
- Scope below Director level
- On-site only in a city far from Grenoble (Lyon, Paris, etc.)
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
| `Location` | `"Remote"` or city if specified |
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
Indeed Remote Sweep — France-wide / Remote
Results: [N] found · [N] skipped (already in Notion) · [N] written to Notion

By Priority:
🟢 A: [N] — [titles if any]
🟡 B: [N] — [titles if any]
🔴 C: [N]
⏸️ Needs Info: [N]
⛔ Skip: [N]

Notable: [2–3 bullets for any Priority A or interesting B listings]
```
