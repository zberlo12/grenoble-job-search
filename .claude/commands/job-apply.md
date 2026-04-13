---
description: Draft a tailored CV and cover letter for a specific job application. Fetches the Notion job row and candidate knowledge base, asks targeted questions if anything is missing, then writes tailored CV + cover letter + notes to a new Notion page linked back to the job row. Trigger with /job-apply or when Zack is ready to prepare documents for a listing.
argument-hint: Blank (→ list all "To Apply" rows to pick from), a number from that list, a Notion row ID, or a company/title search string
allowed-tools: mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-update-page, mcp__claude_ai_Notion__notion-create-pages
---

# Job Apply — Document Drafter

You are drafting tailored application documents for Zack (Finance Director / FP&A, Grenoble)
for a specific job listing already ranked in the Notion Job Applications database.

Your goal: produce a tailored CV and a custom cover letter, saved as a Notion page under
Application Documents, linked back to the job row for future comparison.

---

## Notion page IDs (hardcoded — do not fetch dynamically)

| Resource | Page ID |
|---|---|
| Candidate Profile — Zack | `3412fc3ca02a8132a0ccd25bbfe43fee` |
| CV Templates (parent) | `3412fc3ca02a819e9d52fe0a393f2d23` |
| Application Documents (parent) | `3412fc3ca02a813a8315fb6fd0a2304e` |
| Job Applications DB | `collection://73c7671a-f600-40a1-807a-83375c3160a9` |

---

## Step 1 — Identify the Target Row

Parse `$ARGUMENTS`:

**Blank** → Fetch all rows with `Status = "To Apply"` from the Job Applications DB. Sort by Date Added ascending. Present a numbered selection list:

```
## To Apply Queue — pick a role to prepare documents for

1. [Job Title] @ [Company] — [Location] · [Priority] · added [date]
   [one-line summary from Notes]

2. [Job Title] @ [Company] — [Location] · [Priority] · added [date]
   [one-line summary from Notes]
...

Type a number to select, or type a job title/company name.
```

If the queue is empty, tell Zack "No roles in To Apply status — run /job-week-review to promote listings from Potentially Apply first." and stop.

**Number** (e.g. `2`) → use the row at that position from the list above.

**Notion row ID** (UUID format) → fetch that page directly. Confirm it has `Status = "To Apply"` — if not, warn Zack and ask to confirm before proceeding.

**Search string** → `notion-search` in the Job Applications DB, filter results to `Status = "To Apply"`, use the best match.

After identifying the row, fetch it fully. Extract: Job Title, Company, Location, Salary, CV Approach, Priority, Red Flags, Notes, Job URL, Docs URL.

**Existing docs check:** If `Docs URL` is already set, tell Zack:
> "Documents were already drafted for this role ([Docs URL]). Draft again and create a new version, or open the existing page?"
> Wait for confirmation before proceeding.

---

## Step 2 — Load Resources in Parallel

Call all three simultaneously:

**A. Candidate Knowledge**
`notion-fetch` the Candidate Profile page (`3412fc3ca02a8132a0ccd25bbfe43fee`). Extract all populated fields — metrics, highlights, talking points.

**B. Base CV Template**
Map CV Approach to template page title:
- `FP&A Focus` → "CV — FP&A Focus"
- `Cost Control Focus` → "CV — Cost Control Focus"
- `Transformation Focus` → "CV — Transformation Focus"
- `Standard` → "CV — Standard"

`notion-search` for that title under the CV Templates parent page (`3412fc3ca02a819e9d52fe0a393f2d23`), then `notion-fetch` the result.

If the page does not exist yet:
> "No CV template found for [CV Approach]. Paste your base CV text and I'll save it to Notion as the template for future use."
> Create the page under CV Templates using `notion-create-pages` + `notion-update-page` to write the content. Confirm saved, then continue.

**C. CL Examples (style reference)**
`notion-search` for pages under the CV Templates parent that contain "CL" or "Example" in the title. Fetch up to 3. Use for tone, structure, and framing only — do not copy content.

---

## Step 3 — Pre-draft Questions (upfront, never mid-draft)

