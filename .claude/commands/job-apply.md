---
description: Draft a tailored CV and cover letter for a specific job application. Fetches the job row and candidate knowledge base from Supabase, asks targeted questions if anything is missing, then writes tailored CV + cover letter + notes to a Notion page and runs Word populate scripts. Trigger with /job-apply or when Zack is ready to prepare documents for a listing.
argument-hint: Blank (→ list all "To Apply" rows to pick from), a number from that list, or a company/title search string
allowed-tools: mcp__claude_ai_Notion__notion-update-page, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Google_Drive__list_recent_files, mcp__claude_ai_Google_Drive__search_files, mcp__claude_ai_Google_Drive__create_file, Bash
---

# Job Apply — Document Drafter

## Step 0 — Load Config

Run `cat config.json` via Bash. Parse the output and extract:
- `supabase_connection_string` → PG_CONN
- `pg_module_path` → PG_MODULE
- `user.name`, `user.email`, `user.salary_floor_apply` → name, email, salary floor
- `cv_approaches` → CV approach options and flags
- `notion.application_docs_id` → Application Documents parent page ID

**DB query pattern** — substitute actual `PG_MODULE` and `PG_CONN` values from config in every Bash call:
```bash
PG_MODULE="<pg_module_path>" PG_CONN="<supabase_connection_string>" node -e "
const {Client}=require(process.env.PG_MODULE);
const c=new Client({connectionString:process.env.PG_CONN});
c.connect()
  .then(()=>c.query('<SQL>',[<params>]))
  .then(r=>{console.log(JSON.stringify(r.rows));return c.end();})
  .catch(e=>{console.error(e.message);process.exit(1);});
"
```

---

## Step 1 — Identify the Target Row

Parse `$ARGUMENTS`:

**Blank** → Fetch all rows with `Status = 'To Apply'` from job_applications:
```sql
SELECT id, job_title, company, location, priority, salary, job_url,
       notes, red_flags, docs_url, cv_approach
FROM job_applications
WHERE status = 'To Apply'
ORDER BY date_added ASC
```

Present a numbered comparison table:
```
## To Apply Queue — [N] roles ready for documents

| # | Title | Company | 📍 Zone | 💰 Salary | Priority | Red Flags | Notes | 🔗 |
|---|---|---|---|---|---|---|---|---|
| 1 | [title] | [company] | 🟢/🟡/🌐 | [salary or —] | [A/B] | [flags or —] | [1-line decision note] | [link](url) or — |
```

Ask: > "Which numbers do you want to draft documents for? List them (e.g. `1,3`) or type `all`."

Draft documents for each selected row in order. Skip unselected rows.
If queue is empty: "No roles in To Apply status — run `/job-review-weekly` to promote listings first." and stop.

**Number** (e.g. `2`) → use the row at that position.
**Search string** → `SELECT ... WHERE job_title ILIKE $1 OR company ILIKE $1 AND status='To Apply'`

After identifying the row, fetch fully:
```sql
SELECT id, job_title, company, location, salary, cv_approach, priority,
       red_flags, notes, job_url, docs_url, job_description
FROM job_applications
WHERE id = $1
```

**Job Description check:** If `job_description` is empty or blank:
> "The Job Description field is empty for this role — paste the full JD now and I'll save it before drafting."
> Wait for the paste. Once received:
```sql
UPDATE job_applications SET job_description = $1 WHERE id = $2
```
Do NOT proceed to Step 1b without a Job Description.

**Existing docs check:** If `docs_url` is already set:
> "Documents were already drafted for this role ([docs_url]). Draft again or open the existing page?"
> Wait for confirmation.

---

## Step 1b — Pre-flight check

| # | Check | Pass condition |
|---|---|---|
| 1 | **Salary** | Salary field ≥ salary_floor_apply from config, OR salary not stated |
| 2 | **Location** | Location maps to Green or Yellow zone, OR role confirmed remote/hybrid |
| 3 | **Contract type** | CDI — not CDD, intérim, alternance, freelance, or stage |
| 4 | **No duplicate** | No other row for same Company with Status = Applied / Docs Ready / Interview / Offer |
| 5 | **Role level** | Title/scope is not junior, alternance, or clearly below senior level |

