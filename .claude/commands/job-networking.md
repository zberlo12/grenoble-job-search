---
description: Track networking contacts and follow-ups for your job search. Shows who needs a follow-up today, logs new conversations, creates Google Calendar reminders, and suggests which contacts to reach out to for specific companies. Trigger with /job-networking.
argument-hint: Blank (→ show today's follow-up list). Or pass a company or contact name to look up.
allowed-tools: mcp__claude_ai_Google_Calendar__create_event, mcp__claude_ai_Google_Calendar__list_events, Bash
---

# Networking

## Step 0 — Load Config

Read `.claude/rules/db.md` and use `scripts/db.js` for all database access below.

Run `cat config.json` via Bash and extract `user.name`, `user.profile_id` → USER_PROFILE.

---

## Step 1 — Show today's follow-up list

```sql
SELECT id, name, company, role, last_contact, next_followup, notes
FROM networking_contacts
WHERE next_followup <= CURRENT_DATE
  AND user_profile = '<USER_PROFILE>'
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
Ask: "When should you follow up again? (e.g. 'in 2 weeks', '15 May') — defaults to 2 weeks from today if you just hit Enter. Type 'skip' only if this contact genuinely needs no follow-up (e.g. a dead end)."

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
6. "When do you want to follow up? Defaults to 2 weeks from today if you just hit Enter — type 'skip' only if this contact needs no follow-up."

```sql
INSERT INTO networking_contacts
(name, company, role, notes, next_followup, user_profile)
VALUES ($1, $2, $3, $4, $5, $6)
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
  AND user_profile = $2
ORDER BY last_contact DESC NULLS LAST
```
Pass `['%company_name%', USER_PROFILE]`.

Also query job applications:
```sql
SELECT id, job_title, status, job_url
FROM job_applications
WHERE company ILIKE $1 AND status NOT IN ('Dismissed', 'Rejected')
  AND user_profile = $2
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
WHERE user_profile = '<USER_PROFILE>'
ORDER BY next_followup ASC NULLS LAST, last_contact DESC NULLS LAST
```

Show full table sorted by next follow-up:

```
| # | Name | Company | Role | Last Contact | Next Follow-up |
```
