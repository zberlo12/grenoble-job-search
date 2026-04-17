---
description: Research a company before applying or before an interview. Fetches company overview, finance team signals, open roles, and saves a summary to Target Companies in Notion. Trigger with /job-company-research or when the user says "research [company]".
argument-hint: Company name (e.g. "Schneider Electric"). Required — will ask if not provided.
allowed-tools: mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-update-page, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Indeed__search_jobs, mcp__claude_ai_Indeed__get_job_details, WebFetch
---

# Company Research

## Step 0 — Load User Profile

Search Notion for the page titled "⚙️ User Profile & Config" using `mcp__claude_ai_Notion__notion-search`, then fetch the first result using `mcp__claude_ai_Notion__notion-fetch`.
Extract into context: **Section 1** (base location), **Section 3** (background keywords — for relevance assessment), **Section 7** (Target Companies DB ID, Job Applications data source ID).
If no page is found, halt: "User Profile not found in Notion — run /job-user-setup to create your profile first."

---

## Step 1 — Identify the company

If `$ARGUMENTS` is provided: use it as the company name.
Otherwise ask: "Which company would you like to research?"

---

## Step 2 — Check existing Notion data

Search Target Companies DB (ID from profile Section 7) for the company name.
If found: show existing Notes and Last Checked date as context.
Also search Job Applications DB for any current listings at this company.

---

## Step 3 — Research in parallel

**A. Company website**
Try WebFetch on `[company].com`, `[company].fr`, or `[company].com/about` with prompt:
"What does this company do? What sector/industry? Approximate employee count or revenue?
Is it a standalone company, a subsidiary, or a group? Any major recent news (past 12 months)?
Is English used — in the site language, job postings, or stated as a working language?"

If blocked: try `[company].com/en` or the French equivalent.

**B. Open finance roles**
If a Careers URL exists in Target Companies: call WebFetch on it with prompt:
"List all open finance, controlling, FP&A, procurement, accounting, or treasury roles.
For each: job title, location, contract type (CDI/CDD). Return a structured list or say 'None found'."

If no Careers URL, or WebFetch fails: call `mcp__claude_ai_Indeed__search_jobs` with:
- `search`: `"[Company Name]"`
- `location`: base location from profile Section 1 (or "France" if company seems national/remote)
- `country_code`: "FR"
- `job_type`: "fulltime"

Filter Indeed results to finance-relevant titles only. Ignore sales, engineering, HR.

---

## Step 4 — Compile and output the research profile

```
## [Company Name]

**What they do:** [2 sentences — sector, main products/services]
**Size:** [headcount or revenue, or "unknown"]
**Structure:** [standalone / subsidiary of [Group] / HQ in [city]]
**English culture:** [Yes / Likely / Unknown / French-only] — [1-line reasoning]
**Recent news:** [relevant change, or "nothing notable found"]

**Finance team signals:**
[Any indicators of finance function size, ERP system used, reporting structure, or
whether the role would have strategic vs. purely operational scope]

**Open finance roles right now:**
[list from Careers/Indeed, or "No finance roles currently posted"]

**Relevance to your profile:**
[1–2 sentences connecting this company's sector, size, or profile to the candidate's
background — why it's a good fit or an interesting stretch]
```

---

## Step 5 — Save to Notion

**If company exists in Target Companies:**
- Update `Notes` with the research summary (append with today's date header)
- Update `Last Checked` → today
- If `Tier` is not set: suggest a tier based on research and ask:
  "Based on this research, I'd suggest Tier [A/B/C/D] — [one-line reason]. Confirm?"
  If confirmed: update `Tier`.

**If company does NOT exist in Target Companies:**
Ask: "Would you like to add [Company] to your Target Companies list? (yes/no)"
If yes: create a new row with Company, Sector, Location, Careers URL (if found), Notes, Last Checked, and suggested Tier populated.
