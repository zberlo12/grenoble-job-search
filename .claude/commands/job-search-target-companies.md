---
description: Checks Target Companies careers pages for open finance roles. Fetches Tier A and B companies from Notion, visits each careers URL, looks for relevant listings, deduplicates against Job Applications, and writes new entries. Trigger with /job-search-target-companies.
argument-hint: Optional. Pass "A" to check only Tier A, "B" for only Tier B. Default checks both.
allowed-tools: mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Notion__notion-update-page, mcp__claude_ai_Indeed__search_jobs, mcp__claude_ai_Indeed__get_job_details, WebFetch
---

# Target Companies Careers Sweep

## Step 0 — Load User Profile

Fetch the User Profile & Config page (ID: `3452fc3ca02a811ab75af9805f50ef8b`) using `mcp__claude_ai_Notion__notion-fetch`.
Extract into context: **Section 1** (user name), **Section 4** (location zones), **Section 7** (Notion IDs — Target Companies DB ID, Job Applications data source ID).
If unreachable, halt: "User Profile page unreachable — check notion_config_page_id in .mcp.json"

---

You are checking the user's tracked Target Companies (Tier A and B) for relevant open finance roles.
This bypasses job boards entirely and goes direct to source.

---

## Step 1 — Fetch Target Companies

Fetch the Target Companies database (ID from profile Section 7).
Use `mcp__claude_ai_Notion__notion-fetch` on the database ID to get the schema and data source URL, then fetch the rows.

Filter to **Tier A and Tier B** companies only (or just Tier A if `$ARGUMENTS` = "A", just Tier B if "B").

For each company, note:
- Company name
- Tier
- Sector
- Location
- Careers URL (may be blank — handle gracefully)
- Last Checked date

Sort: Tier A first, then Tier B. Within each tier, prioritise companies where Last Checked is oldest or null.

---

## Step 2 — Check Each Company

For each company, work through this ladder in order. Stop as soon as you get usable results.

**Rung 1 — WebFetch on careers URL**
If `Careers URL` is set and is a direct careers/jobs page (e.g. `careers.company.com`, `company.com/jobs`, Lever, Greenhouse, Workday public pages):
- Call `WebFetch` with prompt: "List all open finance, controlling, FP&A, procurement, supply chain finance, or accounting roles. For each: job title, location, contract type (CDI/CDD), any salary info. Return as a structured list. If no relevant roles found, say 'No finance roles'."
- If the page is JavaScript-heavy or returns no content → fall through to Rung 2.
- If the URL is LinkedIn (`linkedin.com`) → skip Rung 1 entirely, go to Rung 2.

**Rung 2 — Indeed company search**
Call `mcp__claude_ai_Indeed__search_jobs` with:
- `search`: `"[Company Name]"`
- `location`: `"Grenoble, France"` (or `"France"` if company is remote-friendly / national)
- `country_code`: `"FR"`
- `job_type`: `"fulltime"`

Filter results to finance-relevant titles only. Ignore noise (sales, engineering, operations) unless clearly finance-adjacent.

**Rung 3 — Flag for manual check**
If both rungs fail (blocked, JS-heavy, no results), note the company in the manual check list.

---

## Step 3 — Assess Roles Found

For each finance role identified, apply standard `/job-search` analysis:

- Is the title senior enough? (Finance Director, FP&A, Controller, P2P, RAF, DAF — yes. Junior analyst, assistant comptable — skip.)
- Location zone assessment (same rules as other skills)
- Rescue gate: if title and company are strong but salary/hybrid is missing → Needs Info

**Do not write roles to Notion that are clearly junior, wrong function, or hard disqualifiers.**

---

## Step 4 — Deduplicate Against Notion

For each role that passes Step 3, check the Job Applications database (ID from profile Section 7):
- Search `"[Company] [Job Title]"` within last 30 days
- If found → skip (already tracked)

---

## Step 5 — Write New Roles to Notion

For each new role surviving dedup:

```
parent: { type: "data_source_id", data_source_id: "[Job Applications data source ID from profile Section 7]" }
```

| Property | Value |
|---|---|
| `Job Title` | extracted title |
| `Company` | company name |
| `Source` | `Direct` |
| `Location` | city + dept or `"Remote"` |
| `Salary` | as stated or `"Not stated"` |
| `Priority` | `A` / `B` / `C` per analysis |
| `CV Approach` | appropriate approach |
| `Status` | `To Assess` or `Needs Info` |
| `date:Date Added:start` | today |
| `Job URL` | direct link to role if found |
| `Red Flags` | JSON array |
| `Missing Info` | JSON array if rescue gate applied |
| `Notes` | 2–3 sentence analysis |
| `English` | `"__YES__"` or `"__NO__"` |

---

## Step 6 — Update "Last Checked" in Target Companies

After processing each company (regardless of whether roles were found), update the `Last Checked` date in the Target Companies database to today:

```
mcp__claude_ai_Notion__notion-update-page → date:Last Checked:start = today
```

---

## Step 7 — Summary

```
Target Companies Sweep — [date]
Companies checked: [N] Tier A, [N] Tier B
Finance roles found: [N total]  ·  Already in Notion: [N]  ·  Written to Notion: [N]

By Priority:
🟢 A: [N] — [titles @ companies]
🟡 B: [N] — [titles @ companies]
🔴 C: [N]
⏸️ Needs Info: [N]

Manual check needed (blocked/JS-heavy):
- [Company] — [reason]

No roles found:
- [Company list]
```

---

## Notes on Limitations

- **LinkedIn careers pages** — require login; always fall through to Indeed Rung 2.
- **JavaScript-heavy ATS** (some Workday/SAP SuccessFactors instances) — WebFetch returns empty; fall through to Indeed or flag for manual check.
- **No credentials are stored or used** — this skill only accesses publicly available pages. If a careers page requires login, it is flagged as manual check. Never ask Zack for passwords or credentials.
- **Indeed Rung 2 covers the gap** for most Tier A companies since they post on Indeed anyway.
