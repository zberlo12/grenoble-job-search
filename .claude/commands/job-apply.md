---
description: Draft a tailored CV and cover letter for a specific job application. Fetches the Notion job row and candidate knowledge base, asks targeted questions if anything is missing, then writes tailored CV + cover letter + notes to a new Notion page linked back to the job row. Trigger with /job-apply or when Zack is ready to prepare documents for a listing.
argument-hint: Blank (→ list all "To Apply" rows to pick from), a number from that list, a Notion row ID, or a company/title search string
allowed-tools: mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-update-page, mcp__claude_ai_Notion__notion-create-pages, Bash
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

**Blank** → Fetch all rows with `Status = "To Apply"` from the Job Applications DB. Sort by Date Added ascending. Present a numbered comparison table — same format as `/job-review-weekly`:

```
## To Apply Queue — [N] roles ready for documents

| # | Title | Company | 📍 Zone | 💰 Salary | Priority | Red Flags | Notes | 🔗 |
|---|---|---|---|---|---|---|---|---|
| 1 | [title] | [company] | 🟢/🟡/🌐 | [salary or —] | [A/B] | [flags or —] | [1-line decision note] | [link](url) or — |
...
```

Then ask:
> "Which numbers do you want to draft documents for? List them (e.g. `1,3`) or type `all`."

Draft documents for each selected row in order. Skip unselected rows — leave them in `To Apply`.

If the queue is empty, say "No roles in To Apply status — run `/job-review-weekly` to promote listings from Potentially Apply first." and stop.

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
Detect JD language first: French JD → `FR`, English JD → `EN`, bilingual → `FR`.

Map CV Approach + language to template page title:
- `FP&A Focus` + FR → "CV — FP&A Focus — FR"
- `FP&A Focus` + EN → "CV — FP&A Focus — EN"
- `Cost Control Focus` + FR → "CV — Cost Control Focus — FR"
- `Cost Control Focus` + EN → "CV — Cost Control Focus — EN"
- `Transformation Focus` + FR/EN → same pattern
- `Standard` + FR/EN → same pattern

`notion-search` for that title under the CV Templates parent page (`3412fc3ca02a819e9d52fe0a393f2d23`), then `notion-fetch` the result.

**Fallback:** If the language-specific page is not found, search again without the language suffix (e.g. "CV — FP&A Focus"). Use that if found. If still not found:
> "No CV template found for [CV Approach — LANG]. Paste your base CV text and I'll save it to Notion as the template for future use."
> Create the page under CV Templates using `notion-create-pages` + `notion-update-page` to write the content. Use the language-tagged title (e.g. "CV — FP&A Focus — FR"). Confirm saved, then continue.

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

Then call `notion-update-page` to write the full content with three sections.

**IMPORTANT: Always use these exact English heading names — the Word populate scripts look for them by name:**

```markdown
## Tailored CV

[full tailored CV — content may be in French or English matching the JD]

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

## Step 8 — Run Word Populate Scripts

Immediately after Step 7, run both scripts via Bash from the repo root
(`C:\Users\zberl\OneDrive\Documents\Code\Grenoble-job-search`).

**Map CV Approach + language to `--approach` flag:**

| CV Approach | Language | --approach flag |
|---|---|---|
| FP&A Focus | FR | `fpa-fr` |
| FP&A Focus | EN | `fpa-en` |
| Cost Control Focus | FR | `costcontrol-fr` |
| Standard / RAF | FR | `raf-fr` |
| Transformation Focus | EN | `hof-en` |

Run both commands sequentially:

```bash
cd "C:\Users\zberl\OneDrive\Documents\Code\Grenoble-job-search"
py scripts/populate_cv.py [PAGE_ID] --approach [FLAG]
py scripts/populate_cl.py [PAGE_ID]
```

Replace `[PAGE_ID]` with the Notion page ID from Step 6 and `[FLAG]` with the mapped approach above.

If either script fails, report the error message and stop — do not proceed to Step 9.

---

## Step 9 — Output Summary

```
Documents drafted for [Job Title] @ [Company]:

📄 Notion page: [Application Documents URL]
   └── Tailored CV / Cover Letter / Application Notes

📝 Word files generated:
   └── [CV output filename from script]
   └── [CL output filename from script]

Next steps:
1. Open the Word files — review CV headline and LM opener first.
2. Review the Application Notes in Notion for anything to verify before submitting.
3. When submitted, update the Notion row Status to "Applied" and set Date Applied.
```
