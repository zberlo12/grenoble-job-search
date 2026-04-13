---
description: Draft a tailored CV and cover letter for a specific job application. Fetches the Notion row, reads the appropriate base CV template, and writes cv.md + cover-letter.md + notes.md to the applications/ directory. Trigger with /job-apply or when Zack is ready to prepare documents for a listing.
argument-hint: Notion row ID, job title/company search string, or blank (→ first "To Apply" row)
allowed-tools: mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-update-page, Read, Write, Glob
---

# Job Apply — Document Drafter

You are drafting tailored application documents for Zack (Finance Director / FP&A, Grenoble)
for a specific job listing already ranked in the Notion Job Applications database.

Your goal: produce a tailored CV and a custom cover letter, saved as files in the
`applications/` directory, ready for Zack to copy into his Word/PDF template.

---

## Step 1 — Identify the Target Row

Parse `$ARGUMENTS`:
- **Blank** → fetch the Job Applications DB and pick the first row with `Status = "To Apply"`, sorted by Date Added ascending.
- **Notion row ID** (UUID format) → fetch that page directly.
- **Search string** (e.g. "EDEIS" or "RAF") → call `mcp__claude_ai_Notion__notion-search` in the DB and use the best match with `Status = "To Apply"`.

Fetch the full row. Extract:
- Job Title, Company, Location, Salary, CV Approach, Priority, Red Flags, Notes, Job URL

---

## Step 2 — Load Base CV Template

CV Approach → template file mapping:
- `FP&A Focus` → `.claude/templates/cv-fpanda.md`
- `Cost Control Focus` → `.claude/templates/cv-cost-control.md`
- `Transformation Focus` → `.claude/templates/cv-transformation.md`
- `Standard` → `.claude/templates/cv-standard.md`

Use `Read` to load the template. If the file does not exist:
> "No template found for [CV Approach] at `.claude/templates/[filename]`. Paste your base CV text and I'll save it as the template for future use."

Save the pasted text to the template file using `Write`, then continue.

**Also load any existing examples** from `.claude/templates/examples/` using `Glob` to find
`.md` files there. Read up to 3 that seem most relevant (by filename keywords). These inform
tone, structure, and framing — do not copy content directly.

---

## Step 3 — Draft the Tailored CV

Using the base CV template and the job details:

1. **Job title line** — Change the headline/current title in the CV header to closely match
   the target role title (e.g. if applying for "Responsable Administratif et Financier (RAF)",
   the CV header should read "Responsable Administratif et Financier" not "Finance Director").
   This is the single highest-impact personalisation step.

2. **Professional summary / headline** — Rewrite the 2–3 sentence summary to reference the
   specific company, sector, and role level. Mention 1–2 concrete differentiators that match
   the JD requirements.

3. **Experience bullet points** — Reorder and reweight existing bullets to surface the most
   relevant experience first. Do not invent content — only reframe and reprioritise what is
   already in the base template.

4. **Keywords** — Ensure key JD terms appear naturally (e.g. "contrôle de gestion", "clôtures",
   "reporting", "DSP", "P2P" — whatever applies). Don't keyword-stuff; weave them in where
   they already belong.

5. **Language** — Match the language of the JD (French JD → French CV; bilingual JD → bilingual
   or French CV with English section).

Output the full tailored CV in Markdown.

---

## Step 4 — Draft the Cover Letter

Always drafted from scratch. The CL is always tailored — never generic.

Structure:
1. **Opening** (2–3 sentences): Why this company and this role specifically. Reference something
   concrete about the company (sector, recent news, their particular challenge) — not just
   "I am interested in this opportunity."

2. **Body** (2 paragraphs): Map 2–3 specific examples from Zack's background to the JD's key
   requirements. Be concrete: name the company, the scope, the result. Avoid vague claims.

3. **Close** (2 sentences): Proactive tone — express interest in discussing, not just "I await
   your response."

Language: match the JD language. Tone: confident and direct, not obsequious.

---

## Step 5 — Write Output Files

Construct the output directory name:
`applications/[Company]-[JobTitle]-[YYYY-MM-DD]/`

Sanitise to filesystem-safe characters (replace spaces and special chars with hyphens).
Today's date from `currentDate` context.

Write three files using `Write`:

**cv.md** — the full tailored CV

**cover-letter.md** — the full cover letter

**notes.md** — application briefing:
```markdown
# [Job Title] @ [Company] — Application Notes

**Priority:** [A/B]  ·  **CV Approach:** [approach]  ·  **Location:** [location/zone]
**Job URL:** [url]

## Key selling points for this application
- [Specific experience that maps to requirement 1]
- [Specific experience that maps to requirement 2]
- [Any differentiator vs. typical candidates]

## Red flags to address (if any)
- [e.g. "Salary not confirmed — ask at first interview, not before"]

## Things to verify before submitting
- [e.g. "Confirm hybrid policy", "Check LinkedIn for hiring manager name"]
```

---

## Step 6 — Update Notion Row

Call `mcp__claude_ai_Notion__notion-update-page` to append to the Notes field:
`"Docs drafted [YYYY-MM-DD] → applications/[directory-name]/"`

Do not change the Status — Zack controls when to move to `Applied`.

---

## Step 7 — Output Summary

Tell Zack:
```
Documents drafted for [Job Title] @ [Company]:

📁 applications/[directory-name]/
   ├── cv.md
   ├── cover-letter.md
   └── notes.md

Next steps:
1. Open cv.md and copy into your Word template. Adjust formatting.
2. Review cover-letter.md — confirm the company-specific opener is accurate.
3. Check notes.md for anything to verify before submitting.
4. When submitted, update the Notion row Status to "Applied".
```