For check 4, run:
```sql
SELECT id FROM job_applications
WHERE company ILIKE $1
  AND status IN ('Applied', 'Docs Ready', 'Interview', 'Offer')
  AND id != $2
```

If all five pass: `✅ Pre-flight passed — proceeding to document build.`
If any fail: display summary and ask to confirm override. If confirmed, note it and continue. If not, offer to set Status to Dismissed.

---

## Step 2 — Load Resources in Parallel

Run all queries in parallel via Bash.

**A. Candidate Profile**
```sql
SELECT id, full_name, phone, location, linkedin_url,
       salary_target_min, salary_target_max, availability_weeks, language_notes,
       experience_summary, fp_and_a_highlights, cost_control_highlights, p2p_highlights,
       cl_rules, tone_profile
FROM candidate_profile
WHERE user_email=$1
```
Pass `[config.user.email]`.

Then fetch supporting tables using the returned `id` as `profile_id`:
```sql
SELECT category, label, value, context FROM candidate_metrics
WHERE profile_id=$1 ORDER BY sort_order
```
```sql
SELECT topic, content FROM candidate_talking_points
WHERE profile_id=$1 ORDER BY sort_order
```
```sql
SELECT question, answer FROM role_specific_answers
WHERE profile_id=$1 AND company ILIKE $2
```
Pass `[profile_id, '%<company>%']` — loads any pre-saved answers for this company.

The `cl_rules` and `tone_profile` fields are **mandatory constraints** on every CL draft. Read them in full before writing a single word of the CL.

**B. Base CV Template**
Detect JD language: French JD → `FR`, English JD → `EN`, bilingual → `FR`.
```sql
SELECT content FROM cv_templates
WHERE cv_approach=$1 AND language=$2
LIMIT 1
```
Pass `[row.cv_approach, language_code]`.

Fallback: if no row, retry with `language='FR'`. If still empty, ask to paste base CV text.

**C. CL Examples (style reference)**
```sql
SELECT name, company, content FROM cl_examples
WHERE language=$1
ORDER BY created_at DESC
LIMIT 3
```
Pass `[language_code]`. Use for tone, structure, and framing only — do not copy content.

---

## Step 3 — Pre-draft Questions (upfront, never mid-draft)

Check candidate profile and job requirements together. Skip any question already answered in `role_specific_answers` from Step 2A.

