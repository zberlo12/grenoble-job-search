---
description: Track networking contacts and follow-ups for your job search. Shows who needs a follow-up today, logs new conversations, creates Google Calendar reminders, and suggests which contacts to reach out to for specific companies. Trigger with /job-networking.
argument-hint: Blank (→ show today's follow-up list). Or pass a company or contact name to look up.
allowed-tools: mcp__claude_ai_Google_Calendar__create_event, mcp__claude_ai_Google_Calendar__list_events, Bash
---

# Networking

## Step 0 — Load Config

Run `cat config.json` via Bash. Parse the output and extract:
- `supabase_connection_string` → PG_CONN
- `pg_module_path` → PG_MODULE
- `user.name` → name

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

## Step 1 — Show today's follow-up list

```sql
SELECT id, name, company, role, last_contact, next_followup, notes
FROM networking_contacts
WHERE next_followup <= CURRENT_DATE
ORDER BY next_followup ASC
```

If no rows: say "No follow-ups due today." and proceed to Step 2.
If any, show:

```
Follow-ups due:
| # | Name | Company | Role | Last Contact | Due date | Note |
| 1 | ... | ... | ... | ... | ... | ... |
```

---

## Step 2 — Options menu

Ask:
> "What would you like to do?
> 1. Log a conversation
> 2. Add a new contact
> 3. Find contacts at a specific company
> 4. See all contacts
> Type a number, or 'done' to finish."

If `$ARGUMENTS` is a company or person name: jump straight to Option 3 or look up that contact.

---

### Option 1 — Log a conversation

Ask: "Who did you speak with?" (accept name or number from the follow-up list)
Ask: "What did you discuss? (1–2 sentences)"
Ask: "When should you follow up again? (e.g. 'in 2 weeks', '15 May', or 'skip')"

Update the row:
```sql
UPDATE networking_contacts
SET last_contact = CURRENT_DATE,
    notes = COALESCE(notes,'') || E'\n' || $1,
    next_followup = $2
WHERE id = $3
```
Pass `['[today]: [conversation note]', parsed_date_or_null, row_id]`.

If a follow-up date was given, create a Google Calendar event:
- Title: `Follow up — [Name] @ [Company]`
- Date: follow-up date (all-day)
- Description: conversation note

Confirm: "Logged. Calendar reminder set for [date]."

---

### Option 2 — Add a new contact

Ask for (one at a time):
1. Full name
2. Company
3. Their role/title
4. How you know them (Former colleague / Recruiter / Friend / LinkedIn / Other)
5. Any notes about this contact
6. "When do you want to follow up? (optional)"

```sql
INSERT INTO networking_contacts
(name, company, role, notes, next_followup)
VALUES ($1, $2, $3, $4, $5)
RETURNING id
```

If follow-up date given: also create Google Calendar event.
Confirm: "Contact added: [Name] @ [Company]."

---

### Option 3 — Find contacts at a company

```sql
SELECT id, name, company, role, last_contact, next_followup, notes
FROM networking_contacts
WHERE company ILIKE $1
ORDER BY last_contact DESC NULLS LAST
```
Pass `['%company_name%']`.

Also query job applications:
```sql
SELECT id, job_title, status, job_url
FROM job_applications
WHERE company ILIKE $1 AND status NOT IN ('Dismissed', 'Rejected')
ORDER BY date_added DESC
```

Output:
```
Contacts at [Company]:
- [Name] — [Role] — last contact: [date] — [warm/not warm]

Job listings at [Company]:
- [Title] — [Status] — [link]
```

Suggest: "Consider reaching out to [warmest contact] — last spoke [N] days ago."

---

### Option 4 — All contacts

```sql
SELECT id, name, company, role, last_contact, next_followup
FROM networking_contacts
ORDER BY next_followup ASC NULLS LAST, last_contact DESC NULLS LAST
```

Show full table sorted by next follow-up:

```
| # | Name | Company | Role | Last Contact | Next Follow-up |
```
