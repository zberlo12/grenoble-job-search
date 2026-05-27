---
description: Generate a personalised interview briefing pack for a specific job application. Fetches job and candidate data from Supabase, researches the company, then stores the briefing in the interview_prep table. Trigger with /job-interview-prep or when a listing reaches Interview status.
argument-hint: Blank (→ list all Interview rows to pick from), a number from that list, or a company/title search string.
allowed-tools: WebFetch, Bash
---

# Interview Prep

## Step 0 — Load Config

Run `cat config.json` via Bash. Parse the output and extract:
- `supabase_connection_string` → PG_CONN
- `pg_module_path` → PG_MODULE
- `user.name` → name
- `user.profile_id` → user_profile
- `user.base_city` → base location
- `background` → functional_expertise, key_systems (for fit assessment)

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

**REST API mode (remote triggers):** When `SUPABASE_URL` and `SUPABASE_KEY` are provided via trigger config instead (TCP ports 5432/6543 are blocked in remote environments), skip `cat config.json` and use `curl` for all DB calls:

```bash
# SELECT
curl -s "SUPABASE_URL/rest/v1/<table>?<filters>&select=<cols>&order=<col>.<dir>&limit=<n>" \
  -H "apikey: SUPABASE_KEY" -H "Authorization: Bearer SUPABASE_KEY"

# INSERT (returns inserted row)
curl -s -X POST "SUPABASE_URL/rest/v1/<table>" \
  -H "apikey: SUPABASE_KEY" -H "Authorization: Bearer SUPABASE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '<JSON>'

# UPDATE
curl -s -X PATCH "SUPABASE_URL/rest/v1/<table>?<filter>" \
  -H "apikey: SUPABASE_KEY" -H "Authorization: Bearer SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '<JSON>'

# UPSERT (ON CONFLICT DO UPDATE)
curl -s -X POST "SUPABASE_URL/rest/v1/<table>" \
  -H "apikey: SUPABASE_KEY" -H "Authorization: Bearer SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates,return=representation" \
  -d '<JSON>'
```

Filter operators: `col=eq.val` · `col=ilike.*val*` · `col=gte.val` · `col=lt.val` · `col=in.(a,b)` · `col=not.in.(a,b)` — multiple filters ANDed with `&`.
UNION queries: run two separate GETs and treat as found if either returns results.

---

## Step 1 — Identify the target row

If `$ARGUMENTS` is blank:
```sql
SELECT id, job_title, company, date_applied,
       (CURRENT_DATE - COALESCE(date_applied, date_added))::int AS days_waiting
FROM job_applications
WHERE status = 'Interview'
ORDER BY COALESCE(date_applied, date_added) ASC
```

Show:
```
Interview rows:
| # | Title | Company | Date Applied | Days waiting |
| 1 | [title] | [company] | [date] | [N days] |
```

If only one row: use it automatically without asking.
If multiple: ask "Which one? (enter a number)"

If `$ARGUMENTS` is a number → use the row at that position.
If `$ARGUMENTS` is a string → search:
```sql
SELECT id, job_title, company, date_applied
FROM job_applications
WHERE status = 'Interview'
  AND (job_title ILIKE $1 OR company ILIKE $1)
```

Fetch the full row. Extract: job_title, company, location, notes, red_flags, job_url, salary.

---

## Step 2 — Gather information in parallel

Run all three simultaneously:

**A. Candidate Profile**
Query the `candidate_profile` table:
```sql
SELECT experience_summary, fp_and_a_highlights, cost_control_highlights,
       p2p_highlights, cl_rules, tone_profile, language_notes
FROM candidate_profile
WHERE user_email = (SELECT email FROM config -- use user.email from config.json)
LIMIT 1
```
Extract: all populated fields — metrics, achievements, talking points, background keywords, cl_rules, tone_profile.

**B. Full job description**
If job_url exists and is not a LinkedIn URL:
- Call WebFetch: "Extract: company description, role responsibilities, required experience and skills, seniority level, team structure, reporting line, any cultural signals, salary or compensation if mentioned."
If LinkedIn or WebFetch returns nothing useful:
- Use the notes field from the database row as the JD source.

**C. Company background**
If company name is known (not "Not disclosed"):
- Call WebFetch on `[company].com` or `[company].fr` with prompt: "What does this company do? What sector? Approx size or revenue? Any recent news in the past 12 months? Is English used?"
- If blocked or no result: skip and note "company info not available online"

---

## Step 3 — Build the briefing pack

Compose the full brief as a text block:

```
# Interview Brief — [Job Title] @ [Company]
Date: [today]   |   Interview type: [from Notes if stated, else "TBC"]

---

## About [Company]
[2–3 sentences from WebFetch. If unavailable: "Review [Job URL] for company background."]

---

## Role summary
[4–5 sentences: scope, seniority, team size if known, reporting line, key responsibilities. Written from the interviewer's perspective — what they need.]

---

## Your strongest fits
[3–5 bullet points:]
✓ [JD requirement] → [your direct evidence from Candidate Profile]

---

## Likely interview questions
[8–10 questions with 1-sentence answer starters from your profile. Mix:]
- Competency: "Tell me about a time you [X]..."
- Technical: "How do you approach [forecasting / closing / P2P process]?"
- Situational: "How would you handle [scenario]?"
- Cultural fit: "What kind of environment do you work best in?"

Format:
**Q: [question]**
Starter: [your opening line — specific, not generic]

---

## Questions to ask them
[4–5 smart questions tailored to this role and company:]
- 1 question about success criteria / first 90 days
- 1 question about the finance team structure
- 1 question about systems / ERP if relevant
- 1–2 questions probing red flags or uncertainties from the row

---

## Watch for / probe
[From the red_flags field and uncertainties in notes. E.g.:]
- "Hybrid policy not confirmed — ask directly"
- "Salary not discussed — prepare a range"
```

---

## Step 4 — Save to interview_prep table

```sql
INSERT INTO interview_prep (job_application_id, user_profile, company, job_title, content)
VALUES ($1, $2, $3, $4, $5)
```
Pass `[row_id, user_profile, company, job_title, full_brief_text]`.

Then update the job row notes:
```sql
UPDATE job_applications
SET notes = COALESCE(notes,'') || ' | Interview brief saved ' || CURRENT_DATE::text
WHERE id = $1
```

---

## Step 5 — Output to user

Display the full brief inline in the conversation, then show:

```
Interview brief saved to database (interview_prep id: [id]).

[Company] — [Job Title]

Tip: [one context-specific piece of advice based on role type and company]
```
