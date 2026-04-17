---
description: Update specific sections of the User Profile & Config page in Notion without re-running the full setup. Use for quick changes — salary target, new skills, location zones, adding job titles, etc. Trigger with /job-user-profile or when the user says "update my profile" or "change my salary / location / skills".
argument-hint: Optional. Describe what to update (e.g. "salary floor" or "add job title CFO"). Leave blank to see the full profile and pick a section.
allowed-tools: mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-update-page
---

# Profile Update

## Step 1 — Load current profile

Search Notion for the page titled "⚙️ User Profile & Config" using `mcp__claude_ai_Notion__notion-search`, then fetch it.
If not found, halt: "User Profile not found — run /job-user-setup to create your profile first."

## Step 2 — Identify what to update

If `$ARGUMENTS` is provided, interpret it as a natural-language update request.
Examples:
- "salary floor" → update Section 2 (Role & Compensation)
- "add job title CFO" → add to Section 5 (Job Title Alerts)
- "new city" or "location" → update Sections 1 and 4 (Identity + Location Zones)
- "skills" or "background" → update Section 3 (Background Keywords)

If no arguments, show a numbered menu of the 10 profile sections and ask:
> "Which section would you like to update? (Type a number or describe the change)"

## Step 3 — Ask for the new value

For the relevant section, ask one focused question in plain language.
Show the current value first so the user can see what they're changing.

Example:
> "Your current salary floor is €55,000. What would you like to change it to?"

## Step 4 — Update Notion

Call `mcp__claude_ai_Notion__notion-update-page` to save the change to the profile page.
Confirm in plain language:
> "Done — [what changed]. The change takes effect immediately for all skills."

## Notes

- Multiple changes in one session: after each update, ask "Anything else to update?"
- For location zone changes (Section 4): ask for the base city, then suggest sensible Green/Yellow/Orange/Red zones based on geography. Show the proposed zones before saving.
- For job title additions (Section 5): suggest related titles the user might have missed, based on what they're adding.