Before writing a single word of the CV, check the Candidate Profile and job requirements together. Identify any gaps that would meaningfully affect the document quality — e.g.:

- Role requires team management → team size not in Candidate Profile
- Industrial sector role → specific industrial company/context not recorded
- Salary negotiation likely → expected salary not recorded
- French-language role → French level not recorded

Ask ALL missing questions in **one single block** — never interrupt mid-draft. Format:

> "Before I draft, I need a few details not yet in your profile:
> 1. [Question]
> 2. [Question]
> (If any don't apply, just say 'N/A' for that number.)"

After receiving answers, append them to the Candidate Profile page using `notion-update-page` with `command: "insert_content_after"` targeting the relevant section. Then proceed to draft.

If nothing is missing, skip directly to Step 4.

---

## Step 4 — Draft the Tailored CV

Using the base CV template, candidate profile, and job details:

1. **Craft the CV headline/title** — do NOT copy the job title verbatim. Create a compelling, sector-appropriate variant that positions Zack for this specific role (e.g. for an industrial controlling role: "Contrôleur de Gestion Industriel | FP&A & Performance Opérationnelle"). Look at the CL examples to understand how Zack has framed his profile in past successful applications — match that style and ambition.

2. **Professional summary** — 2–3 sentences. Reference the company type, sector, and role level. Lead with the most relevant experience for this JD. Concrete, not generic.

3. **Experience bullet points** — reorder and reweight existing bullets to surface the most relevant experience for this role. Do not invent content — reframe and reprioritise what is in the base template. Incorporate key JD terms naturally where they genuinely apply.

4. **Language** — match the language of the JD (French JD → French CV; bilingual JD → French CV with English profile section if appropriate).

---

## Step 5 — Draft the Cover Letter

Always drafted from scratch — never recycled or generic.

Structure:
1. **Opening** (2–3 sentences): Why this specific company and role. Reference something concrete — sector challenge, recent news, what makes the company interesting to Zack. Not "I am interested in this opportunity."
2. **Body** (2 short paragraphs): Map 2–3 specific examples from Zack's background to the JD's key requirements. Name the company, scope, and result. Concrete beats vague every time.
3. **Close** (2 sentences): Proactive, not passive. Express interest in a conversation, not just "awaiting your response."

Language: match the JD. Tone: confident and direct, not obsequious.

---

## Step 6 — Create Application Document Page in Notion

Call `notion-create-pages` under the Application Documents parent (`3412fc3ca02a813a8315fb6fd0a2304e`):

```
Title: [Company] — [Job Title] — [YYYY-MM-DD]
```

Then call `notion-update-page` to write the full content with three sections:

```markdown
## Tailored CV

[full tailored CV]

---

## Cover Letter

[full cover letter]

---

## Application Notes

**Role:** [Job Title] @ [Company]
**Priority:** [A/B]  ·  **CV Approach:** [approach]  ·  **Location/Zone:** [location]
**Job URL:** [url if available]

### Key selling points for this application
- [experience that maps to requirement 1]
- [experience that maps to requirement 2]
- [any differentiator]

### Red flags to manage
- [e.g. "Salary not confirmed — raise at offer stage, not before"]

### Before submitting
- [e.g. "Confirm hybrid policy", "Find hiring manager name on LinkedIn"]
```

---

## Step 7 — Update Job Applications Row

Call `notion-update-page` on the job row with:
- `Docs URL` → the URL of the new application document page
- `Notes` → append `" | Docs drafted [YYYY-MM-DD]"` to existing notes

Do not change Status — Zack controls when to move to `Applied`.

---

## Step 8 — Output Summary

```
Documents drafted for [Job Title] @ [Company]:

📄 Notion page: [Application Documents URL]
   └── Tailored CV / Cover Letter / Application Notes

Next steps:
1. Open the Notion page — review CV headline and summary first.
2. Copy CV into your Word template and adjust formatting.
3. Review the cover letter opener — verify the company-specific detail is accurate.
4. Check Application Notes for anything to verify before submitting.
5. When submitted, update the Notion row Status to "Applied" and set Date Applied.
```
