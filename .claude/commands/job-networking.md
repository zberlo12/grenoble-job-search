---
description: Track networking contacts and follow-ups for your job search. Shows who needs a follow-up today, logs new conversations, creates Google Calendar reminders, and suggests which contacts to reach out to for specific companies. Trigger with /job-networking.
argument-hint: Blank (→ show today's follow-up list). Or pass a company or contact name to look up.
allowed-tools: mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-update-page, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Google_Calendar__create_event, mcp__claude_ai_Google_Calendar__list_events
---

# Networking

## Step 0 — Load User Profile

Search Notion for the page titled "⚙️ User Profile & Config" using `mcp__claude_ai_Notion__notion-search`, then fetch the first result using `mcp__claude_ai_Notion__notion-fetch`.
Extract into context: **Section 1** (user name), **Section 7** (Networking Contacts DB ID, Job Applications data source ID).
If no page is found, halt: "User Profile not found in Notion — run /job-user-setup to create your profile first."

If the Networking Contacts DB ID is not yet in the profile, halt:
"Networking Contacts database not set up yet. Run /job-user-setup (or add the DB to Section 7 of your User Profile & Config page) to enable this skill."

---

## Step 1 — Show today's follow-up list

Fetch the Networking Contacts database (ID from profile Section 7).
Filter to rows where `Next Follow-up` ≤ today. Sort by Next Follow-up ascending.

If none: say "No follow-ups due today." and proceed to Step 2.
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

Update the Notion row:
- `Last Contact` → today
- `Notes` → append: `[today's date]: [conversation note]`
- `Next Follow-up` → parsed follow-up date (if given)

If a follow-up date was given:
- Create a Google Calendar event via `mcp__claude_ai_Google_Calendar__create_event`:
  - Title: `Follow up — [Name] @ [Company]`
  - Date: follow-up date (all-day event)
  - Description: conversation note from this log entry
- Confirm: "Logged. Calendar reminder set for [date]."

If 'skip': "Logged. No follow-up reminder set."

---

### Option 2 — Add a new contact

Ask for (one at a time):
1. Full name
2. Company
3. Their role/title
4. How you know them (Former colleague / Recruiter / Friend / LinkedIn / Other)
5. Any notes about this contact
6. "When do you want to follow up? (optional)"

Create a new row in Networking Contacts with all fields populated.
If follow-up date given: also create Google Calendar event.
Confirm: "Contact added: [Name] @ [Company]."

---

### Option 3 — Find contacts at a company

Accept a company name.
Filter Networking Contacts for rows where Company matches (case-insensitive).
Also search Job Applications DB for any current listings at that company.

Output:
```
Contacts at [Company]:
- [Name] — [Role] — last contact: [date] — [warm/not warm]
- ...

Job listings at [Company]:
- [Title] — [Status] — [link]
```

Suggest: "Consider reaching out to [warmest contact] — last spoke [N] days ago."

---

### Option 4 — All contacts

Fetch all rows from Networking Contacts. Show full table sorted by Next Follow-up (nulls last):

```
| # | Name | Company | Role | Relationship | Last Contact | Next Follow-up | Warm |
```