If any meaningful gaps remain:
> "Before I draft, I need a few details not yet in your profile:
> 1. [Question]
> (If any don't apply, just say 'N/A')"

Ask ALL in one block. After receiving answers, save each to Supabase:
```sql
INSERT INTO role_specific_answers (profile_id, company, role, question, answer)
VALUES ($1, $2, $3, $4, $5)
```
Pass `[profile_id, company, job_title, question, answer]` for each answer received.

---

## Step 4 — Draft the Tailored CV

1. **Craft the CV headline** — do NOT copy the job title verbatim. Create a compelling, sector-appropriate variant.
2. **Professional summary** — 2–3 sentences. Reference company type, sector, role level. Concrete, not generic.
3. **Experience bullet points** — reorder and reweight existing bullets. Do not invent content.
4. **Language** — match the JD language.

---

## Step 5 — Draft the Cover Letter

Always drafted from scratch — never recycled or generic.

Apply `cl_rules` and `tone_profile` from Step 2A in full. Key rules:
- Adapt positioning block to the role type (DAF/CFO, CDG/FP&A, Operational, PM, Buyer — see cl_rules)
- NEWP paragraph must include at least two concrete metrics
- Tailor Schneider paragraph to the role type — do NOT copy P2P framing into a CDG role
- The CL must not sound AI-generated or over-tailored — one honest qualification or partial-fit acknowledgement is better than perfect alignment to every JD bullet
- Match language to JD; use Raydiall CL as tone benchmark

1. **Opening** (2–3 sentences): Reference JD directly — "Votre offre de [titre] chez [Company]..." — not the company from outside.
2. **Body** (2 short paragraphs): NEWP (metrics-anchored) → Schneider ("Plus récemment" transition). Add bridge paragraph if background doesn't map directly.
3. **Close**: "Je serais ravi..." + availability/location sentence.

---

## Step 6 — Create Application Document Page in Notion

Call `notion-create-pages` under Application Documents parent (`notion.application_docs_id`):
```
Title: [Company] — [Job Title] — [YYYY-MM-DD]
```

Then call `notion-update-page` to write the full content.

**IMPORTANT: Always use these exact English heading names — the Word populate scripts look for them by name:**

```markdown
## Tailored CV

[full tailored CV]

---

## Cover Letter

[opening paragraph]

[body paragraph 1]

[body paragraph 2]

[closing paragraph]

**CRITICAL — Cover Letter section rules (the Word script maps paragraphs sequentially):**
- Include ONLY the body paragraphs — no name, no sub-headline, no contact info, no date,
  no company address, no "Objet:" line, no "Madame/Monsieur", no "Cordialement/Zachary Berlo"
- 4 paragraphs standard: opening · body1 · body2 · closing
- Each paragraph on its own line with a blank line between

---

## Application Notes

**Role:** [Job Title] @ [Company]
**Location:** [City (Dept)]
**Priority:** [A/B]  ·  **CV Approach:** [approach]  ·  **Zone:** [zone]
**Job URL:** [url if available]

**IMPORTANT — Role and Location must be on their own dedicated lines as shown above.**
**The Word script reads these exact labels to build the company addressee and subject line.**

### Key selling points for this application
- [experience that maps to requirement 1]
- [experience that maps to requirement 2]
- [any differentiator]

### Red flags to manage
- [e.g. "Salary not confirmed — raise at offer stage, not before"]

### Before submitting
- [ ] Verify company address in CL header
- [ ] [other checks — hybrid policy, hiring manager name, etc.]
```

---

## Step 7 — Update Supabase Row

```sql
UPDATE job_applications
SET status = 'Docs Ready',
    docs_url = $1,
    notes = COALESCE(notes,'') || $2
WHERE id = $3
```
Pass `[notion_page_url, ' | Docs drafted ' || today_date, row_id]`.

---

## Step 8 — Run Word Populate Scripts

Run both scripts via Bash from the repo root:

| CV Approach | Language | --approach flag |
|---|---|---|
| FP&A Focus | FR | `fpa-fr` |
| FP&A Focus | EN | `fpa-en` |
| Cost Control Focus | FR | `costcontrol-fr` |
| Standard / RAF | FR | `raf-fr` |
| Transformation Focus | EN | `hof-en` |

```bash
py scripts/populate_cv.py [PAGE_ID] --approach [FLAG]
py scripts/populate_cl.py [PAGE_ID]
```

Replace `[PAGE_ID]` with the Notion page ID from Step 6 and `[FLAG]` with the mapped approach.
If either script fails, report the error and stop.

---

## Step 8b — Upload to Google Drive (optional)

1. Try `mcp__claude_ai_Google_Drive__list_recent_files`. If fails, skip silently.
2. If Drive available: search for "Job Applications" folder, upload CV+CL .docx files.
3. Update Supabase notes: `UPDATE job_applications SET notes=notes||' | Drive: [links]' WHERE id=$1`

---

## Step 9 — Output Summary

```
Documents drafted for [Job Title] @ [Company]:

📄 Notion page: [Application Documents URL]
   └── Tailored CV / Cover Letter / Application Notes

📝 Word files:
   └── Local: outputs/[CV filename]
   └── Local: outputs/[CL filename]

🔗 Job posting: [Job URL — for ChatGPT writing review against JD]

Next steps:
1. Open the Word files — review CV headline and LM opener first.
2. Paste the JD link above into ChatGPT to cross-check writing against requirements.
3. Review the Application Notes for anything to verify before submitting.
4. When submitted, run /job-status to mark as Applied.
```
