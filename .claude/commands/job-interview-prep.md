---
description: Generate a personalised interview briefing pack for a specific job application. Creates a Notion page with company snapshot, role alignment, likely questions, talking points, and questions to ask them. Trigger with /job-interview-prep or when a listing reaches Interview status.
argument-hint: Blank (→ list all Interview rows to pick from), a number from that list, or a company/title search string.
allowed-tools: mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Notion__notion-update-page, WebFetch
---

# Interview Prep

## Step 0 — Load User Profile

Search Notion for the page titled "⚙️ User Profile & Config" using `mcp__claude_ai_Notion__notion-search`, then fetch the first result using `mcp__claude_ai_Notion__notion-fetch`.
Extract into context: **Section 1** (name, base location), **Section 3** (background keywords), **Section 7** (Notion IDs — Job Applications DB, Application Documents parent, Candidate Profile page).
If no page is found, halt: "User Profile not found in Notion — run /job-user-setup to create your profile first."

---

## Step 1 — Identify the target row

If `$ARGUMENTS` is blank → fetch the Job Applications data source (ID from profile Section 7).
Filter to `Status = "Interview"`. Sort by Date Applied ascending. Show:

```
Interview rows:
| # | Title | Company | Date Applied | Days waiting |
| 1 | [title] | [company] | [date] | [N days] |
...
```

If only one row: use it automatically without asking.
If multiple: ask "Which one? (enter a number)"

If `$ARGUMENTS` is a number → use the row at that position.
If `$ARGUMENTS` is a string → search Job Applications for it, filter to Interview status.

Fetch the full row. Extract: Job Title, Company, Location, Notes, Red Flags, Job URL, Salary.

---

## Step 2 — Gather information in parallel

Run all three simultaneously:

**A. Candidate Profile**
Fetch the Candidate Profile page (ID from profile Section 7).
Extract: all populated sections — metrics, achievements, talking points, background keywords,
Cover Letter Writing Rules, and Writing Tone Profile if present.

**B. Full job description**
If Job URL exists and is not a LinkedIn URL:
- Call WebFetch with prompt: "Extract: company description, role responsibilities, required
  experience and skills, seniority level, team structure, reporting line, any cultural signals,
  salary or compensation if mentioned."
If LinkedIn or WebFetch returns nothing useful:
- Use the Notes field from the Notion row as the JD source.

**C. Company background**
If Company name is known (not "Not disclosed"):
- Call WebFetch on `[company].com` or `[company].fr` with prompt:
  "What does this company do? What sector? Approx size or revenue? Any recent news in the
  past 12 months? Is English used in the company?"
- If blocked or no result: skip and note "company info not available online"

---

## Step 3 — Build the briefing pack

Create a Notion page titled **"[Company] — Interview Brief — [Date]"** under Application Documents
(parent ID from profile Section 7: Application Documents parent).

Page content:

```
# Interview Brief — [Job Title] @ [Company]
Date: [today]   |   Interview type: [from Notes if stated, else "TBC"]

---

## About [Company]
[2–3 sentences from WebFetch. If unavailable: "Review [Job URL] for company background."]

---

## Role summary
[4–5 sentences synthesising: scope, seniority, team size if known, reporting line, key
responsibilities. Written from the interviewer's perspective — what they need.]

---

## Your strongest fits
[3–5 bullet points. Format each as:]
✓ [JD requirement] → [your direct evidence from Candidate Profile]

[Focus on the top requirements from the JD. Be specific — name employers, systems, metrics.]

---

## Likely interview questions

[8–10 questions, each with a 1-sentence answer starter drawn from your profile.
Mix types:]
- Competency: "Tell me about a time you [X]..."
- Technical: "How do you approach [forecasting / closing / P2P process / etc.]?"
- Situational: "How would you handle [scenario relevant to the JD]?"
- Cultural fit: "What kind of environment do you work best in?"

Format:
**Q: [question]**
Starter: [your opening line — specific, not generic]

---

## Questions to ask them

[4–5 smart questions tailored to this specific role and company. Include:]
- 1 question about success criteria / first 90 days
- 1 question about the finance team structure
- 1 question about systems / ERP if relevant
- 1–2 questions probing any red flags or uncertainties from the Notion row

---

## Watch for / probe

[From the Red Flags field and any uncertainties noted in the Notion row. E.g.:]
- "Hybrid policy not confirmed — ask directly: 'What's the typical office/remote split?'"
- "Salary not discussed — prepare a range. Profile floor: [€X]. Target: [€Y]."
- "Scope below Director level flagged — probe: 'Who does this role report to, and what's the
  team structure above this position?'"
```

---

## Step 4 — Update the Notion job row

Call `mcp__claude_ai_Notion__notion-update-page` on the job row:
- Append to Notes: `" | Interview brief: [page URL]"`

---

## Step 5 — Output to user

```
Interview brief ready: [Notion page link]

[Company] — [Job Title]

Tip: [one context-specific piece of advice based on role type and company, e.g.:]
  - CDG industrial: "Lead with SAP/ERP experience — it's a direct differentiator."
  - Finance Director: "Frame your first question around scope clarity — interviewers at
    this level expect you to probe the mandate, not just answer questions."
  - P2P / Governance: "Reference process improvement metrics early — they're hiring for
    transformation, not just maintenance."
```
